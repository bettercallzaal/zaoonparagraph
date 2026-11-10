// Shared pieces for blog.thezao.com: fetch from Paragraph's public API and
// render one page. Vercel does not route files that start with "_", so this
// is a module, not an endpoint.
//
// Why this exists: Paragraph's "Your own website" setting sends readers of
// each Web Article to our own page for it. Newsletters, the subscribe page
// and RSS stay on Paragraph. Plan: docs/blog-thezao-com-plan-2026-11-09.md.
//
// No API key: the public API is unauthenticated, and this repo is public.

const API = "https://public.api.paragraph.com/api/v1";
const PUBLICATION_ID = "DB7iU1HMVzTT9bI4ec6X"; // The ZAO, same id as index.html
const ORIGIN = (process.env.BLOG_ORIGIN || "https://blog.thezao.com").replace(/\/+$/, "");
const PARAGRAPH_HOME = "https://paragraph.com/@thezao";
const SUBSCRIBE = "https://paragraph.com/@thezao/subscribe";
const UA = "zaoonparagraph-blog/1.0"; // a bare client User-Agent can get a 403 from this API
const SLUG = /^[a-z0-9][a-z0-9-]{0,199}$/;

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Paragraph renders the body, and we only ever ask for our own publication,
// so this is defence in depth, not a full sanitizer: no scripts, no
// stylesheet links, no inline handlers, no javascript: URLs, and only
// youtube-nocookie iframes (the one embed host the last 40 posts use).
function clean(html) {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
    .replace(/<iframe\b(?![^>]*\bsrc="https:\/\/www\.youtube-nocookie\.com\/)[\s\S]*?(<\/iframe\s*>|>)/gi, "");
}

async function api(path, fetchImpl) {
  const f = fetchImpl || fetch;
  const res = await f(API + path, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = new Error("paragraph api " + res.status);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function getPost(slug, fetchImpl) {
  return api("/publications/" + PUBLICATION_ID + "/posts/slug/" + encodeURIComponent(slug) + "?includeContent=true", fetchImpl);
}

function listPosts(cursor, fetchImpl) {
  return api("/publications/" + PUBLICATION_ID + "/posts?limit=30" + (cursor ? "&cursor=" + encodeURIComponent(cursor) : ""), fetchImpl);
}

function day(ms) {
  const n = Number(ms);
  if (!n) return "";
  return new Date(n).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "America/New_York" });
}

const CSS = `
:root{color-scheme:light dark;--bg:#0b0b0c;--fg:#f2f2f0;--muted:#9a9a95;--line:#262625}
@media (prefers-color-scheme:light){:root{--bg:#faf9f6;--fg:#16160f;--muted:#5c5c56;--line:#e2e0da}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.65;font-size:18px}
header,main,footer{max-width:680px;margin:0 auto;padding:0 16px}
header{padding-top:2rem;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:.85rem;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}
header a,footer a{color:var(--muted);text-decoration:none}
main{padding-top:2rem;padding-bottom:3rem}
h1{font-size:2rem;line-height:1.2;margin:0 0 .5rem}
.sub{color:var(--muted);margin:0 0 .5rem}
.meta{color:var(--muted);font-size:.85rem;font-family:ui-monospace,"SF Mono",Menlo,monospace;margin:0 0 2rem}
.cover{width:100%;height:auto;border-radius:6px;margin:0 0 2rem}
article img,article iframe{max-width:100%;height:auto}
article iframe{aspect-ratio:16/9;width:100%;border:0}
article a,.list a{color:var(--fg)}
article figure{margin:1.5rem 0}
article figcaption{color:var(--muted);font-size:.85rem}
article hr{border:0;border-top:1px solid var(--line);margin:2rem 0}
.cta{display:inline-block;margin:2rem 0 0;padding:.6rem 1rem;border:1px solid var(--fg);border-radius:6px;color:var(--fg);text-decoration:none;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:.9rem}
.list{list-style:none;padding:0;margin:0}
.list li{border-top:1px solid var(--line);padding:1rem 0}
.list a{text-decoration:none;font-weight:600}
.list p{margin:.25rem 0 0;color:var(--muted);font-size:.95rem}
.more{display:inline-block;margin-top:1.5rem;color:var(--muted)}
footer{border-top:1px solid var(--line);padding-top:1rem;padding-bottom:3rem;color:var(--muted);font-size:.85rem;font-family:ui-monospace,"SF Mono",Menlo,monospace}
`;

function shell({ title, description, canonical, image, body }) {
  const t = esc(title);
  const d = esc(description || "");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${esc(canonical)}">
<link rel="alternate" type="application/rss+xml" title="The ZAO" href="https://api.paragraph.com/blogs/rss/@thezao">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ""}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
${image ? `<meta name="twitter:image" content="${esc(image)}">` : ""}
<style>${CSS}</style>
</head>
<body>
<header><a href="${ORIGIN}/editions">The ZAO</a><a href="${SUBSCRIBE}">Subscribe</a></header>
<main>
${body}
</main>
<footer>The ZAO newsletter. Every edition is also on <a href="${PARAGRAPH_HOME}">Paragraph</a>, where you can <a href="${SUBSCRIBE}">subscribe</a>.</footer>
</body>
</html>`;
}

function postPage(post, slug) {
  const canonical = ORIGIN + "/" + slug;
  const cover = post.imageUrl ? `<img class="cover" src="${esc(post.imageUrl)}" alt="">` : "";
  const body = `<article>
<h1>${esc(post.title)}</h1>
${post.subtitle ? `<p class="sub">${esc(post.subtitle)}</p>` : ""}
<p class="meta">${esc(day(post.publishedAt))}</p>
${cover}
${clean(post.staticHtml)}
</article>
<a class="cta" href="${SUBSCRIBE}">Subscribe to The ZAO</a>`;
  return shell({ title: post.title, description: post.subtitle, canonical, image: post.imageUrl, body });
}

function listPage(data) {
  const items = (data && data.items) || [];
  const rows = items
    .filter((p) => p && p.slug && p.publishOnline !== false)
    .map((p) => `<li><a href="${ORIGIN}/${esc(p.slug)}">${esc(p.title)}</a><p>${esc(day(p.publishedAt))}${p.subtitle ? " - " + esc(p.subtitle) : ""}</p></li>`)
    .join("\n");
  const pg = (data && data.pagination) || {};
  const more = pg.hasMore && pg.cursor ? `<a class="more" href="${ORIGIN}/editions?cursor=${encodeURIComponent(pg.cursor)}">Older editions</a>` : "";
  const body = `<h1>The ZAO</h1>
<p class="sub">The daily newsletter of The ZAO. Build in public, every day.</p>
<ul class="list">
${rows}
</ul>
${more}`;
  return shell({ title: "The ZAO", description: "The daily newsletter of The ZAO.", canonical: ORIGIN + "/editions", image: null, body });
}

function notFound(heading, line) {
  return shell({
    title: (heading || "Not found") + " - The ZAO",
    description: "",
    canonical: ORIGIN + "/editions",
    image: null,
    body: `<h1>${esc(heading || "Not found")}</h1><p class="sub">${esc(line || "No edition at this address.")}</p><a class="cta" href="${ORIGIN}/editions">All editions</a>`,
  });
}

function send(res, status, html, cache) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", cache || "public, s-maxage=300, stale-while-revalidate=86400");
  res.end(html);
}

module.exports = { SLUG, ORIGIN, clean, esc, getPost, listPosts, postPage, listPage, notFound, send };
