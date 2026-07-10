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
3. `automation/create-draft.sh <file> "<title>"` - pushes it to Paragraph as a draft (never publishes, never sends the newsletter).
4. Once Zaal actually publishes it on Paragraph: `automation/archive-issue.sh drafts/<file>` moves it to `published/` so that folder is a real archive instead of staying empty.

## Current focus

Paragraph posting is decided: keep the zabalnewsletterbuilder + zaoonparagraph daily-3 flow as production (draft-only, human-gated). Paragraph's own native AI agent (shipped 2026-07-07) is worth piloting narrowly later, not a replacement yet - see `research/2026-07-09-paragraph-platform-potential.md` for why.
