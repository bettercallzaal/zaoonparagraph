# zaoonparagraph

**The ZAO newsletter on Paragraph** - drafting, editing, publishing to Paragraph, and distribution all in one place. 400+ editions of daily build-in-public documentation across three series (Year of the ZAO, Year of the ZABAL, ZTalent), with 78 paid supporters.

## Status

Working and shipping daily. All tooling is in place and tested:
- Daily-3 builder: work starts at zabalnewsletterbuilder.vercel.app (separate repo)
- Draft validation: voice checks, link checks, thumbnail rendering all pass
- Publishing: drafts push to Paragraph's API without auto-publish (human gate only)
- Archive: infrastructure exists to move published editions to `published/` folder and track post IDs

Current bottleneck: the scripts handle 5 sitting drafts (Days 190-194) ready to push, but human editorial decision on when to publish them is the actual gate, not tooling.

Open PR: #30 adds auto .env loading and a `status.sh` command to see what's blocking posting at a glance.

## Stack

- Shell scripts (bash 4+) for automation - no npm, no build
- Paragraph public API (no auth required for reads) and authenticated API (PARAGRAPH_API_KEY from .env)
- Local file system: markdown drafts, post ID tracking, shell utilities
- Static HTML landing page (index.html) that runs headless against Paragraph's public API

## Setup

### Environment

Copy `.env.example` to `.env` and fill in your Paragraph API key:

```bash
cp .env.example .env
# Edit .env and add your PARAGRAPH_API_KEY
# (from Paragraph Settings > Workspace > Developer, scoped to the @thezao publication)
```

The `.env` file is gitignored - never commit it. All scripts auto-source it if not already in shell.

### Run commands

```bash
# Validate voice and links on a draft
automation/check-voice.sh drafts/<filename>
automation/check-links.sh drafts/<filename>

# Health check: see what's pushed, what's published, what's pending
automation/status.sh

# Render thumbnail: overlay "DAY N" onto a background image
automation/render-thumbnail.sh <background.png> <day-number> <output.png>

# Push a draft to Paragraph (never publishes, just creates draft)
automation/create-draft.sh drafts/<filename>

# Update an already-pushed draft in place (no duplicates)
automation/update-draft.sh <post-id> drafts/<filename>

# Set a thumbnail on a live Paragraph post
automation/set-thumbnail.sh <post-id> <raw-github-url>

# Move a published edition from drafts/ to published/ and sync post IDs
automation/archive-issue.sh drafts/<filename>

# Full health check (voice + links on all drafts)
automation/test-all.sh
```

### Collect wins

Pull actual merged PRs across your repos into a draft, so it starts from what shipped (not manual grep):

```bash
# Edit automation/repos.txt to list your local repo paths
automation/collect-wins.sh 2026-07-12
# Output goes to stdout - copy into a new draft
```

## Architecture

| Folder | Purpose |
|--------|---------|
| `drafts/` | Markdown work-in-progress, not yet published |
| `published/` | Archive of editions that went live (moved here after Zaal publishes on Paragraph) |
| `templates/` | Reusable markdown formats: `daily-3.md`, `deep-dive.md`, `weekly-recap.md` |
| `automation/` | Paragraph API integration scripts + voice/link checks + status reporting |
| `research/` | Strategy notes, Paragraph platform findings, growth docs |
| `index.html` | Static landing page that live-fetches latest posts from Paragraph's public API (proof of headless capability) |

### How to continue

Immediate next steps come from ZAOOS research doc 1066 (build-now list):

1. **Headless archive page** - expand index.html's "latest issues" into a full paginated archive of all 400+ editions via Paragraph's public API. No build step, live content, ZAO-controlled rendering.
2. **Analytics dashboard** - track readers, engagement, subscriber growth over time. Hook Paragraph's webhook API or poll metrics.
3. **Multiple publications** - extend the scripts to handle multiple Paragraph publications (e.g., WaveWarZ newsletter, COC Concertz updates) from the same repo.
4. **Remixes** - tooling to cross-post or redistribute editions to other platforms (email, Farcaster, Twitter/X) with platform-specific formatting.
5. **Webhook bridge** - listen for Paragraph publish/draft events and trigger automations (e.g., auto-generate socials, auto-archive, auto-ping Telegram when something goes live).

See `research/2026-07-10-headless-paragraph-experiment.md` for a working proof that Paragraph's public API supports headless rendering.

### Important caveats

- **Paragraph API key**: NEVER commit it. The `.env` file must stay gitignored. Keys are injected at runtime only.
- **Voice checks**: All lowercase, no commas in titles, every issue opens with "zm.", no emojis, no em dashes, single signoff. The scripts enforce this - they refuse to push on voice failure unless `--force` is passed.
- **Publishing is gated**: create-draft.sh pushes to Paragraph as a draft (never published). Actual publication happens in Paragraph's UI only - this repo has zero auto-publish.
- **Post ID tracking**: automation/post-ids.json tracks which drafts map to which Paragraph post IDs, so `update-draft.sh` can edit in place without duplicates. Keep it in sync when publishing or archiving.

## Workflow example

1. Visit zabalnewsletterbuilder.vercel.app and compose a daily-3 issue.
2. Copy the output and paste it into a new file: `drafts/2026-07-14-day-195.md`.
3. Run `automation/check-voice.sh drafts/2026-07-14-day-195.md` to validate tone and formatting.
4. Run `automation/create-draft.sh drafts/2026-07-14-day-195.md` to push it as a draft to Paragraph.
5. Review the draft on Paragraph (paragraph.com/@thezao) for any final tweaks.
6. Make edits locally and re-run `automation/update-draft.sh <post-id> drafts/2026-07-14-day-195.md` to sync.
7. When ready, publish on Paragraph's UI.
8. Run `automation/archive-issue.sh drafts/2026-07-14-day-195.md` to move it to `published/` and sync tracking.

## Voice rules (non-negotiable)

- All lowercase. No title case.
- No commas in titles. Sparse punctuation overall.
- Every issue opens with "zm." (ZAO morning briefing signature).
- No emojis. No em dashes (use plain hyphens).
- Single signoff: "BetterCallZaal on behalf of the ZABAL Team."
- Prose in the real voice, never bullet lists.
- See CLAUDE.md for full charter and enforcement.

## Related

- **zabalnewsletterbuilder** (separate repo) - the Vercel daily-3 composer tool
- **Paragraph publication** - the live newsletter at paragraph.com/@thezao
- **ZAOOS research** - strategy docs in ZAOOS repo (doc 1066 = build-now roadmap, doc 957 = reach playbook, others = growth/platform findings)

## For the next person

A fresh Claude Code session reading only this README should be able to:
- Understand what the repo does and why it exists
- Set up the environment (copy `.env.example`, add PARAGRAPH_API_KEY)
- Run any of the main commands without guessing
- Know where to find strategy docs and how to pick up the next feature
- Understand the voice rules so edits stay on-brand
- See the one open PR and know what it does

The repo should be plug-and-play after setup. If something doesn't work, the automation/test-all.sh health check will tell you what's broken.
