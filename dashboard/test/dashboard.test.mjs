// node --test dashboard/test/
// Runs the real server and the real scripts against a throwaway repo. A fake curl on the
// PATH stands in for the network, so nothing here can reach Paragraph. GitHub is a local
// bare repo.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createApp, loadConfig, safeRel, dayOfYear, isEdition, parseStatus } from '../server.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PASSWORD = 'correct horse battery';
const KEY = 'fake-key-for-tests-only';
const GOOD = '# Year of the ZABAL - Day 200\n\n<!-- SUBTITLE (Paragraph field, not body): the news -->\n\nzm\n\nyear of the zabal day 200\n\n' + 'word '.repeat(60) + '\n\n- BetterCallZaal on behalf of the ZABAL Team\n';

let tmp, root, curlLog, server, base, liveServer, liveBase, paragraph, paragraphBase;
const posts = new Map();

function git(...a) { return execFileSync('git', a, { cwd: root, encoding: 'utf8' }); }

function makeConfig(live) {
  const binDir = path.join(tmp, 'bin');
  return loadConfig({
    ...process.env,
    PATH: binDir + path.delimiter + process.env.PATH,
    CURL_LOG: curlLog,
    DASHBOARD_REPO_ROOT: root,
    DASHBOARD_PASSWORD: PASSWORD,
    DASHBOARD_LIVE: live ? '1' : '0',
    DASHBOARD_PARAGRAPH_API: paragraphBase,
    PARAGRAPH_API_KEY: KEY,
  });
}

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'desk-'));
  root = path.join(tmp, 'repo');
  curlLog = path.join(tmp, 'curl.log');
  fs.mkdirSync(path.join(root, 'drafts/archive'), { recursive: true });
  fs.mkdirSync(path.join(root, 'published'));
  fs.mkdirSync(path.join(root, 'templates'));
  fs.cpSync(path.join(REPO, 'automation'), path.join(root, 'automation'), { recursive: true });
  fs.writeFileSync(path.join(root, 'automation/post-ids.json'), '{}\n');
  fs.writeFileSync(path.join(root, 'templates/daily-3.md'), 'zm\n\nbody\n');
  fs.writeFileSync(path.join(root, 'drafts/2026-07-19-day-200.md'), GOOD);
  fs.writeFileSync(path.join(root, 'published/2026-01-01-day-1.md'), '# Year of the ZABAL - Day 1\n\nzm\n');
  fs.writeFileSync(path.join(root, '.env'), 'PARAGRAPH_API_KEY=should-not-win\n');
  fs.writeFileSync(path.join(root, '.gitignore'), '.env\n__pycache__/\n');

  // Fake curl: logs every call and answers like Paragraph.
  const bin = path.join(tmp, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'curl'), `#!/usr/bin/env bash
echo "$*" >> "$CURL_LOG"
case "$*" in
  *"-X POST"*) echo '{"id":"newpostid1","status":"draft"}' ;;
  *"-X PUT"*) echo '{"success":true}' ;;
  *slotted123*includeContent*) echo '{"id":"slotted123","status":"draft","markdown":"body [FILL this]"}' ;;
  *includeContent*) echo '{"id":"postid123","status":"draft","markdown":"clean body"}' ;;
  *) echo '{"items":[]}' ;;
esac
`, { mode: 0o755 });

  // A stand-in for the read API, so the server's own GETs stay local too.
  paragraph = http.createServer((req, res) => {
    const id = (req.url.match(/\/posts\/([^/?]+)/) || [])[1];
    const p = posts.get(id);
    res.writeHead(p ? 200 : 404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(req.url.includes('/publications/') ? { items: [] } : p || { msg: 'Post not found' }));
  });
  await new Promise((r) => paragraph.listen(0, '127.0.0.1', r));
  paragraphBase = `http://127.0.0.1:${paragraph.address().port}/api/v1`;

  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
  git('config', 'user.name', 'test'); git('config', 'user.email', 't@example.invalid');
  git('add', '-A'); git('commit', '-qm', 'base');
  const bare = path.join(tmp, 'origin.git');
  execFileSync('git', ['init', '-q', '--bare', bare]);
  git('remote', 'add', 'origin', bare);

  server = http.createServer(createApp(makeConfig(false)));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  liveServer = http.createServer(createApp(makeConfig(true)));
  await new Promise((r) => liveServer.listen(0, '127.0.0.1', r));
  liveBase = `http://127.0.0.1:${liveServer.address().port}`;
});

after(() => {
  server.close(); liveServer.close(); paragraph.close();
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* Windows may hold a handle */ }
});

async function login(at = base) {
  const r = await fetch(at + '/api/login', { method: 'POST', headers: { 'X-Desk': '1', 'Content-Type': 'application/json' }, body: JSON.stringify({ password: PASSWORD }) });
  assert.equal(r.status, 200);
  return r.headers.get('set-cookie').split(';')[0];
}
function call(cookie, at, p, method = 'GET', body) {
  return fetch(at + p, { method, headers: { 'X-Desk': '1', 'Content-Type': 'application/json', Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
}
async function finish(cookie, at, job) {
  for (let i = 0; i < 300; i++) {
    const j = await (await call(cookie, at, '/api/jobs/' + job.id)).json();
    if (j.state !== 'running') return j;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('job did not finish');
}
async function runJob(cookie, at, name, args) {
  const r = await call(cookie, at, '/api/jobs', 'POST', { job: name, args });
  assert.equal(r.status, 202, await r.clone().text());
  return finish(cookie, at, await r.json());
}
const curlCalls = () => (fs.existsSync(curlLog) ? fs.readFileSync(curlLog, 'utf8') : '');
const clearCurl = () => fs.rmSync(curlLog, { force: true });

// ---- auth ----

test('no route answers without a session, read or write', async () => {
  const routes = [
    ['GET', '/api/overview'], ['GET', '/api/drift'], ['GET', '/api/file?path=drafts/2026-07-19-day-200.md'], ['PUT', '/api/file'],
    ['POST', '/api/drafts'], ['PUT', '/api/post-id'], ['GET', '/api/post/abcdef1'], ['GET', '/api/socials'],
    ['GET', '/api/git'], ['POST', '/api/cover?day=1'], ['GET', '/api/media?path=drafts/media/x.png'],
    ['POST', '/api/plan'], ['POST', '/api/jobs'], ['GET', '/api/jobs'], ['GET', '/api/jobs/1'], ['GET', '/api/templates'], ['POST', '/api/logout'],
  ];
  for (const [method, p] of routes) {
    const r = await fetch(base + p, { method, headers: { 'X-Desk': '1' }, body: method === 'GET' ? undefined : '{}' });
    assert.equal(r.status, 401, `${method} ${p}`);
  }
  // A made-up cookie gets the same answer.
  const r = await call('desk=madeup', base, '/api/jobs', 'POST', { job: 'publish', args: { postId: 'abcdef1' } });
  assert.equal(r.status, 401);
});

test('the page shell is public but carries no data', async () => {
  const html = await (await fetch(base + '/')).text();
  assert.ok(!html.includes(KEY) && !html.includes('Day 200'));
});

test('only named static files are served', async () => {
  for (const p of ['/server.mjs', '/.env', '/public/app.js', '/..%2f.env', '/automation/post-ids.json']) {
    assert.equal((await fetch(base + p)).status, 404, p);
  }
});

test('a cross-site or header-less write is refused even with a good session', async () => {
  const cookie = await login();
  let r = await fetch(base + '/api/jobs', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json', 'X-Desk': '1', Origin: 'https://evil.example' }, body: '{}' });
  assert.equal(r.status, 403);
  r = await fetch(base + '/api/jobs', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 403);
});

test('an unknown Host is refused, which stops DNS rebinding', async () => {
  const status = await new Promise((resolve) => {
    http.get({ host: '127.0.0.1', port: server.address().port, path: '/', headers: { Host: 'evil.example' } }, (res) => { res.resume(); resolve(res.statusCode); });
  });
  assert.equal(status, 421);
});

test('session cookie is HttpOnly and SameSite=Strict, and a wrong password fails', async () => {
  const bad = await fetch(base + '/api/login', { method: 'POST', headers: { 'X-Desk': '1' }, body: JSON.stringify({ password: 'nope' }) });
  assert.equal(bad.status, 401);
  const r = await fetch(base + '/api/login', { method: 'POST', headers: { 'X-Desk': '1' }, body: JSON.stringify({ password: PASSWORD }) });
  const c = r.headers.get('set-cookie');
  assert.match(c, /HttpOnly/); assert.match(c, /SameSite=Strict/);
});

test('five wrong passwords lock the door, even for the right one', async () => {
  const app = http.createServer(createApp(makeConfig(false)));
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  const at = `http://127.0.0.1:${app.address().port}`;
  const tryIt = (password) => fetch(at + '/api/login', { method: 'POST', headers: { 'X-Desk': '1' }, body: JSON.stringify({ password }) });
  for (let i = 0; i < 5; i++) assert.equal((await tryIt('wrong')).status, 401);
  assert.equal((await tryIt(PASSWORD)).status, 429);
  app.close();
});

test('a server with no password will not start', () => {
  const out = (() => {
    try { execFileSync(process.execPath, [path.join(REPO, 'dashboard/server.mjs')], { env: { ...process.env, DASHBOARD_REPO_ROOT: root, DASHBOARD_PASSWORD: 'short', DASHBOARD_PORT: '0' }, encoding: 'utf8', stdio: 'pipe' }); return { status: 0 }; }
    catch (e) { return e; }
  })();
  assert.equal(out.status, 2);
});

// ---- the confirm step and the dry run ----

test('no write job runs without the confirm phrase', async () => {
  const cookie = await login();
  for (const [job, args] of [
    ['publish', { postId: 'postid123' }], ['schedule', { postId: 'postid123', at: Date.now() + 1e7 }], ['unschedule', { postId: 'postid123' }],
    ['create-draft', { path: 'drafts/2026-07-19-day-200.md' }], ['update-draft', { postId: 'postid123', path: 'drafts/2026-07-19-day-200.md' }],
    ['set-cover', { postId: 'postid123', url: 'https://example.com/a.png' }], ['record', { postId: 'postid123' }], ['archive', { path: 'drafts/2026-07-19-day-200.md' }],
    ['push', {}], ['pr', {}], ['commit', { files: [], message: 'x' }], ['test-email', { postId: 'postid123' }],
  ]) {
    const r = await call(cookie, base, '/api/jobs', 'POST', { job, args });
    assert.equal(r.status, 428, job);
    const wrong = await call(cookie, base, '/api/jobs', 'POST', { job, args: { ...args, confirm: 'yes' } });
    assert.equal(wrong.status, 428, job);
  }
});

test('in dry run mode every remote job sends nothing', async () => {
  const cookie = await login();
  clearCurl();
  git('switch', '-q', '-c', 'dry-run-case');
  const P = { postId: 'postid123' };
  const cases = [
    ['publish', { ...P, newsletter: true, confirm: 'PUBLISH' }, /DRY RUN[\s\S]*"status":"published","sendNewsletter":true/],
    ['schedule', { ...P, at: Date.now() + 86400000, confirm: 'SCHEDULE' }, /DRY RUN[\s\S]*scheduledAt/],
    ['unschedule', { ...P, confirm: 'UNSCHEDULE' }, /DRY RUN[\s\S]*"scheduledAt":null/],
    ['test-email', { ...P, confirm: 'test-email' }, /DRY RUN[\s\S]*test-email/],
    ['create-draft', { path: 'drafts/2026-07-19-day-200.md', confirm: 'create-draft' }, /DRY RUN[\s\S]*create-draft\.sh/],
    ['update-draft', { ...P, path: 'drafts/2026-07-19-day-200.md', confirm: 'update-draft' }, /DRY RUN[\s\S]*update-draft\.sh/],
    ['set-cover', { ...P, url: 'https://example.com/a.png', confirm: 'set-cover' }, /DRY RUN[\s\S]*set-thumbnail\.sh/],
    ['push', { confirm: 'push' }, /DRY RUN[\s\S]*git push/],
    ['pr', { confirm: 'pr' }, /DRY RUN[\s\S]*gh pr create/],
  ];
  for (const [job, args, want] of cases) {
    const j = await runJob(cookie, base, job, args);
    assert.equal(j.state, 'done', job + ': ' + j.output);
    assert.equal(j.dry, true, job);
    assert.match(j.output, want, job);
  }
  assert.equal(curlCalls(), '', 'curl must not have been called');
  assert.equal(git('ls-remote', 'origin').trim(), '', 'nothing pushed');
  git('switch', '-q', 'main');
});

test('a dry run still refuses bad arguments', async () => {
  const cookie = await login();
  const bad = [
    ['publish', { postId: '../../x', confirm: 'PUBLISH' }],
    ['schedule', { postId: 'postid123', at: 'tomorrow', confirm: 'SCHEDULE' }],
    ['set-cover', { postId: 'postid123', url: 'file:///etc/passwd', confirm: 'set-cover' }],
    ['create-draft', { path: '../.env', confirm: 'create-draft' }],
    ['create-draft', { path: 'automation/status.sh', confirm: 'create-draft' }],
    ['voice', { path: 'drafts/../../outside.md' }],
    ['voice', { path: 'drafts/--force.md' }],
    ['analytics', { sql: 'DROP TABLE posts' }],
    ['analytics', { sql: 'SELECT 1; DROP TABLE posts' }],
    ['nope', {}],
  ];
  for (const [job, args] of bad) {
    const r = await call(cookie, base, '/api/jobs', 'POST', { job, args });
    assert.ok(r.status >= 400 && r.status < 500, `${job} ${JSON.stringify(args)} got ${r.status}`);
  }
});

test('publish needs a typed word in the plan, only when live', async () => {
  const dry = await login(); const live = await login(liveBase);
  const a = await (await call(dry, base, '/api/plan', 'POST', { job: 'publish', args: { postId: 'postid123' } })).json();
  assert.equal(a.dry, true); assert.equal(a.typed, null); assert.equal(a.phrase, 'PUBLISH');
  const b = await (await call(live, liveBase, '/api/plan', 'POST', { job: 'publish', args: { postId: 'postid123', newsletter: true } })).json();
  assert.equal(b.dry, false); assert.equal(b.typed, 'PUBLISH');
  assert.ok(b.lines.some((l) => l.includes('EMAILS EVERY SUBSCRIBER')));
});

// ---- the real scripts, with the fake curl standing in for Paragraph ----

test('live mode runs the real publish script, and it refuses a body with a slot', async () => {
  const cookie = await login(liveBase);
  clearCurl();
  const j = await runJob(cookie, liveBase, 'publish', { postId: 'postid123', confirm: 'PUBLISH' });
  assert.equal(j.state, 'done', j.output);
  assert.match(curlCalls(), /-X PUT https:\/\/public\.api\.paragraph\.com\/api\/v1\/posts\/postid123/);
  assert.match(curlCalls(), /"status":"published"/);
  assert.ok(!curlCalls().includes('sendNewsletter'), 'email stays off unless ticked');
  assert.match(j.output, /Paragraph now reads status: draft/);
  assert.ok(!j.output.includes(KEY), 'the key never reaches the page');
  clearCurl();
  const slot = await runJob(cookie, liveBase, 'publish', { postId: 'slotted123', confirm: 'PUBLISH' });
  assert.equal(slot.state, 'failed');
  assert.match(slot.output, /REFUSED: the post body/);
  assert.ok(!curlCalls().includes('-X PUT'), 'a slotted body is never published');
});

test('update-draft is refused for a post that is live', async () => {
  const cookie = await login(liveBase);
  clearCurl();
  posts.set('liveone123', { id: 'liveone123', status: 'published', title: 't', slug: 's' });
  const j = await runJob(cookie, liveBase, 'update-draft', { postId: 'liveone123', path: 'drafts/2026-07-19-day-200.md', confirm: 'update-draft' });
  assert.equal(j.state, 'failed');
  assert.match(j.output, /live on Paragraph/);
  assert.equal(curlCalls(), '');
});

test('the voice check runs the real gate and reports it', async () => {
  const cookie = await login();
  const ok = await runJob(cookie, base, 'voice', { path: 'drafts/2026-07-19-day-200.md', mode: 'daily' });
  assert.equal(ok.code, 0, ok.output);
  assert.match(ok.output, /PASS {2}zero em\/en dashes/);
  const r = await call(cookie, base, '/api/file?path=drafts/2026-07-19-day-200.md');
  const f = await r.json();
  const bad = await call(cookie, base, '/api/file', 'PUT', { path: f.path, content: GOOD + '\nhello, world!\n', hash: f.hash });
  assert.equal(bad.status, 200);
  const failed = await runJob(cookie, base, 'voice', { path: f.path, mode: 'daily' });
  assert.equal(failed.state, 'failed');
  assert.match(failed.output, /FAIL {2}zero exclamation marks/);
  const back = await (await call(cookie, base, '/api/file?path=drafts/2026-07-19-day-200.md')).json();
  assert.equal((await call(cookie, base, '/api/file', 'PUT', { path: f.path, content: GOOD, hash: back.hash })).status, 200);
});

test('create-draft, through the real script, is a draft and records the id', async () => {
  const cookie = await login(liveBase);
  clearCurl();
  const j = await runJob(cookie, liveBase, 'create-draft', { path: 'drafts/2026-07-19-day-200.md', confirm: 'create-draft' });
  assert.equal(j.state, 'done', j.output);
  assert.match(curlCalls(), /"status": "draft"/);
  assert.match(curlCalls(), /"sendNewsletter": false/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'automation/post-ids.json'), 'utf8'))['drafts/2026-07-19-day-200.md'], 'newpostid1');
  fs.writeFileSync(path.join(root, 'automation/post-ids.json'), '{}\n');
});

// ---- files ----

test('save refuses a stale copy, a published record, and anything outside drafts', async () => {
  const cookie = await login();
  const p = 'drafts/2026-07-19-day-200.md';
  assert.equal((await call(cookie, base, '/api/file', 'PUT', { path: p, content: 'x', hash: 'stale' })).status, 409);
  assert.equal((await call(cookie, base, '/api/file', 'PUT', { path: 'published/2026-01-01-day-1.md', content: 'x' })).status, 403);
  assert.equal((await call(cookie, base, '/api/file', 'PUT', { path: 'drafts/archive/a.md', content: 'x' })).status, 403);
  for (const bad of ['../x.md', 'automation/status.sh', '.env', 'drafts/../.env', 'drafts/a.sh', '/etc/passwd', 'drafts/.hidden.md']) {
    const r = await call(cookie, base, '/api/file', 'PUT', { path: bad, content: 'x' });
    assert.ok(r.status === 400 || r.status === 403, `${bad} got ${r.status}`);
  }
  assert.equal(await (await call(cookie, base, '/api/file?path=.env')).status >= 400, true);
});

test('a new draft takes its day number from its date', async () => {
  const cookie = await login();
  const r = await (await call(cookie, base, '/api/drafts', 'POST', { date: '2026-11-01', template: 'daily-3' })).json();
  assert.equal(r.path, 'drafts/2026-11-01-day-305.md');
  assert.match(fs.readFileSync(path.join(root, r.path), 'utf8'), /^# Year of the ZABAL - Day 305/);
  assert.equal((await call(cookie, base, '/api/drafts', 'POST', { date: '2026-11-01', template: 'daily-3' })).status, 409);
  fs.rmSync(path.join(root, r.path));
});

test('cover upload takes images only, and the day has to be a number', async () => {
  const cookie = await login();
  const up = (q, body) => fetch(base + '/api/cover?' + q, { method: 'POST', headers: { 'X-Desk': '1', Cookie: cookie }, body });
  assert.equal((await up('day=200', '<script>alert(1)</script>')).status, 415);
  assert.equal((await up('day=../x', Buffer.from([0x89]))).status, 400);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
  const r = await up('day=200&kind=attached', png);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).path, 'drafts/media/covers/day-200-attached.png');
  const img = await call(cookie, base, '/api/media?path=drafts/media/covers/day-200-attached.png');
  assert.equal(img.headers.get('content-type'), 'image/png');
  assert.equal(img.headers.get('x-content-type-options'), 'nosniff');
  fs.rmSync(path.join(root, 'drafts/media'), { recursive: true });
});

// ---- git, against a local bare repo ----

test('commit only takes drafts and records, makes a branch from main, and push refuses main', async () => {
  const cookie = await login(liveBase);
  assert.equal((await call(cookie, liveBase, '/api/jobs', 'POST', { job: 'push', args: { confirm: 'push' } })).status, 409);
  fs.writeFileSync(path.join(root, 'automation/check-voice.sh.bak'), 'x');
  const sneaky = await call(cookie, liveBase, '/api/jobs', 'POST', { job: 'commit', args: { files: ['automation/check-voice.sh.bak'], message: 'x', branch: 'records/x', confirm: 'commit' } });
  assert.equal(sneaky.status, 400);
  fs.rmSync(path.join(root, 'automation/check-voice.sh.bak'));

  fs.writeFileSync(path.join(root, 'drafts/2026-07-20-day-201.md'), GOOD);
  const c = await runJob(cookie, liveBase, 'commit', { files: ['drafts/2026-07-20-day-201.md'], message: 'drafts: Day 201', branch: 'drafts/day-201', confirm: 'commit' });
  assert.equal(c.state, 'done', c.output);
  assert.equal(git('rev-parse', '--abbrev-ref', 'HEAD').trim(), 'drafts/day-201');
  const p = await runJob(cookie, liveBase, 'push', { confirm: 'push' });
  assert.equal(p.state, 'done', p.output);
  assert.match(git('ls-remote', 'origin'), /refs\/heads\/drafts\/day-201/);
  assert.ok(!git('ls-remote', 'origin').includes('refs/heads/main'));
  git('switch', '-q', 'main');
});

// ---- units ----

test('safeRel, dayOfYear, isEdition, parseStatus', () => {
  const opts = { prefixes: ['drafts/'], exts: ['.md'] };
  assert.equal(safeRel(root, 'drafts/a.md', opts).rel, 'drafts/a.md');
  for (const bad of ['drafts/../x.md', '/drafts/a.md', 'drafts\\a.md', 'published/a.md', 'drafts/a.txt', 'drafts/a\0.md']) {
    assert.throws(() => safeRel(root, bad, opts), bad);
  }
  assert.equal(dayOfYear('2026-10-31'), 304);   // Day 304 published 31 Oct
  assert.equal(dayOfYear('2026-01-01'), 1);
  assert.ok(isEdition('zm\n\nbody')); assert.ok(!isEdition('a fact sheet about zm things'));
  const s = parseStatus('NO RECORD: 2026-10-31  Year of the ZABAL - Day 304 (abc123)\ndrift: UNKNOWN - no network\n');
  assert.deepEqual(s.missing, [{ date: '2026-10-31', title: 'Year of the ZABAL - Day 304', postId: 'abc123' }]);
  assert.equal(s.unknown, 'no network');
});

test('UI text carries no em dash or en dash', () => {
  for (const f of ['public/app.js', 'public/index.html', 'server.mjs']) {
    const text = fs.readFileSync(path.join(REPO, 'dashboard', f), 'utf8');
    assert.ok(!/[—–]/.test(text), f);
  }
});

test('no key or password value is written into the source', () => {
  const server = fs.readFileSync(path.join(REPO, 'dashboard/server.mjs'), 'utf8');
  assert.ok(!/PARAGRAPH_API_KEY\s*=\s*['"][^'"]/.test(server));
  assert.ok(!/DASHBOARD_PASSWORD\s*=\s*['"][^'"]/.test(server));
});
