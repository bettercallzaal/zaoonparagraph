#!/usr/bin/env node
// The ZAO desk: the terminal jobs in this repo, behind one owner-only page.
// Node built-ins only, no npm and no build, like the rest of this repo.
//
//   DASHBOARD_PASSWORD=... node dashboard/server.mjs
//
// It does not reimplement the pipeline. Every job below spawns the existing script in
// automation/, and the output goes to the page as it was printed. See dashboard/README.md.

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---- config: environment and the gitignored .env only, never a value in this file ----

export function loadConfig(env = process.env) {
  const root = path.resolve(env.DASHBOARD_REPO_ROOT || path.join(HERE, '..'));
  const fileEnv = {};
  const envPath = path.join(root, '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*)"?\s*$/);
      if (m) fileEnv[m[1]] = m[2];
    }
  }
  const get = (k) => env[k] ?? fileEnv[k] ?? '';
  const host = get('DASHBOARD_HOST') || '127.0.0.1';
  const port = Number(get('DASHBOARD_PORT') || 4173);
  const allowed = new Set(['127.0.0.1', 'localhost', '[::1]']);
  for (const h of get('DASHBOARD_ALLOWED_HOSTS').split(',')) if (h.trim()) allowed.add(h.trim().toLowerCase());
  return {
    root, host, port, allowedHosts: allowed,
    password: get('DASHBOARD_PASSWORD'),
    live: get('DASHBOARD_LIVE') === '1',
    secureCookie: get('DASHBOARD_SECURE_COOKIE') === '1',
    apiKey: get('PARAGRAPH_API_KEY'),
    canvaUrl: get('CANVA_ZABAL_DESIGN_URL'),
    bash: get('DASHBOARD_BASH') || 'bash',
    python: get('DASHBOARD_PYTHON') || 'python3',
    apiBase: get('DASHBOARD_PARAGRAPH_API') || 'https://public.api.paragraph.com/api/v1',
    baseEnv: env,
  };
}

const PUB_ID = 'DB7iU1HMVzTT9bI4ec6X';
const SESSION_MS = 12 * 3600 * 1000;
const MAX_JSON = 2 * 1024 * 1024;
const MAX_UPLOAD = 10 * 1024 * 1024;   // the Drive and Canva covers run well under this
const MAX_OUTPUT = 2 * 1024 * 1024;
const MAX_RUNNING = 2;                 // low-memory machines: test-all alone spawns hundreds of curls
const POST_ID = /^[A-Za-z0-9_-]{6,64}$/;

// ---- small helpers, exported for the tests ----

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** A repo-relative path under one of the allowed folders, or an error. Follows symlinks. */
export function safeRel(root, rel, { prefixes, exts }) {
  if (typeof rel !== 'string' || !rel || rel.includes('\0') || rel.includes('\\')) throw new HttpError(400, 'bad path');
  const norm = path.posix.normalize(rel);
  if (norm !== rel || norm.startsWith('/') || norm.startsWith('..') || /(^|\/)\.[^/]/.test(norm)) throw new HttpError(400, 'bad path');
  if (!prefixes.some((p) => norm.startsWith(p))) throw new HttpError(403, 'that folder is off limits');
  if (exts && !exts.includes(path.extname(norm).toLowerCase())) throw new HttpError(400, 'that file type is off limits');
  const full = path.join(root, norm);
  const parentReal = realExisting(path.dirname(full));
  const rootReal = fs.realpathSync(root);
  if (parentReal !== rootReal && !parentReal.startsWith(rootReal + path.sep)) throw new HttpError(403, 'outside the repo');
  return { rel: norm, full };
}

function realExisting(p) {
  let cur = p;
  while (!fs.existsSync(cur)) cur = path.dirname(cur);
  return fs.realpathSync(cur);
}

export function dayOfYear(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
}

export function easternDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

const sha = (s) => crypto.createHash('sha256').update(s).digest();
const hashText = (s) => crypto.createHash('sha1').update(s).digest('hex');

/** Same test test-all.sh uses to decide what is an edition: content, never filename. */
export function isEdition(text) {
  return /^[ \t]*zm[.!]?[ \t]*$/im.test(text) || text.includes('BetterCallZaal on behalf of the ZABAL Team');
}

export function describeFile(rel, text, ids) {
  const base = path.posix.basename(rel, '.md');
  const titleLine = text.match(/^# (.+)$/m);
  const sub = text.match(/SUBTITLE \(Paragraph field[^)]*\)\s*:?\s*([\s\S]*?)-->/) || text.match(/Subtitle: ([\s\S]*?)-->/);
  const day = (base.match(/day-(\d{1,3})/) || (titleLine ? titleLine[1].match(/Day (\d{1,3})\b/) : null) || [])[1];
  const date = (base.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
  const body = text.replace(/<!--[\s\S]*?-->/g, '');
  const folder = rel.startsWith('published/') ? 'published' : rel.startsWith('drafts/archive/') ? 'archive' : rel.startsWith('drafts/zaostock/') ? 'zaostock' : 'drafts';
  return {
    path: rel, name: base, folder, date, day: day ? Number(day) : null,
    title: titleLine ? titleLine[1].trim() : base,
    subtitle: sub ? sub[1].replace(/\s+/g, ' ').trim() : '',
    words: body.split(/\s+/).filter(Boolean).length,
    postId: ids[rel] || null,
    edition: isEdition(text),
    slots: (body.match(/\[(FILL|CUT|CHECK|TODO)/g) || []).length,
  };
}

function walkMd(dir, out = [], depth = 0) {
  if (!fs.existsSync(dir) || depth > 3) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(p, out, depth + 1);
    else if (e.name.endsWith('.md') && e.name !== 'README.md') out.push(p);
  }
  return out;
}

/** Parse what status.sh printed. status.sh stays the only place that decides drift. */
export function parseStatus(text) {
  const missing = [];
  let unknown = null;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^NO RECORD: (\S+)\s+(.*) \(([^)]+)\)$/);
    if (m) missing.push({ date: m[1], title: m[2], postId: m[3] });
    const u = line.match(/^drift: UNKNOWN - (.*)$/);
    if (u) unknown = u[1];
  }
  return { missing, unknown };
}

// ---- the app ----

export function createApp(cfg) {
  const sessions = new Map();
  const fails = new Map();
  const jobs = new Map();
  let jobSeq = 0;
  let statusCache = null;
  let liveCache = null;
  let driftRun = null;

  const scriptEnv = () => {
    const env = { ...cfg.baseEnv };
    for (const k of Object.keys(env)) if (k.startsWith('DASHBOARD_')) delete env[k];
    if (cfg.apiKey) env.PARAGRAPH_API_KEY = cfg.apiKey;
    env.PYTHONDONTWRITEBYTECODE = '1';
    return env;
  };
  const scrub = (s) => (cfg.apiKey ? s.split(cfg.apiKey).join('[key hidden]') : s);

  const readIds = () => {
    try { return JSON.parse(fs.readFileSync(path.join(cfg.root, 'automation/post-ids.json'), 'utf8')); } catch { return {}; }
  };

  // Runs one program with an argument list, never through a shell string.
  function run(cmd, args, { env, onData, timeoutMs = 15 * 60000, input } = {}) {
    return new Promise((resolve) => {
      let child;
      try {
        child = spawn(cmd, args, { cwd: cfg.root, env: { ...scriptEnv(), ...(env || {}) }, windowsHide: true });
      } catch (e) { resolve({ code: 127, output: String(e.message) + '\n' }); return; }
      let output = '';
      const push = (b) => {
        const s = scrub(b.toString('utf8'));
        if (output.length < MAX_OUTPUT) output += s;
        if (onData) onData(s);
      };
      const t = setTimeout(() => { push(Buffer.from('\nTIMED OUT, stopped.\n')); child.kill(); }, timeoutMs);
      child.stdout.on('data', push);
      child.stderr.on('data', push);
      child.on('error', (e) => { clearTimeout(t); push(Buffer.from('CANNOT RUN: ' + e.message + '\n')); resolve({ code: 127, output }); });
      child.on('close', (code) => { clearTimeout(t); resolve({ code: code ?? 1, output }); });
      if (input) child.stdin.end(input); else child.stdin.end();
    });
  }

  const sh = (script, ...args) => [cfg.bash, [`automation/${script}`, ...args]];
  const py = (script, ...args) => [cfg.python, ['-I', `automation/${script}`, ...args]];
  const draftPath = (p) => safeRel(cfg.root, p, { prefixes: ['drafts/'], exts: ['.md'] }).rel;
  const anyEdition = (p) => safeRel(cfg.root, p, { prefixes: ['drafts/', 'published/'], exts: ['.md'] }).rel;
  const postId = (v) => { if (!POST_ID.test(v || '')) throw new HttpError(400, 'that is not a Paragraph post id'); return v; };
  const need = (file) => { if (!fs.existsSync(path.join(cfg.root, file))) throw new HttpError(404, `${file} does not exist`); return file; };

  // Read straight from .git: spawning git on every page load is slow on a small machine.
  async function currentBranch() {
    try {
      let dir = path.join(cfg.root, '.git');
      if (fs.statSync(dir).isFile()) dir = path.resolve(cfg.root, fs.readFileSync(dir, 'utf8').replace(/^gitdir:\s*/, '').trim());
      const head = fs.readFileSync(path.join(dir, 'HEAD'), 'utf8').trim();
      const m = head.match(/^ref: refs\/heads\/(.+)$/);
      return m ? m[1] : 'HEAD';
    } catch {
      return (await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).output.trim();
    }
  }

  // Refuse a body update on a post already live: update-draft.sh cannot see status, and
  // an update without status published can unpublish it (docs/paragraph-platform-surfaces.md).
  async function assertNotLive(id) {
    const p = await readPost(id);
    if (p.found && (p.status === 'published' || p.public)) {
      throw new HttpError(409, 'That post is live on Paragraph. The script is for drafts only, so nothing was sent.');
    }
  }

  // ---- catalogue. risk: read runs at once. local writes this checkout. remote reaches
  // ---- Paragraph or GitHub, and only ever fires with DASHBOARD_LIVE=1.
  const CATALOGUE = {
    voice: { risk: 'read', label: 'Voice check', build: (a) => {
      const mode = a.mode === 'announcement' ? '--announcement' : '--daily';
      return sh('check-voice.sh', mode, need(anyEdition(a.path)));
    } },
    links: { risk: 'read', label: 'Link check', build: (a) => sh('check-links.sh', need(anyEdition(a.path))) },
    paste: { risk: 'read', label: 'Agent paste', build: (a) => sh('make-agent-paste.sh', need(draftPath(a.path))) },
    status: { risk: 'read', label: 'Queue and drift', build: () => sh('status.sh') },
    'test-all': { risk: 'read', label: 'Full health check', build: () => sh('test-all.sh') },
    'check-published': { risk: 'read', label: 'Tracked drafts against Paragraph', build: () => sh('check-published.sh') },
    'voice-test': { risk: 'read', label: 'Voice gate self-test', build: () => sh('test-check-voice.sh') },
    'stage-test': { risk: 'read', label: 'Socials self-test', build: () => py('test-stage-socials.py') },
    'facts-test': { risk: 'read', label: 'Fact check self-test', build: () => py('test-check-social-facts.py') },
    'record-test': { risk: 'read', label: 'Record self-test', build: () => py('test-record-edition.py') },
    analytics: { risk: 'read', label: 'Analytics', build: (a) => {
      if (!a.sql) return sh('analytics.sh');
      if (typeof a.sql !== 'string' || a.sql.length > 4000 || !/^\s*(select|with)\b/i.test(a.sql) || /;\s*\S/.test(a.sql)) throw new HttpError(400, 'Ad hoc queries are one SELECT only.');
      return sh('analytics.sh', '--sql', a.sql);
    } },
    wins: { risk: 'read', label: 'Collect wins', build: (a) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(a.since || '')) throw new HttpError(400, 'Pick a date.');
      return sh('collect-wins.sh', a.since);
    } },
    'socials-stage': { risk: 'read', label: 'Stage socials', build: (a) => py('stage-socials.py', postId(a.postId), '--json') },
    'socials-facts': { risk: 'read', label: 'Fact check socials', build: (a) => {
      const files = (a.socials || []).map((f) => need(safeRel(cfg.root, f, { prefixes: ['drafts/socials/'], exts: ['.md'] }).rel));
      if (!files.length) throw new HttpError(400, 'Pick a socials set.');
      return py('check-social-facts.py', need(anyEdition(a.edition)), ...files);
    } },
    'record-preview': { risk: 'read', label: 'Preview the record', build: (a) => py('record-edition.py', postId(a.postId), '--dry-run') },

    record: { risk: 'local', label: 'Record the day', build: (a) => py('record-edition.py', postId(a.postId)),
      plan: (a) => [`Reads post ${a.postId} from Paragraph. Reads only.`, 'Writes published/<date>-day-<n>.md, post-ids.json and two rows in published/README.md in this checkout.', 'Nothing is committed until you save to GitHub.'] },
    archive: { risk: 'local', label: 'Move draft to published', build: (a) => sh('archive-issue.sh', need(draftPath(a.path))),
      plan: (a) => [`Moves ${a.path} into published/ and remaps its post id.`, 'Only for an edition that is live. Record the day is the better route if the live text changed.'] },
    'retire-draft': { risk: 'local', label: 'Retire draft', build: (a) => {
      const rel = need(draftPath(a.path));
      if (rel.startsWith('drafts/archive/')) throw new HttpError(400, 'Already retired.');
      return ['git', ['mv', '--', rel, 'drafts/archive/' + path.posix.basename(rel)]];
    }, plan: (a) => [`Moves ${a.path} into drafts/archive/. It stays in git history.`, 'Its Paragraph draft, if there is one, is not touched.'] },
    'render-cover': { risk: 'local', label: 'Render with the script', build: (a) => {
      const bg = need(safeRel(cfg.root, a.background, { prefixes: ['drafts/media/'], exts: ['.png', '.jpg', '.jpeg'] }).rel);
      const day = String(a.day || '');
      if (!/^\d{1,3}$/.test(day)) throw new HttpError(400, 'Pick a day number.');
      const browse = path.join(cfg.baseEnv.HOME || cfg.baseEnv.USERPROFILE || '', '.claude/skills/gstack/browse/dist/browse');
      // Checked here because the script's set -e would exit past its own cleanup and leave
      // its python http.server running on the port.
      if (!fs.existsSync(browse) && !fs.existsSync(browse + '.exe')) throw new HttpError(409, 'render-thumbnail.sh needs the gstack browse tool, which is not on this machine. Use Generate on this page: same template, no tool needed.');
      return sh('render-thumbnail.sh', bg, day, `drafts/media/covers/day-${day}-cover.png`);
    }, plan: (a) => [`Runs render-thumbnail.sh on ${a.background} for Day ${a.day}.`] },
    commit: { risk: 'local', label: 'Commit', steps: async (a) => {
      const files = await commitFiles(a.files);
      const msg = String(a.message || '').trim();
      if (!msg || msg.length > 200) throw new HttpError(400, 'Write a commit message.');
      const steps = [];
      const branch = await currentBranch();
      if (branch === 'main' || branch === 'master') {
        const name = String(a.branch || '');
        if (!/^[a-z0-9][a-z0-9/_.-]{2,60}$/.test(name) || name.includes('..')) throw new HttpError(400, 'Name a branch: this repo works PR first.');
        steps.push(['git', ['switch', '-c', name]]);
      }
      steps.push(['git', ['add', '--', ...files]], ['git', ['commit', '-m', msg, '--', ...files]]);
      return steps;
    }, plan: (a) => ['Commits to this checkout only:', ...(a.files || []).map((f) => '  ' + f), 'A branch is created first if you are on main.'] },

    'create-draft': { risk: 'remote', label: 'Push as a new Paragraph draft', build: (a) => sh('create-draft.sh', need(draftPath(a.path)), ...(a.force ? ['--force'] : [])),
      plan: (a) => [`Runs create-draft.sh on ${a.path}. Draft only: it cannot publish or send.`, a.force ? 'Skips the voice and link gates, because you ticked that.' : 'Stops if the voice or link gate fails.'] },
    'update-draft': { risk: 'remote', label: 'Update the Paragraph draft', build: (a) => sh('update-draft.sh', postId(a.postId), need(draftPath(a.path)), ...(a.force ? ['--force'] : [])),
      before: (a) => assertNotLive(a.postId),
      plan: (a) => [`Replaces the body of draft ${a.postId} with ${a.path}.`, 'Markdown replaces everything: embeds, buttons and callouts made in the editor are lost.', 'Refused if the post is live.'] },
    'set-cover': { risk: 'remote', label: 'Set the cover on Paragraph', build: (a) => {
      if (!/^https:\/\/\S+$/.test(a.url || '')) throw new HttpError(400, 'Paragraph needs a public https link to the image.');
      return sh('set-thumbnail.sh', postId(a.postId), a.url);
    }, before: (a) => assertNotLive(a.postId),
      plan: (a) => [`Sets the cover of ${a.postId} from ${a.url}.`, 'Paragraph fetches and re-hosts that link, so it has to be public right now.', 'Refused if the post is live, since an update without status published can unpublish it.'] },
    'test-email': { risk: 'remote', label: 'Send a test email', build: (a) => pub(a, '--test-email'), env: (a) => ({ CONFIRM_POST_ID: a.postId }),
      plan: (a) => [`Emails a test of draft ${a.postId} to the publication owner only.`] },
    publish: { risk: 'remote', typed: 'PUBLISH', label: 'Publish now', build: (a) => pub(a, '--publish', ...(a.newsletter ? ['--newsletter'] : [])), env: (a) => ({ CONFIRM_POST_ID: a.postId }),
      plan: (a) => [`Publishes post ${a.postId} on paragraph.com/@thezao now.`, a.newsletter ? 'EMAILS EVERY SUBSCRIBER. An email cannot be recalled.' : 'Web only, no email.', 'Refused if the body on Paragraph still carries a slot.', 'After it goes live, read the body on the live page.'] },
    schedule: { risk: 'remote', typed: 'SCHEDULE', label: 'Schedule', build: (a) => {
      if (!/^\d{13}$/.test(String(a.at || ''))) throw new HttpError(400, 'Pick a time.');
      return pub(a, '--schedule', String(a.at), ...(a.newsletter ? ['--newsletter'] : []));
    }, env: (a) => ({ CONFIRM_POST_ID: a.postId }),
      plan: (a) => [`Schedules post ${a.postId} for ${new Date(Number(a.at)).toUTCString()}.`, a.newsletter ? 'EMAILS EVERY SUBSCRIBER at that time.' : 'Web only, no email.', 'Scheduling does not lock a post. Paragraph sends whatever it says at send time, so re-read it five minutes before.'] },
    unschedule: { risk: 'remote', typed: 'UNSCHEDULE', label: 'Cancel the schedule', build: (a) => pub(a, '--unschedule'), env: (a) => ({ CONFIRM_POST_ID: a.postId }),
      plan: (a) => [`Cancels the scheduled publish of ${a.postId}. It goes back to being a draft.`] },
    push: { risk: 'remote', label: 'Push the branch', steps: async () => {
      const b = await currentBranch();
      if (b === 'main' || b === 'master' || b === 'HEAD') throw new HttpError(409, 'This repo works PR first. Commit to a branch, not main.');
      return [['git', ['push', '-u', 'origin', b]]];
    }, plan: () => ['Pushes the current branch to origin.'] },
    pr: { risk: 'remote', label: 'Open a pull request', steps: async () => {
      const b = await currentBranch();
      if (b === 'main' || b === 'master' || b === 'HEAD') throw new HttpError(409, 'Nothing to open from main.');
      return [['gh', ['pr', 'create', '--fill', '--head', b]]];
    }, plan: () => ['Opens a pull request for the current branch with gh. It does not merge.'] },
  };

  // publish-post.sh gets --dry-run from the server whenever the desk is not live.
  function pub(a, ...flags) {
    return sh('publish-post.sh', postId(a.postId), ...flags, ...(cfg.live ? [] : ['--dry-run']));
  }

  async function commitFiles(list) {
    if (!Array.isArray(list) || !list.length) throw new HttpError(400, 'Pick at least one file.');
    const changed = new Set((await gitChanges()).map((c) => c.path));
    return list.map((f) => {
      const ok = /^(drafts|published)\//.test(f) || f === 'automation/post-ids.json';
      if (!ok || !changed.has(f)) throw new HttpError(400, `${f} cannot be committed from here.`);
      return f;
    });
  }

  async function gitChanges() {
    const r = await run('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
    if (r.code !== 0) return [];
    const parts = r.output.split('\0').filter(Boolean);
    const out = [];
    for (let i = 0; i < parts.length; i++) {
      const code = parts[i].slice(0, 2);
      out.push({ code: code.trim(), path: parts[i].slice(3) });
      if (code[0] === 'R') i++;
    }
    return out;
  }

  function planFor(name, args) {
    const def = CATALOGUE[name];
    if (!def) throw new HttpError(404, 'no such job');
    const remoteDry = def.risk === 'remote' && !cfg.live;
    return {
      job: name, label: def.label, risk: def.risk, dry: remoteDry,
      typed: def.typed && !remoteDry ? def.typed : null,
      lines: def.plan ? def.plan(args) : [],
      phrase: def.typed || name,
    };
  }

  async function startJob(name, args) {
    const def = CATALOGUE[name];
    if (!def) throw new HttpError(404, 'no such job');
    const plan = planFor(name, args);
    if (def.risk !== 'read' && args.confirm !== plan.phrase) throw new HttpError(428, 'This action needs the confirm step.');
    if ([...jobs.values()].filter((j) => j.state === 'running').length >= MAX_RUNNING) throw new HttpError(429, 'Two jobs are already running. Give them a minute.');

    // Build first, so a bad argument is refused even in a dry run.
    const passthrough = name === 'publish' || name === 'schedule' || name === 'unschedule' || name === 'test-email';
    const steps = def.steps ? await def.steps(args) : [def.build(args)];
    const id = String(++jobSeq);
    const job = { id, name, label: def.label, state: 'running', code: null, output: '', dry: plan.dry, startedAt: Date.now(), args: publicArgs(args) };
    jobs.set(id, job);
    if (jobs.size > 40) jobs.delete(jobs.keys().next().value);

    if (plan.dry && !passthrough) {
      job.output = `DRY RUN, nothing sent. DASHBOARD_LIVE is off.\nWould run: ${steps.map(([c, a]) => [c, ...a].join(' ')).join('\n           ')}\n`;
      job.state = 'done'; job.code = 0;
      return job;
    }

    (async () => {
      try {
        if (def.before && !plan.dry) await def.before(args);
        let last = { code: 0 };
        for (const [cmd, argv] of steps) {
          job.output += `$ ${[cmd, ...argv].map((x) => (/\s/.test(x) ? JSON.stringify(x) : x)).join(' ')}\n`;
          last = await run(cmd, argv, { env: def.env && !plan.dry ? def.env(args) : undefined, onData: (s) => { if (job.output.length < MAX_OUTPUT) job.output += s; } });
          if (last.code !== 0) break;
        }
        job.code = last.code;
        job.state = last.code === 0 ? 'done' : 'failed';
      } catch (e) {
        job.output += (e.message || String(e)) + '\n';
        job.code = 1; job.state = 'failed';
      }
      statusCache = null;
    })();
    return job;
  }

  const publicArgs = (a) => { const { confirm, ...rest } = a; return rest; };

  // ---- reads of Paragraph, GET only ----

  async function getJson(url, headers = {}) {
    const res = await fetch(url, { headers: { 'User-Agent': 'zaoonparagraph-dashboard/1.0', Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) { const e = new Error('status ' + res.status); e.status = res.status; throw e; }
    return res.json();
  }

  async function readPost(id) {
    const out = { id, found: false, public: false, status: null };
    try {
      const pub = await getJson(`${cfg.apiBase}/posts/${id}`);
      const d = pub.post || pub;
      if (d && d.id) Object.assign(out, { found: true, public: true, status: d.status || 'published', title: d.title, subtitle: d.subtitle, slug: d.slug, imageUrl: d.imageUrl, publishedAt: d.publishedAt });
    } catch (e) { out.error = e.status === 404 ? null : e.message; }
    if (cfg.apiKey) {
      try {
        const k = await getJson(`${cfg.apiBase}/posts/${id}?includeContent=true`, { Authorization: 'Bearer ' + cfg.apiKey });
        const d = k.post || k;
        if (d && d.id) Object.assign(out, { found: true, status: d.status, title: d.title, subtitle: d.subtitle, slug: d.slug, imageUrl: d.imageUrl, scheduledAt: d.scheduledAt, markdown: d.markdown });
      } catch (e) { out.error = e.message; }
    }
    return out;
  }

  async function livePosts() {
    if (liveCache && Date.now() - liveCache.at < 5 * 60000) return liveCache.data;
    try {
      const d = await getJson(`${cfg.apiBase}/publications/${PUB_ID}/posts?limit=40`);
      const items = (d.items || []).map((p) => ({ id: p.id, title: p.title, slug: p.slug, publishedAt: Number(p.publishedAt), imageUrl: p.imageUrl }));
      liveCache = { at: Date.now(), data: { items, unknown: null } };
    } catch (e) {
      return { items: [], unknown: 'Could not reach Paragraph (' + e.message + ').' };
    }
    return liveCache.data;
  }

  // status.sh makes network calls per queued draft, so the page never waits on it to
  // paint: it asks for the answer separately and fills the panel when it lands.
  function drift() {
    if (statusCache && Date.now() - statusCache.at < 5 * 60000) return Promise.resolve(statusCache.data);
    if (driftRun) return driftRun;
    driftRun = run(cfg.bash, ['automation/status.sh'], { timeoutMs: 180000 }).then((r) => {
      const data = parseStatus(r.output);
      if (r.code > 1) data.unknown = data.unknown || 'status.sh could not run.';
      if (!data.missing.length && !/live edition\(s\)/.test(r.output) && !data.unknown) data.unknown = 'status.sh did not report. Is python3 on the PATH?';
      statusCache = { at: Date.now(), data };
      driftRun = null;
      return data;
    });
    return driftRun;
  }

  // ---- library ----

  function allEditions() {
    const ids = readIds();
    return [...walkMd(path.join(cfg.root, 'drafts/'), []), ...walkMd(path.join(cfg.root, 'published/'), [])]
      .map((f) => path.relative(cfg.root, f).split(path.sep).join('/'))
      .filter((rel) => !/^drafts\/(socials|media)\//.test(rel) && !/TRIAGE|paragraph-duplicates/.test(rel))
      .map((rel) => describeFile(rel, fs.readFileSync(path.join(cfg.root, rel), 'utf8'), ids))
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.path.localeCompare(b.path));
  }

  function coversFor(day) {
    const dir = path.join(cfg.root, 'drafts/media/covers');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f) && (day == null || f.startsWith(`day-${day}-`)))
      .sort().reverse().map((f) => `drafts/media/covers/${f}`);
  }

  function socialsSets() {
    const dir = path.join(cfg.root, 'drafts/socials');
    if (!fs.existsSync(dir)) return [];
    const sets = new Map();
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(.*?)\.(socials|linkedin|x-article)\.md$/);
      if (!m) continue;
      if (!sets.has(m[1])) sets.set(m[1], { stem: m[1], day: Number((m[1].match(/day-(\d+)/) || [])[1]) || null, files: [] });
      sets.get(m[1]).files.push('drafts/socials/' + f);
    }
    return [...sets.values()].sort((a, b) => b.stem.localeCompare(a.stem));
  }

  // ---- http plumbing ----

  const send = (res, code, body, headers = {}) => {
    const isBuf = Buffer.isBuffer(body);
    const data = isBuf || typeof body === 'string' ? body : JSON.stringify(body);
    res.writeHead(code, {
      'Content-Type': isBuf || typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...SEC_HEADERS, ...headers,
    });
    res.end(data);
  };

  const readBody = (req, limit) => new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', (c) => {
      n += c.length;
      if (n > limit) { reject(new HttpError(413, 'That is too big.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const readJson = async (req) => {
    const b = await readBody(req, MAX_JSON);
    try { return JSON.parse(b.toString('utf8') || '{}'); } catch { throw new HttpError(400, 'bad json'); }
  };

  function cookie(req, name) {
    for (const part of (req.headers.cookie || '').split(';')) {
      const [k, ...v] = part.trim().split('=');
      if (k === name) return v.join('=');
    }
    return '';
  }

  function authed(req) {
    const t = cookie(req, 'desk');
    if (!t) return false;
    const key = sha(t).toString('hex');
    const exp = sessions.get(key);
    if (!exp) return false;
    if (exp < Date.now()) { sessions.delete(key); return false; }
    return true;
  }

  const cookieLine = (value, maxAge) => `desk=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${cfg.secureCookie ? '; Secure' : ''}`;

  function passwordOk(given) {
    return crypto.timingSafeEqual(sha(String(given ?? '')), sha(cfg.password));
  }

  const ipOf = (req) => req.socket.remoteAddress || 'x';

  function loginBlocked(ip) {
    const f = fails.get(ip);
    if (!f) return false;
    if (Date.now() > f.until) { fails.delete(ip); return false; }
    return f.count >= 5;
  }

  async function handleApi(req, res, url) {
    const method = req.method;
    const p = url.pathname;

    // The two routes reachable with no session. Neither reveals or changes anything else.
    if (p === '/api/login' && method === 'POST') {
      const ip = ipOf(req);
      if (loginBlocked(ip)) throw new HttpError(429, 'Too many tries. Wait 15 minutes.');
      const body = await readJson(req);
      if (!passwordOk(body.password)) {
        const f = fails.get(ip) || { count: 0, until: 0 };
        f.count++; f.until = Date.now() + 15 * 60000;
        fails.set(ip, f);
        throw new HttpError(401, 'That is not the password.');
      }
      fails.delete(ip);
      const t = crypto.randomBytes(32).toString('base64url');
      sessions.set(sha(t).toString('hex'), Date.now() + SESSION_MS);
      return send(res, 200, { ok: true }, { 'Set-Cookie': cookieLine(t, SESSION_MS / 1000) });
    }
    if (p === '/api/session' && method === 'GET') return send(res, 200, { authed: authed(req) });

    if (!authed(req)) throw new HttpError(401, 'Sign in first.');

    if (p === '/api/logout' && method === 'POST') {
      sessions.delete(sha(cookie(req, 'desk')).toString('hex'));
      return send(res, 200, { ok: true }, { 'Set-Cookie': cookieLine('', 0) });
    }

    if (p === '/api/overview' && method === 'GET') {
      const today = easternDate();
      const live = await livePosts();
      const editions = allEditions();
      return send(res, 200, {
        today, day: dayOfYear(today),
        live: cfg.live, hasKey: Boolean(cfg.apiKey), canvaUrl: cfg.canvaUrl || null,
        editions, livePosts: live.items, liveUnknown: live.unknown,
        covers: coversFor(null),
        branch: await currentBranch(),
      });
    }

    if (p === '/api/drift' && method === 'GET') return send(res, 200, await drift());

    if (p === '/api/templates' && method === 'GET') {
      const dir = path.join(cfg.root, 'templates');
      return send(res, 200, { templates: fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)) });
    }

    if (p === '/api/file' && method === 'GET') {
      const { rel, full } = safeRel(cfg.root, url.searchParams.get('path'), { prefixes: ['drafts/', 'published/'], exts: ['.md'] });
      if (!fs.existsSync(full)) throw new HttpError(404, 'No such file.');
      const text = fs.readFileSync(full, 'utf8');
      return send(res, 200, { ...describeFile(rel, text, readIds()), content: text, hash: hashText(text), covers: coversFor(describeFile(rel, text, {}).day) });
    }

    if (p === '/api/file' && method === 'PUT') {
      const body = await readJson(req);
      // published/ is a record of what went out, so it is read only here.
      const { rel, full } = safeRel(cfg.root, body.path, { prefixes: ['drafts/'], exts: ['.md'] });
      if (rel.startsWith('drafts/archive/')) throw new HttpError(403, 'Retired drafts are read only.');
      if (typeof body.content !== 'string') throw new HttpError(400, 'No text.');
      if (fs.existsSync(full) && hashText(fs.readFileSync(full, 'utf8')) !== body.hash) throw new HttpError(409, 'This file changed on disk since you opened it. Reload before saving.');
      fs.writeFileSync(full, body.content);
      return send(res, 200, { ok: true, hash: hashText(body.content), ...describeFile(rel, body.content, readIds()) });
    }

    if (p === '/api/drafts' && method === 'POST') {
      const body = await readJson(req);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date || '')) throw new HttpError(400, 'Pick a date.');
      const tpl = String(body.template || '');
      if (!/^[a-z0-9-]+$/.test(tpl)) throw new HttpError(400, 'Pick a template.');
      const tplFile = path.join(cfg.root, 'templates', tpl + '.md');
      if (!fs.existsSync(tplFile)) throw new HttpError(404, 'No such template.');
      const day = dayOfYear(body.date);   // the day of the year of the edition's date, never typed
      const rel = `drafts/${body.date}-day-${day}.md`;
      const { full } = safeRel(cfg.root, rel, { prefixes: ['drafts/'], exts: ['.md'] });
      if (fs.existsSync(full)) throw new HttpError(409, `${rel} already exists.`);
      const text = `# Year of the ZABAL - Day ${day}\n\n<!-- SUBTITLE (Paragraph field, not body): -->\n\n<!-- Template: templates/${tpl}.md. Delete this note. -->\n\n` + fs.readFileSync(tplFile, 'utf8');
      fs.writeFileSync(full, text);
      return send(res, 200, { path: rel });
    }

    if (p === '/api/post-id' && method === 'PUT') {
      const body = await readJson(req);
      const rel = anyEdition(body.path);
      need(rel);
      const ids = readIds();
      if (body.postId) ids[rel] = postId(body.postId); else delete ids[rel];
      fs.writeFileSync(path.join(cfg.root, 'automation/post-ids.json'), JSON.stringify(ids, Object.keys(ids).sort(), 2) + '\n');
      return send(res, 200, { ok: true });
    }

    const pm = p.match(/^\/api\/post\/([^/]+)$/);
    if (pm && method === 'GET') return send(res, 200, await readPost(postId(pm[1])));

    if (p === '/api/socials' && method === 'GET') return send(res, 200, { sets: socialsSets() });

    if (p === '/api/git' && method === 'GET') {
      const branch = await currentBranch();
      const remote = (await run('git', ['remote', 'get-url', 'origin'])).output.trim();
      const repo = (remote.match(/github\.com[:/](.+?)(\.git)?$/) || [])[1] || null;
      return send(res, 200, { branch, repo, changes: await gitChanges() });
    }

    if (p === '/api/cover' && method === 'POST') {
      const day = url.searchParams.get('day') || '';
      if (!/^\d{1,3}$/.test(day)) throw new HttpError(400, 'Pick a day number.');
      const buf = await readBody(req, MAX_UPLOAD);
      const isPng = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      const isJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
      if (!isPng && !isJpg) throw new HttpError(415, 'A cover has to be a PNG or a JPG.');
      const kind = url.searchParams.get('kind') === 'generated' ? 'generated' : 'attached';
      const rel = `drafts/media/covers/day-${day}-${kind}.${isPng ? 'png' : 'jpg'}`;
      const { full } = safeRel(cfg.root, rel, { prefixes: ['drafts/media/'], exts: ['.png', '.jpg'] });
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, buf);
      return send(res, 200, { path: rel });
    }

    if (p === '/api/media' && method === 'GET') {
      const { full } = safeRel(cfg.root, url.searchParams.get('path'), { prefixes: ['drafts/media/'], exts: ['.png', '.jpg', '.jpeg'] });
      if (!fs.existsSync(full)) throw new HttpError(404, 'No such image.');
      return send(res, 200, fs.readFileSync(full), { 'Content-Type': full.endsWith('.png') ? 'image/png' : 'image/jpeg' });
    }

    if (p === '/api/plan' && method === 'POST') {
      const body = await readJson(req);
      return send(res, 200, planFor(body.job, body.args || {}));
    }

    if (p === '/api/jobs' && method === 'POST') {
      const body = await readJson(req);
      return send(res, 202, await startJob(body.job, body.args || {}));
    }
    if (p === '/api/jobs' && method === 'GET') {
      return send(res, 200, { jobs: [...jobs.values()].reverse().map(({ output, ...j }) => j) });
    }
    const jm = p.match(/^\/api\/jobs\/(\d+)$/);
    if (jm && method === 'GET') {
      const j = jobs.get(jm[1]);
      if (!j) throw new HttpError(404, 'No such job.');
      return send(res, 200, j);
    }

    throw new HttpError(404, 'No such route.');
  }

  const STATIC = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
    '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  };

  return async function handler(req, res) {
    try {
      const hostHeader = (req.headers.host || '').toLowerCase();
      const hostName = hostHeader.replace(/:\d+$/, '');
      // DNS rebinding: a page on another name must not be able to reach this server.
      if (!cfg.allowedHosts.has(hostName)) return send(res, 421, 'Unknown host.');
      const url = new URL(req.url, 'http://local');

      if (url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET') {
          // CSRF: same origin only, and a header a cross-site form cannot set.
          const origin = req.headers.origin;
          let sameOrigin = false;
          try { sameOrigin = !origin || new URL(origin).host.toLowerCase() === hostHeader; } catch { sameOrigin = false; }
          if (!sameOrigin || req.headers['x-desk'] !== '1') throw new HttpError(403, 'Cross-site request refused.');
        }
        return await handleApi(req, res, url);
      }

      const file = STATIC[url.pathname];
      if (!file || req.method !== 'GET') return send(res, 404, 'Not found.');
      return send(res, 200, fs.readFileSync(path.join(HERE, 'public', file[0])), { 'Content-Type': file[1], 'Cache-Control': 'no-cache' });
    } catch (e) {
      const status = e.status && e.status >= 400 ? e.status : 500;
      if (status === 500) console.error(e);
      if (!res.headersSent) send(res, status, { error: status === 500 ? 'Something broke on the server. See its log.' : e.message });
      else res.end();
    }
  };
}

const SEC_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https: data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
};

// ---- start ----

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cfg = loadConfig();
  if (cfg.password.length < 12) {
    console.error('Refusing to start: set DASHBOARD_PASSWORD to 12 characters or more, in the environment or in .env.');
    process.exit(2);
  }
  const server = http.createServer(createApp(cfg));
  server.listen(cfg.port, cfg.host, () => {
    console.log(`The ZAO desk: http://${cfg.host}:${cfg.port}`);
    console.log(cfg.live ? 'LIVE: writes reach Paragraph and GitHub after the confirm step.' : 'DRY RUN: nothing reaches Paragraph or GitHub. Set DASHBOARD_LIVE=1 to change that.');
    if (cfg.host !== '127.0.0.1' && cfg.host !== 'localhost') console.log('Bound past localhost. Put this behind a private network or TLS, and set DASHBOARD_SECURE_COOKIE=1 with TLS.');
  });
}
