# Going headless against Paragraph - a working experiment

Date: 2026-07-10
Trigger: read Paragraph's website/publishing docs, wanted to keep experimenting with what's possible against the platform - specifically anything headless.

## What Paragraph's own website docs say

Two official paths exist for a publication's site: Paragraph's default hosted design ("clean, fast, ready the moment you publish"), or a custom site built through the native agent's chat interface, which iterates against your real posts/pages and - same gate as everything else about this agent - **"never publishes website changes on its own, deploys wait for your explicit go-ahead."** Custom domains need Starter tier or above. All of this lives in Settings > Website. Source: `docs.paragraph.com/publishing/website`.

Neither path is headless in the traditional sense - both are ways of controlling a site that Paragraph itself hosts and renders.

## Going headless anyway - Paragraph never uses that word, but the API supports it directly

`GET /v1/publications/{publicationId}/posts` is public, no authentication required, and returns everything needed to render a reading experience anywhere: title, slug, subtitle, image, publish date, author info, and full content when `includeContent=true`. Source: `paragraph.com/docs/api-reference/posts/get-posts-in-a-publication.md`.

This means any frontend - this repo's own explainer site, a mobile app, anything - can pull @thezao's real content directly and render it independently of paragraph.com's own page design. That's the headless pattern, just not a term Paragraph markets.

## Proved it live, not just in theory

Added a "latest issues" section to `index.html` that client-side fetches the 3 most recent real posts from this exact endpoint and renders them - no build step, no server, no API key (this is the public read endpoint, separate from the authenticated write key already in `.env`). Tested in a real browser (not just curl, since curl doesn't enforce CORS): started a local static server, loaded the page in a headless Chromium session, confirmed zero console errors and the real posts rendered (Day 185, 184, 182, pulled live). Screenshot taken as evidence before shipping.

This is a small proof, not a full headless rebuild - but it confirms the entire foundation works today, with zero new infrastructure, using a repo that already exists.

## Two small things noticed along the way, unrelated to headless but worth a line

- The live Day 185 post's `subtitle` field contains a literal em dash: "The arcade doubled overnight — 8 games, 8 empty July leaderboards." Same class of finding as the publication summary em dash flagged earlier this session - still unfixed.
- The `authors` field returned by the API still carries an old bio describing "the ZTalent Newsletter," "InnoJam Spotlight," and "PlugIn Pulse" - language from a prior era of this newsletter, not updated to reflect "The ZAO Newsletter" branding. Cosmetic, but it's what the public API actually serves to anyone building against it.

## What a fuller headless build could look like, if this is worth pursuing further

Not built yet, just scoped: a real archive page on the explainer site (or its own dedicated page) that paginates through the full post history via `cursor`, renders full content via `includeContent=true`, and gives readers a second, ZAO-controlled way to browse 400+ editions - independent of paragraph.com's own design, fully within this repo's existing static-site setup.

## Sources

- `docs.paragraph.com/publishing/website`
- `paragraph.com/docs/api-reference/posts/get-posts-in-a-publication.md`
- Live API test against publication `DB7iU1HMVzTT9bI4ec6X`, 2026-07-10
