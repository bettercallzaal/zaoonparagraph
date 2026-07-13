# Build 1 verification - archive.html against the live Paragraph API

Date: 2026-07-13
Trigger: doc 1066 (ZAOOS PR #1319) called for Build 1, the headless archive page, with an explicit gate - verify the cited endpoints against Paragraph's live docs/API before coding, since doc 1066 is research, not a confirmed spec.

## What doc 1066 claimed vs what's real

- Claimed `GET /v1/publications/.../posts` - real path is `GET https://public.api.paragraph.com/api/v1/publications/{publicationId}/posts`, confirmed against `paragraph.com/docs/api-reference/posts/get-posts-in-a-publication.md` and live curl. Query params: `cursor`, `limit` (1-100, default 10), `includeContent` (default false). Response has `items[]` + `pagination: {cursor, hasMore, total}`. No auth required.
- Claimed "400+ posts" - live `pagination.total` for publication `DB7iU1HMVzTT9bI4ec6X` (@thezao) is 368 published posts via this endpoint. Close to doc 1066's number but not exact - noting the real figure here since the archive page is built against it.
- Also confirmed live, not in doc 1066 but needed for Build 2 later: `GET /v1/publications/{id}` (no auth, publication metadata, no subscriber count in this response), `GET /v1/publications/{id}/subscribers/count` (no auth, `{count: number}` - live value 592), and the analytics endpoint is really named `run-an-analytics-sql-query` at `api-reference/analytics/run-an-analytics-sql-query.md` (doc 1066 called it `run-query` - close but the doc slug is different, worth using the real slug when this gets built).

## What got built

`archive.html` - paginates all posts client-side via cursor, no build step, no key, matches `index.html`'s existing design system (same CSS variables, monospace, light/dark via `prefers-color-scheme`). Load-more button walks `pagination.cursor` until `hasMore` is false. In-page title filter scoped to what's already loaded (not a server-side search - that endpoint doesn't exist for this shape). Linked from `index.html`'s "read it" section.

Tested in a real browser (local static server + headless Chromium session): initial load pulled 20 real posts, filter matched a substring correctly, load-more advanced to 40 posts confirmed via direct DOM inspection. Zero console errors from the page itself (one unrelated wallet-extension exception in the browser session, not from this code).

## Ship criteria (from doc 1066) - met

- Archive page resolves to a working URL - yes, `archive.html`, 200 locally.
- Displays 10+ posts - yes, 20 on first load.
- Pagination works - yes, confirmed second page loads real data via cursor.
- Page links from the main @thezao... - linked from this repo's `index.html`. (Paragraph publication description itself is a separate, manual Settings change - not done here, that's a Zaal action on paragraph.com if wanted.)

## Sources

- `paragraph.com/docs/api-reference/posts/get-posts-in-a-publication.md`
- `paragraph.com/docs/api-reference/publications/get-publication-by-id.md`
- `paragraph.com/docs/api-reference/publications/get-subscriber-count.md`
- `paragraph.com/docs/llms.txt` (full endpoint index)
- Live curl + browser test against publication `DB7iU1HMVzTT9bI4ec6X`, 2026-07-13
