# A new way to leverage Paragraph - morning brief

Date: 2026-07-09 (evening pass, for 2026-07-10 morning)
Scope: dug past the newsletter into the wider ZAO ecosystem (ZAOOS monorepo, COC Concertz, ZABAL Games) to find a Paragraph angle not already covered by today's earlier work (the daily-3 flow, the automation pipe, the Writer Coin/ZABAL tension, the native AI agent, the email growth audit).

## What's actually real vs. still on paper

Checked two other parts of the ecosystem for what's shipped vs. planned, since a new idea is only worth acting on if it's built on something that already exists:

**COC Concertz - real.** 4 completed shows with YouTube recordings (#1 Mar 2025, #2 Oct 2025, #3 Mar 2026, #4 uploading now). Real artists with real released work: Joseph Goats (5 originals), Tom Fellenz (5+ songs), Stilo World (full 8-track "Ambition" album, performed live). Source: `ZAOOS/research/community/352-coc-concertz-full-context-artist-profiles/README.md`. Its own Paragraph/Publish.new integration is marked "Future" in its roadmap - `/admin/newsletter/`, AI content generation, and smart-contract reward distribution are all unbuilt. Source: `ZAOOS/research/business/322-paragraph-publishnew-newsletter-agent-commerce/README.md`.

**ZABAL Games - still architecture, not activity.** No workshops have run, zero builder submissions, no mentors confirmed, no Lu.ma calendar shipped despite being decided in April. Source: `ZAOOS/research/events/701-zabal-games-canonical-state/README.md`, `ZAOOS/research/business/1009-zaofestivals-brand-audit/README.md`. Not a fit for anything Paragraph-related yet - there's no content to distribute.

**The giveaway article (doc 958) - real plan, no draft yet.** Working title "Claude Code runs my daily newsletter. here is the exact system, free." Planned for Jul 14 2026, modeled on a 1.49M-view precedent piece. No draft exists yet. Source: `ZAOOS/research/dev-workflows/958-giveaway-system-article-newsletter/README.md`.

## The new idea: use Paragraph as distribution for content that already exists, not just the newsletter

Two tracks, both new, both distinct from anything covered earlier today:

### Track A - ready now, zero new content needed

Paragraph supports multiple publications under one account (shipped Aug 2025) - one login, separate publications, managed from a dropdown in the dashboard. [[paragraph.com/@blog/one-account-multiple-publications]](https://paragraph.com/@blog/one-account-multiple-publications) COC Concertz already has real, finished content (4 shows, name-checked artists, actual songs) sitting only on YouTube and a Firestore-backed site - none of it is on Paragraph today.

Doc 322 already priced this: show recaps $1-3, artist kits $0.50-2, data digests $1/issue - but priced it for COC Concertz's own not-yet-built Publish.new integration. There's no need to wait for that. A second Paragraph publication (e.g. "COC Concertz" under the same account) could carry Show #4's recap as its first post the moment it's ready, using the exact same draft-only pipe already built today - no new code, just a second publication and a second scoped API key.

**What's not confirmed and needs a real check before committing:** whether a second publication needs its own separate API key (reasonable to assume yes, based on how `GET /v1/me` returned single-publication-scoped data today, but not documented outright), and - importantly - whether this is Zaal's call alone to make or needs buy-in from whoever runs COC Concertz day-to-day. This is a cross-project move, not a solo newsletter decision.

### Track B - Jul 14, one new piece of content

The giveaway article (doc 958) is being written specifically to go viral (modeled on a 1.49M-view reference piece). Rather than only publishing it as a normal @thezao post, it could be pushed as its own Content/Post Coin - each Paragraph post can become its own tradable ERC-20 with a 0.475% creator fee per trade. [[research/2026-07-09-paragraph-platform-potential.md]](2026-07-09-paragraph-platform-potential.md)

This is deliberately NOT the Writer Coin question flagged earlier today (that one is publication-wide, competes with the ZABAL token narrative, and is a real open tension). A single post-coin on one article is scoped to that one piece of content only - if it goes viral like its reference case, a per-trade fee captures real upside from that exact spike without touching the ZABAL-vs-newsletter-identity question at all. If it doesn't go viral, nothing is lost - it just behaves like a normal post.

## Concrete morning actions, in order

1. Confirm with whoever runs COC Concertz day-to-day whether a Paragraph presence for show recaps is wanted before setting anything up (Track A needs that buy-in, this isn't just Zaal's newsletter to decide alone).
2. If yes: create the second publication via the Paragraph dashboard dropdown, generate its own API key, and reuse `automation/create-draft.sh` (already built, already tested) to draft Show #4's recap as its first post.
3. Separately, when the giveaway article (doc 958) is actually drafted for Jul 14: decide up front whether to publish it as a coined post - this needs no new tooling, just checking the "make it a post coin" option on that one post.

## What this deliberately does not resolve

The Writer Coin question for @thezao itself is still open and still a real tension against ZABAL - this brief doesn't touch it. ZABAL Games has no content yet, so there's nothing to bring to Paragraph from it today - revisit once workshops actually run.

## Sources

- ZAOOS repo: `research/community/352-coc-concertz-full-context-artist-profiles/README.md`
- ZAOOS repo: `research/business/322-paragraph-publishnew-newsletter-agent-commerce/README.md`
- ZAOOS repo: `research/events/701-zabal-games-canonical-state/README.md`
- ZAOOS repo: `research/business/1009-zaofestivals-brand-audit/README.md`
- ZAOOS repo: `research/dev-workflows/958-giveaway-system-article-newsletter/README.md`
- [paragraph.com/@blog/one-account-multiple-publications](https://paragraph.com/@blog/one-account-multiple-publications)
- This repo: `research/2026-07-09-paragraph-platform-potential.md` (Content/Post Coin mechanics)
