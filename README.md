# zaoonparagraph

**The ZAO newsletter on Paragraph** - drafting, editing, publishing to Paragraph, and distribution all in one place. 400+ editions of daily build-in-public documentation across three series (Year of the ZAO, Year of the ZABAL, ZTalent), with 78 paid supporters.

## Status (2026-08-25)

The newsletter is shipping. This repo is the home for craft, record and checks -
it is not the thing that pushes editions to Paragraph.

- Live cadence: six editions published between 2026-07-24 and 2026-08-24 (Days
  205, 209, 215, 223, 231, 236). All six are archived in `published/`.
- None of those six went through this repo's bash pipeline. See the flow
  decision below.
- `drafts/` is empty. The five July dailies that sat there (Days 190-194) were
  triaged and archived on 2026-08-19 as unpublishable by construction - see
  `drafts/archive/TRIAGE.md`. Their Paragraph drafts are still sitting
  unpublished on Paragraph; deleting them is Zaal's call.
- `drafts/` being empty no longer makes the health checks vacuous.
  `automation/test-all.sh` covers queued drafts, archived drafts and the
  published record, and treats an empty check set as a failure rather than a
  pass. `automation/status.sh` reports the queue and then compares what is live
  on Paragraph against `published/`, exiting non-zero when an edition shipped
  without landing here.

## How editions actually ship (decided 2026-08-25)

**The MCP flow is canonical. The bash pipeline in `automation/` is not the
posting path.**

CLAUDE.md asked for one flow to be picked. The record picks it:

- Not one of the six published editions has an entry in
  `automation/post-ids.json` from `create-draft.sh` - and that script records an
  id automatically on every push, so a bash push cannot happen silently.
- Not one of the six has a source file in `drafts/` or a content commit in this
  repo's history.
- `docs/case-study-day230.md` documents Day 231 being assembled end to end
  through the Paragraph MCP plus browser agent, down to the post id.

So: Day 231 is proven MCP. The other five are proven not-bash - they shipped
outside this repo and the exact surface was never recorded. Either way the bash
pipeline has not posted an edition since Day 194 in July.

What each part is for now:

| Part | Role |
|---|---|
| Paragraph MCP + `docs/mode-c-mcp-playbook.md` | how editions get built and published. Canonical. |
| `docs/craft-research.md`, `docs/voice-guide.md`, `templates/` | what an edition has to be |
| `automation/check-voice.sh`, `check-links.sh` | mechanical gates, runnable against any draft regardless of how it will ship |
| `published/` + `automation/post-ids.json` | the record of what went out |
| `automation/create-draft.sh`, `update-draft.sh`, `archive-issue.sh`, thumbnails | working fallback path. Tested, safe, unused since July. Keep it, do not assume it ran. |

The rest of the bash commands below are documented as that fallback, not as the
daily habit.

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

# Queue + drift: what's pushed, what's pending, and any edition that went live
# without landing in published/. Exits non-zero on drift.
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

# Full health check: voice on queued drafts, links everywhere, tracked post id
# on every published edition. Nothing to check counts as a failure.
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
| `drafts/` | Markdown work-in-progress, not yet published. Currently empty. `drafts/archive/` holds triaged dailies that will never ship, with reasons |
| `published/` | The record of editions that went live. Starts at Day 205 (2026-07-24), not the full 400+ back catalogue. See `published/README.md` for what these files are and are not |
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

## Workflow example (the bash fallback, not the current habit)

The canonical flow is the MCP one - see `docs/mode-c-mcp-playbook.md`, and
`docs/case-study-day230.md` for a worked edition. The sequence below is the
fallback path. It works and it is safe, but no edition has shipped through it
since Day 194 in July.

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
- Know which flow actually ships editions (MCP) and which one is the fallback (bash)
- Set up the environment (copy `.env.example`, add PARAGRAPH_API_KEY) for the fallback path
- Run any of the main commands without guessing
- Know where to find strategy docs and how to pick up the next feature
- Understand the voice rules so edits stay on-brand
- Read `published/` and know exactly what has gone out since Day 205

Known gaps, so nobody reads silence as health: `automation/check-links.sh` does
not scan `docs/`, and the 21 craft-research sources there are bare URLs it would
not match anyway, so nothing rot-checks them. `automation/check-voice.sh`
encodes the daily rules only and has no announcement mode. Both are open.

## The amalgam (2026-08-18)

This repo is now the single home for ZAO newsletter craft and operational
knowledge, not just the bash pipeline. Start at `docs/amalgam-map.md` - it maps
every newsletter-related system (this repo, the deployed zabalnewsletterbuilder,
the /newsletter skill, the ZAOOS research docs, the archives) and the next
builds in order.

- `docs/craft-research.md` - THE TWELVE craft rules + the announcement skeleton, from 21 fetched sources
- `docs/mode-c-mcp-playbook.md` - driving Paragraph through the MCP: image hosting, tweet embeds, the traps
- `docs/paragraph-node-catalogue.md` - every Tiptap node type observed across 6 strong live publications
- `docs/case-study-day230.md` - the Day 230 finals edition, assembled end-to-end via MCP, as the worked example
- `docs/voice-guide.md` - the running log of Zaal's line-level voice corrections
