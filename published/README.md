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
fixed body. **The two URLs for this post render it differently.** Measured in a headless browser
(`document.body.innerText`) at 23:4x EDT, with a cache-buster:
`paragraph.com/@thezao/writing/<slug>` reads "RSVP for free.", flush, while
`paragraph.com/@thezao/<slug>` reads "RSVP for free .", with a visible space before the mark,
on all 8 links. Same post, same content; the second route's server render puts a whitespace
run between `</a>` and the punctuation, and the `.md` export copies it. This is a Paragraph
rendering defect, not something the copy can fix, short of putting the punctuation back inside
the link. The file here follows the flush reading. Link to the `/writing/` form in socials.

**Ruled 2026-09-20 23:43 EDT by Zaal, both** (`zao-vault/decisions/grill-2026-09-20-seat-late.md`,
item 3): move the punctuation back inside each of the 8 links in the post copy, so both routes
render with no space, and link the `/writing/` route in socials. The in-editor change is a
publish action and is Zaal's hand. Until he makes it, this file records the post as it stands.
When he does, re-pull the body (cache-busted) and replace this file. The same edition went out as an X Article at 23:32 EDT,
https://x.com/i/status/2101877250132193503, with section headings added and its canonical URL
pointed at the Paragraph post. The first X Article this publication has sent.

## Backfill note (2026-10-22)

Days 285, 291, 292 and 294 shipped with no record here (`zao-newsletter-published-check`
read 4 editions behind on 2026-10-22). Recovered the same way as the earlier backfills, by the
board-burn lane for card 10490: the body from `paragraph.com/@thezao/<slug>.md`, the post id
and publish time from `public.api.paragraph.com/api/v1/publications/DB7iU1HMVzTT9bI4ec6X/posts/slug/<slug>`.
Both routes were checked against Day 236 first: same post id as this table, same body line for
line. Day 291 went out at 20:07 ET on 18 Oct, so Paragraph's page shows 19 Oct (UTC). Days 276
to 284 and 286 to 290 are not in this folder either; they are not in the year-of-the-zabal
series the check reads, or were never published, and this note does not claim which.

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
| `2026-10-12-day-285.md` | 2026-10-12 | 285 | Year of the ZABAL - Day 285 | `q6topo228P3u2qMZ4eQz` |
| `2026-10-18-day-291.md` | 2026-10-18 | 291 | Year of the ZABAL - Day 291 | `ctHGfHAI5T0bMIPVNPJP` |
| `2026-10-19-day-292.md` | 2026-10-19 | 292 | Year of the ZABAL - Day 292 | `exbjQ7w53pSHvIh8ZXws` |
| `2026-10-21-day-294.md` | 2026-10-21 | 294 | Year of the ZABAL - Day 294 | `dxmyiD4ddmGQCiRCLKBN` |
| `2026-10-26-day-299.md` | 2026-10-26 | 299 | Year of the ZABAL - Day 299 | `roh5NGCEzKZ3P7lZrBcp` |
| `2026-10-27-day-300.md` | 2026-10-27 | 300 | Year of the ZABAL - Day 300 | `IKqb5K5rrF8wyKRL7sgF` |
| `2026-10-28-day-301.md` | 2026-10-28 | 301 | Year of the ZABAL - Day 301 | `taHZgG3or6T0hg8Kvo2x` |
| `2026-10-29-day-302.md` | 2026-10-29 | 302 | Year of the ZABAL - Day 302 | `bMEwOOhvPdiRrxDNHJ9b` |
| `2026-10-30-day-303.md` | 2026-10-30 | 303 | Year of the ZABAL - Day 303 | `Cc9VxTLyCifiWFU7yxah` |
| `2026-10-31-day-304.md` | 2026-10-31 | 304 | Year of the ZABAL - Day 304 | `O92qHVhCVfCD92qSeM2I` |

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
| 271 | On Saturday we told the story of ZAO Festivals out loud, on a space hosted by Thy Revolution. 4 events, 3 cities before this one, and what we are bringing to Ellsworth. | https://paragraph.com/@thezao/year-of-the-zabal-day-271 |
| 272 | Monday in review: Zaal and Tom Fellenz on Beyond the NFT, the set times are up, and 4 days to go. | https://paragraph.com/@thezao/year-of-the-zabal-day-272 |
| 273 | One thing to do today: tap Going on the ZAOstock Facebook event and invite 3 people. Plus Tuesday in review, and 3 ways to be there. | https://paragraph.com/@thezao/year-of-the-zabal-day-273 |
| 274 | Live on Star 97.7 this morning, the round 8 bounty is open, and ZAOstock is two days out. | https://paragraph.com/@thezao/year-of-the-zabal-day-274 |
| 275 | ZAOstock is today, and you don't have to be in Maine. Host a watch party, even for one hour, and tell us which. | https://paragraph.com/@thezao/year-of-the-zabal-day-275 |
| 285 | Two fractal groups tonight, 11 people. A second session runs Tuesday at noon Eastern. | https://paragraph.com/@thezao/year-of-the-zabal-day-285 |
| 291 | Fractal 120 is tomorrow, Monday, October 19, at 6 PM Eastern in The ZAO Discord. Free, and first-timers are welcome. | https://paragraph.com/@thezao/year-of-the-zabal-day-291 |
| 292 | This week in The ZAO: Fractal 120 tonight at 6 PM Eastern, and a WaveWarZ battle Sunday at 8 PM Eastern. | https://paragraph.com/@thezao/year-of-the-zabal-day-292 |
| 294 | Three artists made something for me, and it all dropped on WaveZStation on Tuesday. | https://paragraph.com/@thezao/year-of-the-zabal-day-294 |
| 299 | Fractal 121 is live tonight at 6 PM Eastern. And WaveWarZ just passed 1,000 SOL traded. | https://paragraph.com/@thezao/year-of-the-zabal-day-299 |
| 300 | Four new songs went up on WaveZStation this week. Back any of them for whatever you want, from $1. | https://paragraph.com/@thezao/year-of-the-zabal-day-300 |
| 301 | Builders day. My agents restarted twice before sunrise and a check I built got blocked. | https://paragraph.com/@thezao/year-of-the-zabal-day-301 |
| 302 | Artist day. Meet Legit, whose Clearer Picture went up on WaveZStation last week. | https://paragraph.com/@thezao/year-of-the-zabal-day-302 |
| 303 | Today at 6 pm ET on BCZ Yapz: meet Gigi, who judges WaveWarZ battles and matches songs to art. | https://paragraph.com/@thezao/year-of-the-zabal-day-303 |
| 304 | Gigi is not from the crypto space and she is not a musician. Here is how she ended up judging WaveWarZ battles. | https://paragraph.com/@thezao/year-of-the-zabal-day-304 |

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
