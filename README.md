# zaoonparagraph

The ZAO newsletter on Paragraph (paragraph.com/@thezao) - drafting, publishing, and distribution.

## Structure

- `drafts/` - work in progress
- `published/` - shipped editions
- `templates/` - daily-3 / deep-dive / recap formats
- `automation/` - Paragraph API + distribution scripts
- `research/` - strategy + platform notes

See `CLAUDE.md` for the charter, voice rules, and the current cleanup goal.

## Daily workflow

1. `automation/collect-wins.sh <since-date>` - pulls real merged PRs across the repos listed in `automation/repos.txt`, so a draft starts from what actually shipped instead of a manual grep across repos.
2. Draft in `drafts/` using the matching format in `templates/` (`daily-3.md`, `weekly-recap.md`, or `deep-dive.md`).
3. `automation/check-voice.sh drafts/<file>` - runs every mechanical voice check in one shot (commas, em dashes, exclamation, work-day time refs, single signature, opens with zm., word count band). `create-draft.sh` and `update-draft.sh` both run this automatically and refuse to push on a hard failure (`--force` to override).
4. `automation/create-draft.sh drafts/<file>` - pushes it to Paragraph as a draft (never publishes, never sends the newsletter). Title is auto-derived from the file's `# Heading` line unless passed explicitly.
5. Need to fix something after it's already pushed? `automation/update-draft.sh <post-id> drafts/<file>` updates it in place - no duplicate draft.
6. `automation/check-published.sh` - checks every tracked draft (`automation/post-ids.json`, written automatically by `create-draft.sh`) against Paragraph's real live status and flags any that have actually been published so they're not sitting un-archived.
7. Once Zaal actually publishes it on Paragraph: `automation/archive-issue.sh drafts/<file>` moves it to `published/` and updates `post-ids.json` to match - so that folder is a real archive instead of staying empty, and the ID tracking stays correct after the move.

## Thumbnail

The daily design lives in Canva ("ZABAL Daily Designs") - only the day number changes issue to issue. Three tested steps replace manually editing the number and re-downloading:

1. `automation/render-thumbnail.sh <clean-background.png> <day-number> <output.png>` - overlays "DAY N" onto a background with the number removed in Canva. `--top` / `--font-size` nudge the position if needed.
2. Commit the rendered PNG to this repo (e.g. `assets/thumbnails/day-N.png`) and push - `raw.githubusercontent.com/bettercallzaal/zaoonparagraph/main/assets/thumbnails/day-N.png` is the hosted URL Paragraph will fetch.
3. `automation/set-thumbnail.sh <post-id> <raw-url>` - sets it as the post's thumbnail. Paragraph fetches and re-hosts it on their own storage, so the raw GitHub URL only needs to be reachable at call time.

All three steps tested individually and working. Not yet combined into one script since there's no real background image to test the full pipeline against.

## Current focus

Paragraph posting is decided: keep the zabalnewsletterbuilder + zaoonparagraph daily-3 flow as production (draft-only, human-gated). Paragraph's own native AI agent (shipped 2026-07-07) is worth piloting narrowly later, not a replacement yet - see `research/2026-07-09-paragraph-platform-potential.md` for why.
