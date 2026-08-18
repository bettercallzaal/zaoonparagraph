# Amalgam map - everything newsletter, and where it lives

Decision (Zaal, 2026-08-18): zaoonparagraph is the single home for ZAO newsletter
craft, tooling, and operational knowledge. Sibling systems stay where they run,
but this file is the map, and drift from it is a bug.

## In this repo

| What | Where |
|---|---|
| Draft pipeline (voice gate, create/update draft, archive, thumbnails, link check) | `automation/` - see README |
| Formats | `templates/` (daily-3, weekly-recap, deep-dive) |
| Craft rules - THE TWELVE + announcement skeleton, 21 fetched sources | `docs/craft-research.md` |
| MCP operating manual (Mode C) + Mode B traps | `docs/mode-c-mcp-playbook.md` |
| Tiptap node catalogue from 6 live publications | `docs/paragraph-node-catalogue.md` |
| Worked example: Day 230 finals edition | `docs/case-study-day230.md` |
| Voice corrections log (durable copy) | `docs/voice-guide.md` |
| Platform research (Jul 2026 era) | `research/` |

## Siblings that stay put

| System | Lives | Why it stays |
|---|---|---|
| zabalnewsletterbuilder (Next.js daily-3 digest generator) | own repo, deployed on Vercel | moving it breaks the deploy; the planned bridge is a webhook into `automation/create-draft.sh` (ZAOOS doc 1066, build 5 - still unbuilt) |
| /newsletter skill (live session instructions) | `~/.claude/skills/newsletter/` via zaal-dotfiles | skills must resolve from the dotfiles tree; it should cite these docs rather than duplicate them |
| Voice + fixed skeleton source of truth | `~/Documents/zabalgames/docs/newsletter-template.md` + 19 prior editions | deliberately not duplicated (the skill forbids restating it) |
| Live voice-corrections capture | `~/.zao/drafts/zaal-voice-guide.md` | captured at the terminal mid-session; fold into `docs/voice-guide.md` when corrections accumulate |
| ZAOOS research docs | ZAOOS `research/` | institutional memory stays in the lab; key numbers: 1066 (build-out plan), 2189 (brand-growth playbook), 1574 (ZOE integration), 1270 (canonical reference), 1348 (paid tiers), 429 (MCP/agents launch), 352 + 322 (x402 commerce), 355 (distribution), 1657 (Bonfire backfill) |

## Archives (do not build on these)

GitHub: zabalnewsletter (Jan 2026), newsletter-bot-1 + Newsletterbot1 (Jul 2026,
Discord bot approach, superseded), zabal-bot-archive.

## Next builds, in order

1. Wire `automation/check-voice.sh` into the /newsletter skill as the mechanical
   pre-Zaal gate (script exists, skill currently checks by hand).
2. post-ids.json as the session-to-draft handshake so no chat URL pasting.
3. Doc 1066 build 5: webhook bridge zabalnewsletterbuilder -> create-draft.sh.
4. subscribeButton/shareButton footer as a template partial.
