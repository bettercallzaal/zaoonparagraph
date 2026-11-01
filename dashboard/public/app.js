// The ZAO Desk, front end. No framework and no build. It holds no rules of its own: every
// check and every write is a script on the server, and this page shows what it printed.

const $app = document.getElementById('app');
const $dialog = document.getElementById('confirm');

// ---- dom ----
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k in el && k !== 'list' && k !== 'form') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : String(kid));
  }
  return el;
}
const tag = (text, kind) => h('span', { class: 'tag ' + (kind || '') }, text);

// ---- api ----
class ApiError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
async function api(path, opts = {}) {
  const init = { method: opts.method || 'GET', headers: { 'X-Desk': '1' } };
  if (opts.body !== undefined) {
    if (opts.raw) init.body = opts.body;
    else { init.body = JSON.stringify(opts.body); init.headers['Content-Type'] = 'application/json'; }
  }
  const res = await fetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/login') { state.authed = false; renderDoor(); }
    throw new ApiError(res.status, data.error || 'That did not work.');
  }
  return data;
}

// ---- theme: per-viewer, so browser storage is the right home ----
const THEMES = ['auto', 'light', 'dark'];
function getTheme() { try { return localStorage.getItem('desk-theme') || 'auto'; } catch { return 'auto'; } }
function setTheme(t) {
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  try { localStorage.setItem('desk-theme', t); } catch { /* private window: it just will not stick */ }
}
setTheme(getTheme());
function themeButton() {
  const b = h('button', { class: 'btn quiet', type: 'button', onclick: () => {
    const next = THEMES[(THEMES.indexOf(getTheme()) + 1) % 3];
    setTheme(next); b.textContent = 'Theme: ' + next;
  } }, 'Theme: ' + getTheme());
  return b;
}

// ---- state ----
const state = { authed: false, overview: null, filter: 'working', search: '', tab: 'write', split: true };

const toDay = (ms) => {
  const d = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date(ms)) + 'T00:00:00Z');
  return Math.round((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
};
const liveDay = (p) => Number((p.title.match(/Day (\d{1,3})\b/) || [])[1]) || null;
const liveUrl = (slug) => 'https://paragraph.com/@thezao/' + slug;

// ---- job tape: every script's output, as printed ----
let tapeEl = null;
const jobWatch = new Map();
function showTape(job, onDone) {
  closeTape();
  const pre = h('pre', { 'aria-live': 'polite' });
  const st = h('span', { class: 'st ' + job.state }, job.state);
  const close = h('button', { type: 'button', onclick: closeTape }, 'Close');
  const copy = h('button', { type: 'button', onclick: async () => { await copyText(lastOut); copy.textContent = 'Copied'; } }, 'Copy');
  tapeEl = h('section', { class: 'tape', 'aria-label': 'Job output' },
    h('header', null, h('b', null, job.label, job.dry ? ' (dry run)' : ''), st, copy, close), pre);
  document.body.append(tapeEl);
  let lastOut = '';
  const paint = (j) => {
    if (j.output === lastOut && j.state === 'running') return;
    lastOut = j.output;
    const stick = pre.scrollTop + pre.clientHeight >= pre.scrollHeight - 30;
    pre.replaceChildren(...j.output.split('\n').map((line) => {
      const c = /^(FAIL|DEAD|REFUSED|RECORD FAIL|VOICE FAIL|LINKS FAIL|NO RECORD|CANNOT RUN|WARNING|WRONG)/.test(line) ? 'bad'
        : /^(PASS|OK |ok )/.test(line) ? 'good' : /^(WARN|DRY RUN|SKIP)/.test(line) ? 'warn' : line.startsWith('$ ') ? 'cmd' : '';
      return h('span', { class: c }, line + '\n');
    }));
    if (stick) pre.scrollTop = pre.scrollHeight;
    st.className = 'st ' + j.state; st.textContent = j.state;
  };
  paint(job);
  const tick = async () => {
    if (!pre.isConnected) return;
    const j = await api('/api/jobs/' + job.id).catch(() => null);
    if (!j) return;
    paint(j);
    if (j.state === 'running') setTimeout(tick, 700);
    else if (onDone) onDone(j);
  };
  if (job.state === 'running') setTimeout(tick, 400); else if (onDone) onDone(job);
}
function closeTape() { if (tapeEl) { tapeEl.remove(); tapeEl = null; } }

async function runJob(job, args = {}, onDone) {
  try { const j = await api('/api/jobs', { method: 'POST', body: { job, args } }); showTape(j, onDone); return j; }
  catch (e) { showError(e.message); return null; }
}

// Everything that writes passes through here. The server re-checks the phrase.
async function confirmJob(job, args, onDone) {
  let plan;
  try { plan = await api('/api/plan', { method: 'POST', body: { job, args } }); } catch (e) { showError(e.message); return; }
  const typed = plan.typed;
  const input = typed ? h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: false, 'aria-label': 'Type ' + typed }) : null;
  const go = h('button', { class: 'btn ' + (plan.risk === 'remote' ? 'red' : 'ink'), type: 'button', disabled: Boolean(typed) },
    plan.dry ? 'Dry run it' : plan.label);
  if (input) input.addEventListener('input', () => { go.disabled = input.value.trim() !== typed; });
  const cancel = h('button', { class: 'btn quiet', type: 'button', onclick: () => $dialog.close() }, 'Cancel');
  go.addEventListener('click', async () => {
    $dialog.close();
    await runJob(job, { ...args, confirm: plan.phrase }, onDone);
  });
  $dialog.replaceChildren(h('div', { class: 'conf ' + (plan.risk === 'remote' ? '' : 'safe') },
    h('span', { class: 'kicker' }, plan.dry ? 'Dry run, nothing leaves this machine' : plan.risk === 'remote' ? 'This leaves this machine' : 'This changes files here'),
    h('h2', null, plan.label),
    h('ul', null, plan.lines.map((l) => h('li', null, l))),
    typed && h('label', { class: 'f' }, `Type ${typed} to go ahead`, input),
    h('div', { class: 'row between' }, cancel, go)));
  $dialog.showModal();
  (input || cancel).focus();
}

function showError(msg) {
  const ok = h('button', { class: 'btn ink', type: 'button', onclick: () => $dialog.close() }, 'OK');
  $dialog.replaceChildren(h('div', { class: 'conf' }, h('h2', null, 'That did not run'), h('p', null, msg), h('div', { class: 'row' }, ok)));
  $dialog.showModal();
}

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch {
    const ta = h('textarea', { value: t }); document.body.append(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}

// ---- markdown: enough for a preview of an edition. Everything is escaped first. ----
function esc(s) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : '#'; }
function inline(s) {
  return esc(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => `<img alt="${a}" src="${safeUrl(u)}">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[(FILL|CUT|CHECK|TODO)([^\]]*)\]/g, '<span class="slot">[$1$2]</span>');
}
function renderMarkdown(md) {
  const text = md.replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '').replace(/^# .*\n?/m, '');
  const out = [];
  for (const raw of text.split(/\n{2,}/)) {
    const b = raw.trim();
    if (!b) continue;
    let m;
    if ((m = b.match(/^(#{2,4}) (.+)/))) out.push(`<h${Math.min(m[1].length, 3)}>${inline(m[2])}</h${Math.min(m[1].length, 3)}>`);
    else if (/^(-{3,}|\*{3,})$/.test(b)) out.push('<hr>');
    else if (b.startsWith('>')) out.push(`<blockquote>${inline(b.replace(/^> ?/gm, ''))}</blockquote>`);
    else out.push(`<p>${b.split('\n').map(inline).join('<br>')}</p>`);
  }
  return out.join('\n');
}

// ---- shell ----
const NAV = [['today', 'Today'], ['editions', 'Editions'], ['socials', 'Socials'], ['numbers', 'Numbers'], ['jobs', 'Jobs']];

function modeTag() {
  const live = state.overview && state.overview.live;
  return h('span', { class: 'mode' + (live ? ' live' : ''), title: live ? 'Writes reach Paragraph and GitHub after the confirm step.' : 'DASHBOARD_LIVE is off. Nothing reaches Paragraph or GitHub.' }, live ? 'Live' : 'Dry run');
}

function shell(active, content) {
  const link = (id, label, i) => h('a', { href: '#/' + id, 'aria-current': active === id ? 'page' : null }, i !== undefined && h('i', null, String(i + 1).padStart(2, '0')), label);
  const signOut = h('button', { class: 'btn quiet', type: 'button', onclick: async () => { await api('/api/logout', { method: 'POST' }); state.authed = false; renderDoor(); } }, 'Sign out');
  $app.replaceChildren(h('div', { class: 'shell' },
    h('aside', { class: 'rail' },
      h('a', { class: 'brand', href: '#/today' }, 'The ', h('b', null, 'ZAO'), ' Desk', h('small', null, 'Paragraph / @thezao')),
      h('nav', { class: 'nav', 'aria-label': 'Main' }, NAV.map(([id, l], i) => link(id, l, i))),
      h('div', { class: 'rail-foot' }, modeTag(), state.overview && h('span', { class: 'mono mute' }, 'branch: ' + state.overview.branch), themeButton(), signOut)),
    h('main', { class: 'main' },
      h('div', { class: 'topbar' }, h('a', { class: 'brand', href: '#/today' }, 'The ', h('b', null, 'ZAO'), ' Desk'), h('div', { class: 'row' }, modeTag(), themeButton())),
      content),
    h('nav', { class: 'tabbar', 'aria-label': 'Main' }, NAV.map(([id, l]) => link(id, l)))));
}

async function overview(fresh) {
  if (!state.overview || fresh) state.overview = await api('/api/overview');
  return state.overview;
}

function loading(active) { shell(active, h('p', { class: 'kicker' }, 'Setting the type...')); }

// ---- today ----
function ledger(o) {
  const year = Number(o.today.slice(0, 4));
  const days = Math.round((Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000);
  const recorded = new Map(), drafts = new Map(), live = new Map();
  for (const e of o.editions) {
    if (!e.day || !e.date || !e.date.startsWith(String(year))) continue;
    if (e.folder === 'published') recorded.set(e.day, e);
    else if (e.folder !== 'archive' && e.edition) drafts.set(e.day, e);
  }
  for (const p of o.livePosts) { const d = liveDay(p); if (d && new Date(p.publishedAt).getUTCFullYear() === year) live.set(d, p); }
  const floor = Math.min(...[...recorded.keys(), o.day]);
  const cells = [];
  for (let d = 1; d <= days; d++) {
    let cls = '', note = 'nothing yet';
    if (d === o.day) { cls = 'today'; note = 'today'; }
    if (recorded.has(d)) { if (d !== o.day) cls = 'live'; note = 'live and recorded'; }
    else if (d < floor) { cls = 'old'; note = 'before the record starts'; }
    else if (live.has(d)) { if (d !== o.day) cls = 'unrec'; note = 'live, not recorded'; }
    else if (drafts.has(d)) { if (d !== o.day) cls = 'draft'; note = 'draft'; }
    else if (d > o.day) { cls = 'future'; note = ''; }
    const target = recorded.get(d) || drafts.get(d);
    cells.push(h('a', { class: cls, title: `Day ${d}${note ? ': ' + note : ''}`, 'aria-label': `Day ${d}${note ? ': ' + note : ''}`, href: target ? '#/edit/' + encodeURIComponent(target.path) : '#/editions' }));
  }
  return h('section', { class: 'ledger' },
    h('div', { class: 'row between' }, h('h2', { class: 'kicker' }, `The ${year} ledger, one mark per day`), h('span', { class: 'kicker' }, `${recorded.size} recorded`)),
    h('div', { class: 'ticks' }, cells),
    h('div', { class: 'legend' },
      h('span', null, h('i', { class: 'live' }), 'Live, recorded'), h('span', null, h('i', { class: 'unrec' }), 'Live, no record'),
      h('span', null, h('i', { class: 'draft' }), 'Draft'), h('span', null, h('i', { class: 'today' }), 'Today'), h('span', null, h('i', { class: 'empty' }), 'Nothing')));
}

function pressRun(o) {
  const draft = o.editions.find((e) => e.day === o.day && e.folder !== 'published' && e.folder !== 'archive');
  const rec = o.editions.find((e) => e.day === o.day && e.folder === 'published');
  const live = o.livePosts.find((p) => liveDay(p) === o.day && new Date(p.publishedAt).getUTCFullYear() === Number(o.today.slice(0, 4)));
  const cover = o.covers.some((c) => c.includes(`day-${o.day}-`)) || (live && live.imageUrl);
  const onPara = (draft && draft.postId) || live;
  const steps = [
    ['Written', draft ? `${draft.words} words in ${draft.folder}/` : (live || rec) ? 'Done' : 'No draft yet', Boolean(draft || live || rec)],
    ['Cover', cover ? 'Attached' : 'Day ' + o.day + ' from Canva or generated', Boolean(cover)],
    ['On Paragraph', onPara ? (live ? 'Live' : 'Post id ' + draft.postId) : 'Not pushed', Boolean(onPara)],
    ['Published', live ? new Date(live.publishedAt).toLocaleString() : 'Not yet', Boolean(live)],
    ['Recorded', rec ? 'In published/' : 'Not yet', Boolean(rec)],
  ];
  const nextIndex = steps.findIndex((s) => !s[2]);
  return h('ol', { class: 'press', 'aria-label': "Today's edition" }, steps.map((s, i) => h('li', { class: s[2] ? 'done' : i === nextIndex ? 'next' : '' },
    h('div', null, h('b', null, s[0]), h('span', { class: 'd' }, s[1])),
    s[2] ? tag('done', 'ok') : i === nextIndex ? tag('next', 'red') : tag('waiting'))));
}

async function viewToday() {
  loading('today');
  const o = await overview(true);
  const draft = o.editions.find((e) => e.day === o.day && e.folder !== 'published' && e.folder !== 'archive');
  const date = new Date(o.today + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const attention = [];
  if (o.liveUnknown) attention.push(h('div', { class: 'notice' }, o.liveUnknown));
  if (!o.hasKey) attention.push(h('div', { class: 'notice' }, 'No PARAGRAPH_API_KEY on this server. Reads of public posts work. Analytics, socials staging and every Paragraph write need it.'));

  // status.sh decides drift. It takes a while, so this panel fills in when it answers.
  const recordTag = tag('checking');
  const recordBody = h('div', { class: 'stack' }, h('p', { class: 'mute small' }, 'status.sh is comparing what is live against published/.'));
  const paintDrift = (d) => {
    if (d.unknown) {
      recordTag.textContent = 'unknown'; recordTag.className = 'tag warn';
      recordBody.replaceChildren(h('div', { class: 'notice bad' }, h('b', null, 'Record drift is unknown. '), d.unknown, ' Unknown is not the same as clean.'));
    } else if (d.missing.length) {
      recordTag.textContent = d.missing.length + ' missing'; recordTag.className = 'tag bad';
      recordBody.replaceChildren(...d.missing.map((m) => h('div', { class: 'row between' },
        h('div', null, h('b', null, m.title), h('div', { class: 'small mute' }, `Live since ${m.date}, no record here`)),
        h('div', { class: 'row' },
          h('button', { class: 'btn quiet', type: 'button', onclick: () => runJob('record-preview', { postId: m.postId }) }, 'Preview'),
          h('button', { class: 'btn ink', type: 'button', onclick: () => confirmJob('record', { postId: m.postId }, () => { state.overview = null; route(); }) }, 'Record it')))));
    } else {
      recordTag.textContent = 'current'; recordTag.className = 'tag ok';
      recordBody.replaceChildren(h('p', { class: 'mute small' }, 'Every live edition status.sh checked has a record here.'));
    }
  };
  api('/api/drift').then(paintDrift).catch(() => paintDrift({ missing: [], unknown: 'The check did not answer.' }));

  shell('today', h('div', null,
    h('div', { class: 'masthead' }, h('span', null, date), h('span', null, 'Year of the ZABAL')),
    h('section', { class: 'front' },
      h('div', { class: 'bigday' },
        h('span', { class: 'num' }, 'DAY ' + o.day),
        h('p', { class: 'lede' }, draft ? draft.title : 'Nothing is on the stone for today. Start from a template and the number sorts itself out.'),
        h('div', { class: 'row' },
          draft ? h('a', { class: 'btn red', href: '#/edit/' + encodeURIComponent(draft.path) }, 'Open the draft')
            : h('button', { class: 'btn red', type: 'button', onclick: () => newDraft(o.today) }, 'Start Day ' + o.day),
          h('a', { class: 'btn', href: '#/editions' }, 'All editions'))),
      pressRun(o)),
    attention.length ? h('div', { class: 'stack attention' }, attention) : null,
    ledger(o),
    h('section', { class: 'card stack' },
      h('div', { class: 'row between' }, h('h2', { class: 'h3' }, 'The record'), recordTag),
      recordBody)));
}

async function newDraft(defaultDate) {
  const { templates } = await api('/api/templates');
  const date = h('input', { type: 'date', value: defaultDate });
  const sel = h('select', null, templates.map((t) => h('option', { value: t }, t)));
  const err = h('p', { class: 'err', hidden: true });
  const go = h('button', { class: 'btn red', type: 'button', onclick: async () => {
    try {
      const r = await api('/api/drafts', { method: 'POST', body: { date: date.value, template: sel.value } });
      $dialog.close(); state.overview = null; location.hash = '#/edit/' + encodeURIComponent(r.path);
    } catch (e) { err.textContent = e.message; err.hidden = false; }
  } }, 'Start the draft');
  $dialog.replaceChildren(h('div', { class: 'conf safe' }, h('h2', null, 'New draft'),
    h('p', { class: 'small mute' }, "The day number comes from the edition's date. An edition finalised the evening before carries tomorrow's."),
    h('label', { class: 'f' }, 'Edition date', date), h('label', { class: 'f' }, 'Template', sel), err,
    h('div', { class: 'row between' }, h('button', { class: 'btn quiet', type: 'button', onclick: () => $dialog.close() }, 'Cancel'), go)));
  $dialog.showModal();
}

// ---- editions ----
const FILTERS = [['working', 'Working'], ['published', 'Published'], ['archive', 'Retired'], ['all', 'All']];
async function viewEditions() {
  loading('editions');
  const o = await overview();
  const list = h('div', { class: 'lines' });
  const paint = () => {
    const q = state.search.toLowerCase();
    const rows = o.editions.filter((e) => {
      const f = state.filter;
      const pass = f === 'all' || (f === 'working' && (e.folder === 'drafts' || e.folder === 'zaostock')) || e.folder === f;
      return pass && (!q || (e.title + ' ' + e.path + ' ' + e.subtitle).toLowerCase().includes(q));
    });
    list.replaceChildren(...(rows.length ? rows.map((e) => h('a', { class: 'line', href: '#/edit/' + encodeURIComponent(e.path) },
      h('span', { class: 'n ' + (e.day ? '' : 'no') }, e.day || '-'),
      h('span', null, h('span', { class: 't' }, e.title), h('span', { class: 's' }, e.subtitle || e.path)),
      h('span', { class: 'm' },
        e.folder === 'published' ? tag('live', 'ok') : e.folder === 'archive' ? tag('retired') : e.edition ? tag('draft') : tag('notes'),
        e.slots ? tag(e.slots + ' slots', 'bad') : null,
        e.folder !== 'published' && e.postId ? tag('on paragraph', 'warn') : null))) : [h('p', { class: 'mute', style: null }, 'Nothing matches.')]));
  };
  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Filter' }, FILTERS.map(([id, l]) => h('button', { type: 'button', 'aria-pressed': String(state.filter === id), onclick: (ev) => {
    state.filter = id; seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === ev.currentTarget))); paint();
  } }, l)));
  const search = h('input', { type: 'search', placeholder: 'Search titles', 'aria-label': 'Search', value: state.search, oninput: (ev) => { state.search = ev.target.value; paint(); } });
  paint();
  shell('editions', h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('p', { class: 'kicker' }, 'drafts/ and published/'), h('h1', { class: 'h' }, 'Editions')),
      h('button', { class: 'btn red', type: 'button', onclick: () => newDraft(o.today) }, 'New draft')),
    h('div', { class: 'filters' }, seg, h('div', { class: 'grow-search' }, search)),
    list));
}

// ---- the editor and its run sheet ----
function parseVoice(out) {
  return out.split('\n').filter((l) => /^(PASS|FAIL|WARN|SKIP) /.test(l)).map((l) => h('div', { class: l.startsWith('PASS') ? 'p' : l.startsWith('FAIL') ? 'x' : 'w' }, l));
}

async function viewEdit(rel) {
  loading('editions');
  const o = await overview();
  let f;
  try { f = await api('/api/file?path=' + encodeURIComponent(rel)); }
  catch (e) { shell('editions', h('div', { class: 'notice bad' }, e.message)); return; }
  const readOnly = f.folder === 'published' || f.folder === 'archive';
  let saved = f.content, hash = f.hash, dirty = false;

  const ta = h('textarea', { class: 'body', spellcheck: true, readOnly, value: f.content, 'aria-label': 'Draft text' });
  const coverUrl = { current: f.covers[0] || null, remote: null };
  const article = h('div', { class: 'article' });
  const paintPreview = () => {
    const text = ta.value;
    const title = (text.match(/^# (.+)$/m) || [])[1] || f.title;
    const sub = (text.match(/SUBTITLE \(Paragraph field[^)]*\)\s*:?\s*([\s\S]*?)-->/) || text.match(/Subtitle: ([\s\S]*?)-->/) || [])[1];
    article.innerHTML = (coverUrl.current ? `<img class="cover" alt="Cover" src="/api/media?path=${encodeURIComponent(coverUrl.current)}">` : (coverUrl.remote ? `<img class="cover" alt="Cover" src="${safeUrl(coverUrl.remote)}">` : ''))
      + `<h1>${inline(title)}</h1>` + (sub && sub.trim() ? `<p class="sub">${inline(sub.trim())}</p>` : '') + renderMarkdown(text);
  };
  paintPreview();
  const dot = h('span', { class: 'tag' }, readOnly ? 'read only' : 'saved');
  const saveBtn = h('button', { class: 'btn ink', type: 'button', disabled: true, hidden: readOnly, onclick: () => save() }, 'Save');
  const markDirty = () => { dirty = ta.value !== saved; dot.textContent = dirty ? 'unsaved' : 'saved'; dot.className = 'tag ' + (dirty ? 'warn' : ''); saveBtn.disabled = !dirty; };
  let pt;
  ta.addEventListener('input', () => { markDirty(); clearTimeout(pt); pt = setTimeout(paintPreview, 160); });
  ta.addEventListener('keydown', (ev) => { if ((ev.ctrlKey || ev.metaKey) && ev.key === 's') { ev.preventDefault(); save(); } });
  async function save() {
    if (readOnly || !dirty) return true;
    try {
      const r = await api('/api/file', { method: 'PUT', body: { path: f.path, content: ta.value, hash } });
      saved = ta.value; hash = r.hash; markDirty(); state.overview = null; return true;
    } catch (e) { showError(e.message); return false; }
  }
  const withSave = (fn) => async () => { if (await save()) fn(); };

  // -- step 1, checks
  let mode = /^(zm)\s*$/im.test(f.content) ? 'daily' : 'announcement';
  const voiceOut = h('div', { class: 'result' });
  const voiceTag = tag('not run');
  const runVoice = withSave(() => runJob('voice', { path: f.path, mode }, (j) => {
    voiceOut.replaceChildren(...parseVoice(j.output));
    voiceTag.textContent = j.code === 0 ? 'passes' : 'fails'; voiceTag.className = 'tag ' + (j.code === 0 ? 'ok' : 'bad');
    closeTape();
  }));
  const modeSeg = h('div', { class: 'seg' }, ['daily', 'announcement'].map((m) => h('button', { type: 'button', 'aria-pressed': String(mode === m), onclick: (ev) => { mode = m; modeSeg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === ev.currentTarget))); } }, m)));
  const checks = h('details', { class: 'step', open: !readOnly }, h('summary', null, h('i', null, '1'), 'Checks', voiceTag),
    h('div', { class: 'in' }, modeSeg,
      h('div', { class: 'row' }, h('button', { class: 'btn ink', type: 'button', onclick: runVoice }, 'Voice'),
        h('button', { class: 'btn', type: 'button', onclick: withSave(() => runJob('links', { path: f.path })) }, 'Links'),
        !readOnly && h('button', { class: 'btn', type: 'button', onclick: withSave(() => runJob('paste', { path: f.path })) }, 'Agent paste')),
      voiceOut,
      h('p', { class: 'small mute' }, 'Agent paste builds the message for the Paragraph chat, and refuses a body with a slot left in it.')));

  // -- step 2, cover
  const coverStep = await buildCoverStep(f, o, coverUrl, paintPreview);

  // -- step 3, Paragraph
  const idInput = h('input', { type: 'text', value: f.postId || '', placeholder: 'Paragraph post id', 'aria-label': 'Paragraph post id', spellcheck: false, autocomplete: 'off' });
  const postLine = h('p', { class: 'small mute' }, f.postId ? 'Reading Paragraph...' : 'Not on Paragraph yet, as far as this repo knows.');
  const force = h('input', { type: 'checkbox' });
  const currentId = () => idInput.value.trim();
  const refreshPost = async () => {
    if (!currentId()) return;
    try {
      const p = await api('/api/post/' + encodeURIComponent(currentId()));
      const bits = [p.found ? `Paragraph says: ${p.status || 'found'}.` : (o.hasKey ? 'Paragraph does not find this id.' : 'Not public. A draft is not public, and there is no key here to read it.')];
      if (p.scheduledAt) bits.push('Scheduled for ' + new Date(Number(p.scheduledAt)).toLocaleString() + '.');
      postLine.textContent = bits.join(' ');
      postLine.replaceChildren(bits.join(' '), p.slug ? h('span', null, ' ', h('a', { href: liveUrl(p.slug), target: '_blank', rel: 'noopener' }, 'Open live')) : '');
      if (!coverUrl.current && p.imageUrl) { coverUrl.remote = p.imageUrl; paintPreview(); }
    } catch (e) { postLine.textContent = e.message; }
  };
  refreshPost();
  const saveId = async () => {
    try { await api('/api/post-id', { method: 'PUT', body: { path: f.path, postId: currentId() } }); state.overview = null; refreshPost(); }
    catch (e) { showError(e.message); }
  };
  const para = h('details', { class: 'step' }, h('summary', null, h('i', null, '3'), 'On Paragraph', f.postId ? tag('linked', 'ok') : tag('not yet')),
    h('div', { class: 'in' }, postLine,
      h('label', { class: 'f' }, 'Post id, for a draft made in Paragraph or by the MCP', h('div', { class: 'row' }, idInput)),
      h('div', { class: 'row' }, h('button', { class: 'btn quiet', type: 'button', onclick: saveId }, 'Link this id'),
        currentId() && h('a', { class: 'btn quiet', href: 'https://paragraph.com/editor/' + encodeURIComponent(currentId()), target: '_blank', rel: 'noopener' }, 'Open editor')),
      !readOnly && h('label', { class: 'tick' }, force, h('span', null, 'Skip the voice and link gates. Only when you have read it yourself.')),
      !readOnly && h('div', { class: 'row' },
        h('button', { class: 'btn ink', type: 'button', onclick: withSave(() => confirmJob('create-draft', { path: f.path, force: force.checked }, () => { state.overview = null; })) }, 'Push new draft'),
        h('button', { class: 'btn', type: 'button', onclick: withSave(() => currentId() ? confirmJob('update-draft', { postId: currentId(), path: f.path, force: force.checked }) : showError('Link a post id first.')) }, 'Update draft')),
      !readOnly && h('p', { class: 'small mute' }, 'Editions usually go through the MCP or the editor. An update replaces the whole body, and rich blocks made in the editor do not survive it.')));

  // -- step 4, publish or schedule
  const newsletter = h('input', { type: 'checkbox' });
  const when = h('input', { type: 'datetime-local', 'aria-label': 'Publish time' });
  const needId = (fn) => () => (currentId() ? fn() : showError('Link a post id in step 3 first.'));
  const publishStep = h('details', { class: 'step' }, h('summary', null, h('i', null, '4'), 'Publish or schedule', o.live ? tag('live', 'bad') : tag('dry run', 'warn')),
    h('div', { class: 'in' },
      h('p', { class: 'small mute' }, 'Reads what is on Paragraph, not this text. Re-read the post there first. Scheduling does not lock it.'),
      h('label', { class: 'tick' }, newsletter, h('span', null, 'Also email every subscriber')),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: needId(() => confirmJob('test-email', { postId: currentId() })) }, 'Test email'),
        h('button', { class: 'btn red', type: 'button', onclick: needId(() => confirmJob('publish', { postId: currentId(), newsletter: newsletter.checked })) }, 'Publish now')),
      h('label', { class: 'f' }, 'Or at a time, up to 30 days out', when),
      h('div', { class: 'row' },
        h('button', { class: 'btn ink', type: 'button', onclick: needId(() => {
          const at = new Date(when.value).getTime();
          if (!at) return showError('Pick a time first.');
          return confirmJob('schedule', { postId: currentId(), at, newsletter: newsletter.checked });
        }) }, 'Schedule'),
        h('button', { class: 'btn quiet', type: 'button', onclick: needId(() => confirmJob('unschedule', { postId: currentId() })) }, 'Cancel schedule'))));

  // -- step 5, record
  const recordStep = h('details', { class: 'step', open: readOnly }, h('summary', null, h('i', null, '5'), 'Record the day', f.folder === 'published' ? tag('recorded', 'ok') : tag('after it is live')),
    h('div', { class: 'in' },
      f.folder === 'published' ? h('p', { class: 'small mute' }, 'This is the record of what went out. It stays as published.') : [
        h('p', { class: 'small mute' }, 'Pulls the body from the live page, so the record matches what readers got.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', onclick: needId(() => runJob('record-preview', { postId: currentId() })) }, 'Preview'),
          h('button', { class: 'btn ink', type: 'button', onclick: needId(() => confirmJob('record', { postId: currentId() }, () => { state.overview = null; })) }, 'Record')),
        !readOnly && h('div', { class: 'row' },
          h('button', { class: 'btn quiet', type: 'button', onclick: () => confirmJob('archive', { path: f.path }, () => { state.overview = null; }) }, 'Move draft to published'),
          h('button', { class: 'btn quiet', type: 'button', onclick: () => confirmJob('retire-draft', { path: f.path }, () => { state.overview = null; location.hash = '#/editions'; }) }, 'Retire draft')),
      ],
      h('a', { class: 'btn quiet', href: '#/jobs' }, 'Save to GitHub')));

  const sheet = h('div', { class: 'sheet' }, checks, coverStep, para, publishStep, recordStep);
  const writePane = h('div', { class: 'pane write' }, ta);
  const prevPane = h('div', { class: 'pane preview' }, article);
  const ed = h('div', { class: 'ed split', 'data-tab': state.tab }, writePane, prevPane, sheet);

  // Phone: three tabs. Middle widths: write or preview beside the sheet.
  const phoneSeg = h('div', { class: 'seg only-phone', role: 'group', 'aria-label': 'View' }, [['write', readOnly ? 'Text' : 'Write'], ['preview', 'Preview'], ['sheet', 'Run sheet']].map(([id, l]) => h('button', { type: 'button', 'aria-pressed': String(state.tab === id), onclick: (ev) => {
    state.tab = id; ed.dataset.tab = id; paintPreview();
    phoneSeg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === ev.currentTarget)));
  } }, l)));
  const wideSeg = h('div', { class: 'seg only-wide', role: 'group', 'aria-label': 'Panes' }, [['Text', 'nopreview'], ['Both', 'split'], ['Preview', 'nowrite']].map(([l, c]) => h('button', { type: 'button', 'aria-pressed': String(c === 'split'), onclick: (ev) => {
    ed.classList.remove('nopreview', 'nowrite', 'split'); ed.classList.add(c);
    writePane.hidden = c === 'nowrite'; prevPane.hidden = c === 'nopreview'; paintPreview();
    wideSeg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === ev.currentTarget)));
  } }, l)));

  shell('editions', h('div', null,
    h('div', { class: 'ed-head' },
      h('div', { class: 'title' }, h('span', { class: 'kicker' }, f.path), h('b', null, f.title)),
      h('div', { class: 'row' }, dot, wideSeg, saveBtn)),
    h('div', { style: null, class: 'stack' }, phoneSeg, ed)));
  window.onbeforeunload = () => (dirty ? 'unsaved' : undefined);
  leaveGuard = () => !dirty || window.confirm('This draft has unsaved changes. Leave anyway?');
}

async function buildCoverStep(f, o, coverUrl, paintPreview) {
  const day = f.day || o.day;
  const status = tag(f.covers.length ? 'attached' : 'none', f.covers.length ? 'ok' : '');
  const thumbs = h('div', { class: 'thumbs' });
  const paintThumbs = (list) => {
    thumbs.replaceChildren(...list.map((c) => h('button', { type: 'button', 'aria-pressed': String(c === coverUrl.current), 'aria-label': 'Use ' + c, onclick: () => { coverUrl.current = c; paintThumbs(list); paintPreview(); paintRaw(); } },
      h('img', { alt: '', src: '/api/media?path=' + encodeURIComponent(c), loading: 'lazy' }))));
    status.textContent = list.length ? 'attached' : 'none'; status.className = 'tag ' + (list.length ? 'ok' : '');
  };
  const covers = [...f.covers];
  paintThumbs(covers);

  const addCover = async (blob, kind) => {
    try {
      const r = await api(`/api/cover?day=${day}&kind=${kind}`, { method: 'POST', body: blob, raw: true });
      if (!covers.includes(r.path)) covers.unshift(r.path);
      coverUrl.current = r.path; state.overview = null;
      paintThumbs(covers); paintPreview(); paintRaw();
      return r.path;
    } catch (e) { showError(e.message); return null; }
  };

  // Attach: the Canva download.
  const attach = h('input', { type: 'file', accept: 'image/png,image/jpeg', 'aria-label': 'Attach a cover image', hidden: true, onchange: (ev) => { if (ev.target.files[0]) addCover(ev.target.files[0], 'attached'); ev.target.value = ''; } });

  // Generate: automation/thumbnail-template.html drawn in the browser, same numbers.
  const bgInput = h('input', { type: 'file', accept: 'image/png,image/jpeg', hidden: true, 'aria-label': 'Background image' });
  const canvas = h('canvas', { width: 1200, height: 628, 'aria-label': 'Generated cover preview' });
  const top = h('input', { type: 'range', min: 40, max: 95, value: 78, 'aria-label': 'Height of the number' });
  const size = h('input', { type: 'range', min: 40, max: 160, value: 70, 'aria-label': 'Size of the number' });
  let bg = null;
  const draw = () => {
    const c = canvas.getContext('2d');
    c.fillStyle = '#f2e9d8'; c.fillRect(0, 0, 1200, 628);
    if (bg) {
      const s = Math.max(1200 / bg.width, 628 / bg.height), w = bg.width * s, ht = bg.height * s;
      c.drawImage(bg, (1200 - w) / 2, (628 - ht) / 2, w, ht);
    }
    c.font = `900 ${size.value}px Georgia, "Times New Roman", serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    try { c.letterSpacing = '0.05em'; } catch { /* older browsers: slightly tighter */ }
    c.lineWidth = 3; c.strokeStyle = '#f2e9d8';
    c.fillStyle = '#d0342c';
    const y = 628 * Number(top.value) / 100;
    c.fillText(`DAY ${day}`, 600, y); c.strokeText(`DAY ${day}`, 600, y);
  };
  top.oninput = draw; size.oninput = draw;
  bgInput.onchange = (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => { bg = img; draw(); };
    img.src = URL.createObjectURL(file);
  };
  draw();
  const gen = h('div', { class: 'stack', hidden: true },
    h('div', { class: 'cover-stage' }, canvas),
    h('div', { class: 'row' }, h('label', { class: 'btn quiet' }, 'Clean background', bgInput),
      h('button', { class: 'btn ink', type: 'button', onclick: () => canvas.toBlob((b) => b && addCover(b, 'generated'), 'image/png') }, 'Save this cover')),
    h('label', { class: 'f' }, 'Height', top), h('label', { class: 'f' }, 'Size', size),
    h('button', { class: 'btn quiet', type: 'button', onclick: () => confirmJob('render-cover', { background: coverUrl.current || '', day }) }, 'Render with the script instead'));

  const urlInput = h('input', { type: 'text', placeholder: 'Public image link', 'aria-label': 'Public image link', spellcheck: false });
  const paintRaw = () => {
    if (!coverUrl.current || !repoInfo) return;
    urlInput.value = `https://raw.githubusercontent.com/${repoInfo.repo}/${repoInfo.branch}/${coverUrl.current}`;
  };
  let repoInfo = null;
  api('/api/git').then((g) => { repoInfo = g; paintRaw(); }).catch(() => {});

  return h('details', { class: 'step' }, h('summary', null, h('i', null, '2'), 'Cover', status),
    h('div', { class: 'in' },
      h('p', { class: 'small' }, h('b', null, 'Day ' + day), h('span', { class: 'mute' }, ", from the edition's date. Change only the number, on only page 1.")),
      thumbs,
      h('div', { class: 'row' },
        o.canvaUrl ? h('a', { class: 'btn', href: o.canvaUrl, target: '_blank', rel: 'noopener noreferrer' }, 'Open Canva') : h('a', { class: 'btn', href: 'https://www.canva.com/', target: '_blank', rel: 'noopener noreferrer' }, 'Open Canva'),
        h('label', { class: 'btn ink' }, 'Attach file', attach),
        h('button', { class: 'btn quiet', type: 'button', onclick: () => { gen.hidden = !gen.hidden; if (!gen.hidden) draw(); } }, 'Generate')),
      gen,
      h('label', { class: 'f' }, 'Set on Paragraph from this link', urlInput),
      h('p', { class: 'small mute' }, 'Paragraph fetches the link, so a local cover has to be committed and pushed first. The link above is where it lands.'),
      h('button', { class: 'btn', type: 'button', onclick: () => {
        const id = (document.querySelector('input[aria-label="Paragraph post id"]') || {}).value;
        if (!id) return showError('Link a post id in step 3 first.');
        return confirmJob('set-cover', { postId: id.trim(), url: urlInput.value.trim() });
      } }, 'Set the cover')));
}

// ---- socials ----
async function viewSocials() {
  loading('socials');
  const o = await overview();
  const { sets } = await api('/api/socials');
  const live = o.livePosts.slice(0, 15);
  const pick = h('select', { 'aria-label': 'Live edition' }, live.map((p) => h('option', { value: p.id }, p.title)));
  const blocks = h('div', { class: 'stack' });
  const stage = () => runJob('socials-stage', { postId: pick.value }, (j) => {
    blocks.replaceChildren();
    if (j.code !== 0) return;
    let d; try { d = JSON.parse(j.output.split('\n').find((l) => l.startsWith('{'))); } catch { return; }
    closeTape();
    blocks.append(h('p', { class: 'small mute' }, 'Paste in this order. Nothing here has been sent. Posting stays yours.'));
    for (const b of d.blocks) {
      const copy = h('button', { class: 'btn quiet', type: 'button', onclick: async () => { await copyText(b.body); copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy'; }, 1500); } }, 'Copy');
      const isTg = /telegram|\btg\b/i.test(b.name);
      blocks.append(h('article', { class: 'block' },
        h('header', null, h('b', { class: 'small' }, b.name), h('div', { class: 'row' },
          isTg && h('a', { class: 'btn quiet', target: '_blank', rel: 'noopener noreferrer', href: 'https://t.me/share/url?url=' + encodeURIComponent(d.url) + '&text=' + encodeURIComponent(b.body.replace(d.url, '').trim()) }, 'Open Telegram'),
          copy)),
        h('pre', null, b.body)));
    }
  });
  const setPick = h('select', { 'aria-label': 'Socials set' }, sets.map((s) => h('option', { value: s.stem }, s.stem)));
  const facts = () => {
    const set = sets.find((s) => s.stem === setPick.value);
    const ed = set && o.editions.find((e) => e.folder === 'published' && e.day === set.day);
    if (!ed) return showError('That set has no recorded edition to check against.');
    return runJob('socials-facts', { edition: ed.path, socials: set.files });
  };
  shell('socials', h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('p', { class: 'kicker' }, 'stage-socials.py, check-social-facts.py'), h('h1', { class: 'h' }, 'Socials'))),
    h('div', { class: 'grid-2' },
      h('section', { class: 'card stack' }, h('h2', { class: 'h3' }, 'Stage a live edition'),
        h('p', { class: 'small mute' }, 'Reads the live post, drops the real link into the set in drafts/socials/, runs the fact check, and refuses if anything fails.'),
        live.length ? pick : h('p', { class: 'notice' }, 'Could not list live editions.'),
        h('button', { class: 'btn red', type: 'button', disabled: !live.length, onclick: stage }, 'Stage it')),
      h('section', { class: 'card stack' }, h('h2', { class: 'h3' }, 'Fact check a set'),
        h('p', { class: 'small mute' }, 'Every number, handle, quote and link in a social has to be in its edition. It cannot judge a paraphrase.'),
        setPick, h('button', { class: 'btn', type: 'button', onclick: facts }, 'Check it'))),
    h('div', { class: 'stack', style: null }, h('div', { class: 'spacer' }), blocks)));
}

// ---- numbers ----
async function viewNumbers() {
  loading('numbers');
  const o = await overview();
  const sql = h('textarea', { rows: 3, 'aria-label': 'Query', placeholder: 'SELECT url, SUM(click_count) AS c FROM newsletter_link_clicks GROUP BY url ORDER BY c DESC LIMIT 8' });
  const recent = o.livePosts.slice(0, 8);
  shell('numbers', h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('p', { class: 'kicker' }, 'analytics.sh'), h('h1', { class: 'h' }, 'Numbers'))),
    !o.hasKey && h('div', { class: 'notice' }, 'Analytics needs PARAGRAPH_API_KEY on this server.'),
    h('div', { class: 'grid-2' },
      h('section', { class: 'card stack' }, h('h2', { class: 'h3' }, 'The weekly read'),
        h('p', { class: 'small mute' }, "From Paragraph's warehouse, not the in-app tab. It prints unique clickers as well as clicks, because both matter."),
        h('button', { class: 'btn red', type: 'button', onclick: () => runJob('analytics') }, 'Run it')),
      h('section', { class: 'card stack' }, h('h2', { class: 'h3' }, 'One query'), sql,
        h('button', { class: 'btn', type: 'button', onclick: () => runJob('analytics', { sql: sql.value || sql.placeholder }) }, 'Run query')),
      h('section', { class: 'card stack' }, h('h2', { class: 'h3' }, 'Latest live'),
        h('div', { class: 'lines' }, recent.map((p) => h('a', { class: 'line', href: liveUrl(p.slug), target: '_blank', rel: 'noopener' },
          h('span', { class: 'n' + (liveDay(p) ? '' : ' no') }, liveDay(p) || '-'),
          h('span', null, h('span', { class: 't' }, p.title), h('span', { class: 's' }, new Date(p.publishedAt).toLocaleDateString())))))))));
}

// ---- jobs ----
const JOB_CARDS = [
  ['status', 'Queue and drift', 'automation/status.sh', 'What is queued, and any edition live with no record.'],
  ['test-all', 'Full health check', 'automation/test-all.sh', 'Voice, links and records on every file. Slow: it opens every link.'],
  ['check-published', 'Tracked against Paragraph', 'automation/check-published.sh', 'Any tracked draft that has gone live.'],
  ['voice-test', 'Voice gate self-test', 'automation/test-check-voice.sh', 'Proves the gate can still see something.'],
  ['stage-test', 'Socials self-test', 'automation/test-stage-socials.py', 'No network.'],
  ['facts-test', 'Fact check self-test', 'automation/test-check-social-facts.py', 'No network.'],
  ['record-test', 'Record self-test', 'automation/test-record-edition.py', 'No network.'],
];

async function viewJobs() {
  loading('jobs');
  const o = await overview();
  const g = await api('/api/git');
  const since = h('input', { type: 'date', 'aria-label': 'Since', value: o.today });
  const files = g.changes.filter((c) => /^(drafts|published)\//.test(c.path) || c.path === 'automation/post-ids.json');
  const boxes = files.map((c) => ({ c, box: h('input', { type: 'checkbox', checked: true }) }));
  const msg = h('input', { type: 'text', 'aria-label': 'Commit message', placeholder: 'records: Day ' + o.day + ' published' });
  const branch = h('input', { type: 'text', 'aria-label': 'Branch name', value: 'records/day-' + o.day, spellcheck: false });
  const onMain = g.branch === 'main' || g.branch === 'master';
  const reload = () => viewJobs();
  shell('jobs', h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('p', { class: 'kicker' }, 'Everything that used to be a command'), h('h1', { class: 'h' }, 'Jobs'))),
    h('section', { class: 'card stack' },
      h('div', { class: 'row between' }, h('h2', { class: 'h3' }, 'Save to GitHub'), h('span', { class: 'mono mute' }, g.branch)),
      files.length ? h('div', { class: 'stack' }, boxes.map(({ c, box }) => h('label', { class: 'tick' }, box, h('span', { class: 'mono' }, c.path + ' ', tag(c.code || 'new')))))
        : h('p', { class: 'small mute' }, 'No draft, record or post id changes to save.'),
      files.length ? h('div', { class: 'grid-2' },
        h('label', { class: 'f' }, 'Message', msg),
        onMain && h('label', { class: 'f' }, 'New branch, since this repo works PR first', branch)) : null,
      h('div', { class: 'row' },
        h('button', { class: 'btn ink', type: 'button', disabled: !files.length, onclick: () => confirmJob('commit', { files: boxes.filter((b) => b.box.checked).map((b) => b.c.path), message: msg.value, branch: branch.value }, reload) }, 'Commit'),
        h('button', { class: 'btn', type: 'button', disabled: onMain, onclick: () => confirmJob('push', {}) }, 'Push'),
        h('button', { class: 'btn', type: 'button', disabled: onMain, onclick: () => confirmJob('pr', {}) }, 'Open PR'))),
    h('div', { class: 'spacer' }),
    h('section', { class: 'jobgrid' },
      JOB_CARDS.map(([id, title, cmd, note]) => h('article', { class: 'card jobcard' },
        h('div', null, h('h3', { class: 'h3' }, title), h('p', { class: 'small mute' }, note), h('p', { class: 'c' }, cmd)),
        h('button', { class: 'btn', type: 'button', onclick: () => runJob(id) }, 'Run'))),
      h('article', { class: 'card jobcard' },
        h('div', { class: 'stack' }, h('div', null, h('h3', { class: 'h3' }, 'Collect wins'), h('p', { class: 'small mute' }, 'Merged PRs since a date, across automation/repos.txt, to start a draft from what shipped.'), h('p', { class: 'c' }, 'automation/collect-wins.sh')), since),
        h('button', { class: 'btn', type: 'button', onclick: () => runJob('wins', { since: since.value }) }, 'Run')))));
}

// ---- sign in ----
function renderDoor() {
  const pw = h('input', { type: 'password', autocomplete: 'current-password', required: true, 'aria-label': 'Password' });
  const err = h('p', { class: 'err', hidden: true, role: 'alert' });
  $app.replaceChildren(h('div', { class: 'door' }, h('form', { onsubmit: async (ev) => {
    ev.preventDefault();
    try { await api('/api/login', { method: 'POST', body: { password: pw.value } }); state.authed = true; route(); }
    catch (e) { err.textContent = e.message; err.hidden = false; pw.value = ''; pw.focus(); }
  } },
    h('div', { class: 'z' }, 'ZAO'),
    h('div', null, h('h1', { class: 'h3' }, 'The Desk'), h('p', { class: 'small mute' }, 'Owner only.')),
    h('label', { class: 'f' }, 'Password', pw), err,
    h('button', { class: 'btn red block', type: 'submit' }, 'Sign in'))));
  pw.focus();
}

// ---- router ----
let leaveGuard = null;
let lastHash = location.hash;
async function route() {
  if (!state.authed) { renderDoor(); return; }
  if (leaveGuard && !leaveGuard()) { history.replaceState(null, '', lastHash); return; }
  leaveGuard = null; window.onbeforeunload = null;
  lastHash = location.hash;
  closeTape();
  const [, view, arg] = location.hash.match(/^#\/([a-z]+)(?:\/(.+))?$/) || [];
  try {
    if (view === 'edit' && arg) await viewEdit(decodeURIComponent(arg));
    else if (view === 'editions') await viewEditions();
    else if (view === 'socials') await viewSocials();
    else if (view === 'numbers') await viewNumbers();
    else if (view === 'jobs') await viewJobs();
    else await viewToday();
    window.scrollTo(0, 0);
  } catch (e) {
    if (e.status !== 401) shell('today', h('div', { class: 'notice bad' }, e.message));
  }
}
window.addEventListener('hashchange', route);

(async () => {
  const s = await api('/api/session').catch(() => ({ authed: false }));
  state.authed = s.authed;
  route();
})();
