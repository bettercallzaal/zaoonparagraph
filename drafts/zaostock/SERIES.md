# ZAOstock series - one edition a day to 3 October

The editorial calendar for the ZAOstock run, from `~/zao-vault/projects/zaostock-17-day-plan-2026-09-16.md`
section 3, as re-briefed on 2026-09-19. One row per day. Every file here is a whole Day N edition:
`zm`, the day line, the ZAOstock item, the sign-off, the same shape Days 258 to 260 shipped in.

Rules for every row. Announcement voice. Zero Paragraph credits: markdown here, Zaal pastes, no
Paragraph AI, no Polish. Only facts on zaostock.com, fetched, with the fetch time in the file's
header comment. No set times. No stream platform named until a test passes. No Art of Ellsworth
year number until Zaal rules. Zaal publishes; this lane never does.

Day numbers are day of year from `edition-facts.sh` (2026-09-19 measured as 262), not from the plan,
which ran 1 low.

Status words: `shipped` (live on Paragraph, link in the row), `drafted` (in this folder, voice check
green), `hold` (written, gate not met), `blocked` (cannot be written yet, reason in the row),
`open` (nobody has written it).

Every `drafted` row was written on 2026-09-19 from a fetch that day. Each one names, in its header
comment, the page to re-fetch on the morning it goes out.

| Date | Day | Lead item | File | Source | Status |
|---|---|---|---|---|---|
| Tue 15 Sep | 258 | DCoop | - | https://paragraph.com/@thezao/year-of-the-zabal-day-258 | shipped |
| Wed 16 Sep | 259 | LyonsDen | - | https://paragraph.com/@thezao/year-of-the-zabal-day-259-1 | shipped |
| Thu 17 Sep | 260 | Tom Fellenz | - | https://paragraph.com/@thezao/year-of-the-zabal-day-260 | shipped |
| Fri 18 Sep | 261 | (Art of Ellsworth in the plan) | - | - | nothing shipped; not in the feed on 2026-09-19 |
| Sat 19 Sep | 262 | 2 weeks out: free, all ages, RSVP, the $20 and $50 tiers | `2026-09-19-day-262-two-weeks-out.md` | zaostock.com/tickets | drafted |
| Sun 20 Sep | 263 | ZAOville, the July chapter, and the series | `2026-09-20-day-263-zaoville.md` | zaostock.com/zaoville, /festivals | drafted; 2 names for Zaal to clear (see file header) |
| Mon 21 Sep | 264 | Artist slot: Michael Anderson | `2026-09-21-day-264-michael-anderson.md` | zaostock.com/artist/michael-anderson | drafted; page has bio and photo |
| Tue 22 Sep | 265 | Artist slot | `HOLD-grass-rug.md` | zaostock.com/artist/grass-rug | hold; bio on the page, no photo |
| Wed 23 Sep | 266 | The 10 partners, and the volunteer call | `2026-09-23-day-266-partners.md` | zaostock.com/partners, /volunteer | drafted |
| Thu 24 Sep | 267 | Artist slot | `HOLD-acadia-rising.md` | zaostock.com/artist/acadia-rising | hold; bio on the page, no photo |
| Fri 25 Sep | 268 | The stream | - | zaostock.com/live | blocked; /live says "Stream not live yet", and the platform is not named until a test passes. Day 273 covers how to watch without naming one |
| Sat 26 Sep | 269 | 1 week out: the running order, no set times | `2026-09-26-day-269-one-week-out.md` | zaostock.com/program | drafted |
| Sun 27 Sep | 270 | The last 3 acts: DCoop, LyonsDen, Tom Fellenz | `2026-09-27-day-270-headliners.md` | the 3 artist pages | drafted; "headliners" wording is Zaal's call (see file header) |
| Mon 28 Sep | 271 | Artist slot | - | zaostock.com/artist/the-crown-vics, /artist/open-x | blocked; both pages say "No bio yet." |
| Tue 29 Sep | 272 | The place: getting there, parking, what to pack | `2026-09-29-day-272-the-place.md` | zaostock.com/ellsworth | drafted |
| Wed 30 Sep | 273 | 3 ways to be there, in person or online | `2026-09-30-day-273-how-to-be-there.md` | zaostock.com/live | drafted |
| Thu 1 Oct | 274 | How Saturday runs | `2026-10-01-day-274-run-of-show.md` | zaostock.com/program | drafted |
| Fri 2 Oct | 275 | Tomorrow | `2026-10-02-day-275-tomorrow.md` | zaostock.com/, /program | drafted |
| Sat 3 Oct | 276 | Day of | - | - | open; written on the day, from what happens |
| Sun 4 Oct | 277 | Recap, with photos | - | - | open; written after |

## Artist slots

8 acts, 3 shipped. The gate is a page that carries a bio and a photo. Measured by `curl` on 2026-09-19:

| Act | Order | Bio | Photo | Edition |
|---|---|---|---|---|
| The Crown Vics | 1 | no ("No bio yet.") | no | not written |
| OPEN X | 2 | no ("No bio yet.") | no | not written |
| Grass Rug | 3 | yes | no (initials tile) | `HOLD-grass-rug.md` |
| Acadia Rising | 4 | yes | no (initials tile) | `HOLD-acadia-rising.md` |
| Michael Anderson | 5 | yes | yes | `2026-09-21-day-264-michael-anderson.md` |
| DCoop | 6 | yes | yes | shipped, Day 258 |
| LyonsDen | 7 | yes | yes | shipped, Day 259 |
| Tom Fellenz | 8 | yes | yes | shipped, Day 260 |

A `HOLD-` file has no date and no day number. When its page passes the gate it is renamed to
`<date>-day-<N>-<slug>.md`, N comes from `edition-facts.sh` that day, and it takes the next open
artist slot (22, 24 or 28 Sep). If the 2 remaining bios land after the 28th, those acts are covered
by name in Days 269, 274 and 275 either way.

## Open for Zaal

The Art of Ellsworth year. Days 258 to 260 went out saying "9th annual" and zaostock.com says the
same on /, /ellsworth and every artist page. These drafts say "part of Art of Ellsworth" with no
number. One word from Zaal puts it back or changes the site.

Day 258 still carries 1 Paragraph AI sentence (tracker card 9827). His edit, in the Paragraph editor.
