# CLAUDE.md - ZAO on Paragraph

## What this is

The dedicated home for **The ZAO newsletter on Paragraph** (paragraph.com/@thezao). All newsletter work lives here: drafting, editing, publishing to Paragraph, and distribution. Spun out 2026-07-07 so newsletter work has its own clean terminal, separate from the ZAOOS monorepo.

The ZAO newsletter: **400+ editions** across Year of the ZAO / Year of the ZABAL / ZTalent series, 78 paid supporters. Daily build-in-public documentation. Currently produced via the **zabalnewsletterbuilder** (Vercel daily-3 tool, live at zabalnewsletterbuilder.vercel.app; runbook = that repo's NEWSLETTER-UPDATE.md).

## Immediate goal (why this repo exists now)

**Clean up Paragraph posting.** Paragraph shipped an onboarding AI assistant (app.paragraph.com/onboard) that offers to help with posts/drafts/distribution. Decide and standardize ONE clean flow:
- Onboard the @thezao publication as an EXISTING newsletter (not from scratch).
- Decide: lean on Paragraph's new AI assistant, OR keep the zabalnewsletterbuilder daily-3 flow. Pick one, make it clean, document it.

## Folders

| Folder | What |
|--------|------|
| `drafts/` | Newsletter drafts in progress (markdown) |
| `published/` | Shipped editions (archive of what went out) |
| `templates/` | Reusable formats (daily-3, deep-dive, recap) |
| `automation/` | Posting scripts, Paragraph API glue, distribution |
| `research/` | Newsletter strategy, Paragraph platform notes, growth |

## Voice + rules (non-negotiable)

- **ZAO voice = prose in the real voice, NEVER bullet lists.** The newsletter is written, not outlined. (Global rule: [feedback_zao_voice_prose_not_lists].)
- **No emojis. No em dashes.** Plain hyphens, text labels.
- After publishing an edition, generate socials in posting order (Firefly / X-GC / FC-GC / TG / Discord / LinkedIn / FB) as a clipboard - do NOT auto-post. (Global rule: [feedback_newsletter_socials_after_publish].)
- Spellings: The ZAO, WaveWarZ, ZABAL, COC Concertz, etc. (per the brand glossary).

## Boundaries

- **Never commit secrets.** Paragraph API keys, tokens, `.env` - all gitignored, injected at runtime only.
- **No PII / finance here** - that lives in `finance-hq`. This repo is newsletter content + tooling only.
- **PR-first for anything shared**, but this is Zaal's own repo - direct commits on a branch are fine for solo drafting.

## Related

- ZAOOS newsletter research: docs in `research/business/` (newsletter strategy, 957 reach playbook).
- `zabalnewsletterbuilder` (separate Vercel repo) - the current daily-3 generator.
- Paragraph publication: paragraph.com/@thezao.
