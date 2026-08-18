# Case study - Day 230: The Final Six (2026-08-18)

The first edition assembled end-to-end through the Paragraph MCP + browser agent,
and the worked example behind mode-c-mcp-playbook.md. Post id
`BwTXAFGr5HaZDddViaw0`, publication paragraph.com/@thezao.

## What the edition is

ZABAL Gamez Season 1 finals announcement. Announcement voice (sentence case,
numerals, real punctuation - not the lowercase daily voice). Skim spine: bold
hook with the season numbers, "The six" with one subsection per track, champions
mechanics in a callout, 15-name roll call, recordings CTA.

## The facts, and where each came from

| Fact | Source |
|---|---|
| 31 projects, 6 artist / 19 builder / 6 creator, 22 published | `zabalgamez.com/api/submissions?feed=projects` fetched that night |
| 15 entrants + exact handles | `zabalgamez.com/data/points-roster.json` |
| Day 230 | day-of-year arithmetic for Aug 18, 2026 - never a model's guess |
| The six + finals mechanics (WaveWarZ battles, mentors panel unnamed, 300 USDC 70/30 + 200 volume-weighted capped 80, last week of August, dates set by the six) | locked by Zaal in the lane handoff - never drifted |
| Per-finalist receipt lines | each finalist's own submission entries from the API |

The per-finalist enrichment is the repeatable move: pull every entry per handle
(titles, status, count, demo links) and compress REAL receipts into one or two
vivid lines each. n3m entered all three tracks; ghostmintops filed 7 entries, 6
published; ColorZAO had a live demo URL worth linking. None of that needed
invention - it was sitting in the API.

## Assembly sequence (the part worth copying)

1. Body restructure via `update-post` `bodyJson` - text first, always, so later
   image inserts are not clobbered by a full-body rewrite.
2. Three matchup cards attached to the Paragraph AI agent chat with exact
   placement instructions - which inserted them as ITS sandbox paths
   (`/mnt/workspace/uploads/...`), broken for email.
3. Fix: each image laundered through the cover uploader to get a real
   `papyrus_images` URL, real cover (the ZABAL Daily Designs day banner) uploaded
   last, srcs rewritten via MCP.
4. Callout, horizontalRules, links, customButton written directly as bodyJson
   nodes - shapes from paragraph-node-catalogue.md.
5. Two X posts embedded by the agent from bare status URLs: the finals
   announcement after the prize callout, the pinned season-origin post in the
   catch-up section.
6. Every step verified against a fresh `get-post` json, not the agent's word and
   not the chat panel.

## Failures hit, so the next run does not

- The agent's chat input silently swallowed a full message on focus loss - the
  screenshot-before-Return check caught it.
- `update-post` ignores a `json` param without erroring usefully - it is
  `bodyJson`, and `get-post` takes `id`.
- A research subagent drafting sample copy for this edition invented a Thursday
  start date and fake channel names. The locked-facts list existed precisely so
  none of that could leak in.

## Left on the table for future editions

subscribeButton + shareButton footer, figcaptions under the matchup cards, a
dedicated By-the-Numbers block, and Farcaster cast embeds once casts go out
first (the distribution-order rule: casts drive, the newsletter is the record).
