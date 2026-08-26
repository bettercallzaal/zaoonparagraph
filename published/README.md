# published/ - the record of what actually went out

Every file in this folder is an edition that is live on paragraph.com/@thezao.
Drafts live in `drafts/`. Nothing gets moved here until it is published for real.

## What these files are, and are not

Each file is the published body, recovered from Paragraph's own markdown
rendering of the live post (`paragraph.com/@thezao/<slug>.md`). That means:

- The prose is exactly what readers got.
- The H1 is the published title. The subtitle, cover image, post id and URL are
  metadata and live in the table below, not in the file.
- Rich nodes flatten. Callouts, buttons, embedded X posts and image placement do
  not survive the markdown rendering. For an edition that used them heavily
  (Day 231, Day 236) the file is a faithful text record, not a byte-for-byte
  reproduction of the page. The live URL is the canonical artifact.

## Backfill note (2026-08-25)

This folder was empty until 2026-08-25 even though the newsletter kept shipping.
Six editions published between 2026-07-24 and 2026-08-24 had no record in this
repo at all. They were recovered from the public API and backfilled in one pass.

This is not the full archive. The ZAO newsletter has 400+ editions going back to
2023 and this folder starts at Day 205. Everything before that lives on
Paragraph only.

## The record

| File | Published | Day | Title | Post id |
|---|---|---|---|---|
| `2026-07-24-day-205.md` | 2026-07-24 | 205 | Year of the ZABAL - Day 205 | `fzPIlxhCjF3Gpoa5E5WE` |
| `2026-07-29-day-209.md` | 2026-07-29 | 209 | Year of the Zabal - Day 209 | `iQympmktOft8bVigxIBk` |
| `2026-08-03-day-215.md` | 2026-08-03 | 215 | Year of the ZABAL - Day 215 | `weFVv5HmTTqVHQw4s0jI` |
| `2026-08-11-day-223.md` | 2026-08-11 | 223 | Year of the ZABAL - Day 223 | `urznjA8ACkK2demLMjt8` |
| `2026-08-19-day-231.md` | 2026-08-19 | 231 | Year of the ZABAL - Day 231: The Final Six | `BwTXAFGr5HaZDddViaw0` |
| `2026-08-24-day-236.md` | 2026-08-24 | 236 | Year of the ZABAL - Day 236 | `9MVuDTbIjZ38EC63VZbw` |

Subtitles, cover images and live URLs:

| Day | Subtitle as published | Live URL |
|---|---|---|
| 205 | camden yards and zaoville tomorrow | https://paragraph.com/@thezao/year-of-the-zabal-day-205 |
| 209 | a second fractal run led by new facilitator iman | https://paragraph.com/@thezao/year-of-the-zabal-day-209 |
| 215 | monday morning update on the weekend streams covering the august finals for the zabal gamez | https://paragraph.com/@thezao/year-of-the-zabal-day-215 |
| 223 | The board closes Sunday, August 16. There is no vote - six finalists get picked, two per track. | https://paragraph.com/@thezao/year-of-the-zabal-day-223 |
| 231 | ZABAL Gamez Season 1 comes down to 6 names in 3 tracks. Battles on WaveWarZ. Finals run the last week of August. | https://paragraph.com/@thezao/year-of-the-zabal-day-231-the-final-six-1 |
| 236 | Season 1 ends this week. Three battles, six finalists, 500 USDC, and the artist final is tonight. | https://paragraph.com/@thezao/year-of-the-zabal-day-236 |

Post ids are also in `automation/post-ids.json`, keyed by the file path here.

## Two voices in this folder, on purpose

Days 205, 209 and 215 are dailies: all lowercase, sparse punctuation, opening
`zm`, one signoff. Days 223, 231 and 236 are announcement editions: sentence
case, real commas, headings, numerals. `automation/check-voice.sh` encodes the
daily rules only, so it fails the announcement editions by design rather than by
accident. See `docs/craft-research.md` for the split.

## Drifts worth knowing

- All six editions open `zm`, with no full stop. The rule in README.md and
  CLAUDE.md says every issue opens with `zm.` and the archived July drafts in
  `drafts/archive/` all use `zm.`. Checked against the live page for Day 205,
  not just the markdown rendering: the period is genuinely not there. So either
  the rule needs to lose the period or the copy needs to regain it. That is
  Zaal's call, and until it is made `check-voice.sh` fails all six on the
  opener.

- Day 209 published as "Year of the Zabal", lowercase `abal`, against the brand
  glossary. Left as published, because this folder is a record.
- `docs/case-study-day230.md` calls the finals edition Day 230 and dates it
  2026-08-18. It published 2026-08-19 as Day 231, post id
  `BwTXAFGr5HaZDddViaw0`. Same edition, and the post id in the doc is correct.
