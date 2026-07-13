# Draft email to Paragraph (Colin Armstrong, Reid DeRamus)

Status: DRAFT ONLY - Zaal sends, not automated. Source: doc 1066 (ZAOOS PR #1319), "What to REQUEST from Paragraph" table.

---

Subject: Feature requests following up on our call - BYOK, native Farcaster casting, headless docs

Hi Colin, hi Reid,

Thanks again for the call last week. We've started building on the existing API right away - a full headless archive of The ZAO's 368 published editions, live against your public posts endpoint, no key required. That part works well today and we're moving on to pulling real analytics into our draft pipeline next.

A few things came up in the call that would help us go further, in rough priority order:

1. BYOK for the AI agent. The ZAO's newsletter voice has hard rules - no em dashes, no emojis, a fixed structure, a fixed signoff - and our own pipeline already enforces those. To use your new agent for anything beyond a narrow read-only lane (SEO checks, archive tidying), we'd need to bring our own model or override the agent's system prompt. Is BYOK or a custom endpoint on the roadmap.

2. Native Farcaster cast creation. Today a Paragraph post gets a Mini App embed and a link preview on Farcaster. Since Farcaster is where a lot of our readers already are, a "publish creates a native cast" flow (not just a preview) would close a real gap for us, similar to what Twitter integration looks like on other platforms.

3. Headless CMS documentation. We ended up reverse-engineering the pattern (fetch posts via the public API, render independently of paragraph.com) from the general API reference rather than a guide written for it. A short "build a headless site on Paragraph" doc would help us and probably other publishers already doing this quietly.

4. ICM-style metadata export. A structured export of publication metadata (author, subscriber count, top posts, tagline) in a format AI agents can consume directly would fit naturally with the headless work above.

5. Credit usage visibility. When we call the agent, create drafts, or query analytics, it would help to see a per-operation credit cost (something like an X-Credits-Used header) so we can forecast spend before we scale up usage.

6. Segmented subscriber export. Today's export is a flat CSV. Being able to filter by paid vs free, join-date range, or recent engagement would let us build more targeted remix or campaign templates.

7. Local model fallback. Lower priority, but worth flagging - the ability to point AI features at a local or self-hosted model would help for offline/low-connectivity work and for cases where we want tighter privacy control.

8. Live-stream embedding. Also lower priority - being able to embed a live stream (Restream, Twitch, Cal.com event) directly in a post, or as its own post type, would help for event coverage editions.

None of this is urgent - we're shipping against the existing API in the meantime and will keep you posted on what we build. Happy to jump on a call if useful.

Best,
Zaal

---

## Notes for Zaal before sending

- Numbers 1-4 are the ones doc 1066 marked HIGH/MEDIUM priority; 5-8 are LOW. Trim if the email reads too long.
- "368 published editions" is the live count as of 2026-07-13 (see the archive verification doc in this folder) - update if it's stale by the time this goes out.
- Nothing here restates anything negative about Colin, Reid, or Paragraph - it's framed as roadmap requests only, consistent with the boundary in this repo's CLAUDE.md.
