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

## Backfill note (2026-09-19)

Five more editions shipped with no record here: Days 246, 250, 258, 259 and 260. Recovered on
2026-09-19 the same way as the first six: the body from `paragraph.com/@thezao/<slug>.md`, the
post id, subtitle and publish time from `public.api.paragraph.com/api/v1/publications/<pub>/posts/slug/<slug>`.
The route was checked against a known answer first: Day 236 came back with the post id already
in this table. Dates in the table are the publish date in Eastern time; Paragraph's own page
shows the UTC date, which is a day later for anything sent after 8 PM (Days 246, 259, 260).

Day 259's slug ends in `-1`. Days 258 to 260 say "9th annual Art of Ellsworth"; left as
published, because this folder is a record.

## Day 263 note (2026-09-20)

Days 261 and 262 did not ship. Day 262 was drafted twice and slipped past its window both
nights, so the fallback edition `drafts/zaostock/IF-SLIPPED-day-263-get-prepared.md` went out
instead, on 2026-09-20 at 23:12 EDT. Paragraph's own page dates it September 21 because it
renders in UTC; the date in the table above is Eastern, as it is for every other row.

**The body that went out is a substantial rewrite of that draft, made in the Paragraph editor.**
It is not a line edit. What changed, and what the next editions should carry forward:

- The countdown became an exact number, "13 days", in the title and the first line. The draft
  deliberately said "under 2 weeks" so a further slip could not make it false. Zaal took the
  number. An exact number is true for one day only.
- A cold-reader opener was added, "If you have never heard of ZAOstock, here is what it is."
- A whole new paragraph of series history: 4th ZAO Festivals chapter, New York April 2024,
  Miami December 2024 during Art Basel, Laurel Maryland July 2026, Maine now, all free.
  Not in the draft. Verified against zaostock.com/festivals on 2026-09-20 23:1x: that page
  says "The chapters Four so far", names "Miami, Wynwood, during Art Basel", and says
  "Free to attend".
- The running order moved up, from second to last to the third paragraph.
- Bare domains in prose became inline links on phrases ("RSVP for free.", "design kit",
  "running order schedule."). The draft used naked domains. Follow the published form.
- The steps were numbered in words: First, Second, Third, Fourth, Fifth.
- Two facts were added that the draft did not carry, both checked after publication and both
  correct: the Supporter tier has 50 spots (zaostock.com/tickets, "$20 50 spots Supporter")
  and support is non-refundable (zaostock.com/terms, "Ticket purchases are non-refundable").
- Numerals became words in two places: "one stage", "one-to-one", "covering one artist's travel".
- Cut: "Pack layers and something for rain", the supporter credit line, the Island Explorer,
  and the closing "See you on Franklin Street."

After sending, 8 links in the live post had their trailing punctuation inside the link text
(`[RSVP for free.]` and seven more). Fixed in the editor at 23:2x EDT; the file here is the
fixed body. The same edition went out as an X Article at 23:32 EDT,
https://x.com/i/status/2101877250132193503, with section headings added and its canonical URL
pointed at the Paragraph post. The first X Article this publication has sent.

## The record

| File | Published | Day | Title | Post id |
|---|---|---|---|---|
| `2026-07-24-day-205.md` | 2026-07-24 | 205 | Year of the ZABAL - Day 205 | `fzPIlxhCjF3Gpoa5E5WE` |
| `2026-07-29-day-209.md` | 2026-07-29 | 209 | Year of the Zabal - Day 209 | `iQympmktOft8bVigxIBk` |
| `2026-08-03-day-215.md` | 2026-08-03 | 215 | Year of the ZABAL - Day 215 | `weFVv5HmTTqVHQw4s0jI` |
| `2026-08-11-day-223.md` | 2026-08-11 | 223 | Year of the ZABAL - Day 223 | `urznjA8ACkK2demLMjt8` |
| `2026-08-19-day-231.md` | 2026-08-19 | 231 | Year of the ZABAL - Day 231: The Final Six | `BwTXAFGr5HaZDddViaw0` |
| `2026-08-24-day-236.md` | 2026-08-24 | 236 | Year of the ZABAL - Day 236 | `9MVuDTbIjZ38EC63VZbw` |
| `2026-09-03-day-246.md` | 2026-09-03 | 246 | Year of the ZABAL - Day 246 | `Sa7O9dFpMQlanY47bipg` |
| `2026-09-08-day-250.md` | 2026-09-08 | 250 | Year of the ZABAL - Day 250 | `L4MRZvyn24Ab9YYBp5ws` |
| `2026-09-15-day-258.md` | 2026-09-15 | 258 | Year of the ZABAL - Day 258 | `iLdRuGx9eFYfFJViNyfV` |
| `2026-09-16-day-259.md` | 2026-09-16 | 259 | Year of the ZABAL - Day 259 | `5r1z6VkqvtK9Fz4saC00` |
| `2026-09-17-day-260.md` | 2026-09-17 | 260 | Year of the ZABAL - Day 260 | `xhbNYMu1HV3h4q0MB1g3` |
| `2026-09-20-day-263.md` | 2026-09-20 | 263 | Year of the ZABAL - Day 263: 13 days until ZAOstock | `sEEVjfXTNIFU6qKZuqsN` |

Subtitles, cover images and live URLs:

| Day | Subtitle as published | Live URL |
|---|---|---|
| 205 | camden yards and zaoville tomorrow | https://paragraph.com/@thezao/year-of-the-zabal-day-205 |
| 209 | a second fractal run led by new facilitator iman | https://paragraph.com/@thezao/year-of-the-zabal-day-209 |
| 215 | monday morning update on the weekend streams covering the august finals for the zabal gamez | https://paragraph.com/@thezao/year-of-the-zabal-day-215 |
| 223 | The board closes Sunday, August 16. There is no vote - six finalists get picked, two per track. | https://paragraph.com/@thezao/year-of-the-zabal-day-223 |
| 231 | ZABAL Gamez Season 1 comes down to 6 names in 3 tracks. Battles on WaveWarZ. Finals run the last week of August. | https://paragraph.com/@thezao/year-of-the-zabal-day-231-the-final-six-1 |
| 236 | Season 1 ends this week. Three battles, six finalists, 500 USDC, and the artist final is tonight. | https://paragraph.com/@thezao/year-of-the-zabal-day-236 |
| 246 | headed to nyc and counting down 30 days to zaostock in maine | https://paragraph.com/@thezao/year-of-the-zabal-day-246 |
| 250 | I went to New York with no plan at all. Here is what that bought me, and what it cost. | https://paragraph.com/@thezao/year-of-the-zabal-day-250 |
| 258 | DCoop is playing at ZAOstock | https://paragraph.com/@thezao/year-of-the-zabal-day-258 |
| 259 | LyonsDen is playing ZAOstock | https://paragraph.com/@thezao/year-of-the-zabal-day-259-1 |
| 260 | Tom Fellenz is playing ZAOstock | https://paragraph.com/@thezao/year-of-the-zabal-day-260 |
| 263 | What ZAOstock is, the running order, and how to get ready for October 3 in Maine | https://paragraph.com/@thezao/year-of-the-zabal-day-263-13-days-until-zaostock |

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
