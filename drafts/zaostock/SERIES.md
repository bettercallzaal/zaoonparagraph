# ZAOstock series - one edition a day to 3 October

**Countdown lines, after Day 263.** Day 263 shipped with an exact number, "13 days", in the
title, the first line and the cover artwork. That is true for one day only, and this run has
already slipped twice. Every remaining edition that carries a countdown gets the number
recomputed against `date` on the morning it goes out, in the same command that writes it, and
the cover art re-rendered if the number is in the image. A drafted countdown is never trusted.

**Link punctuation, after Day 263.** Put a sentence's closing period or comma INSIDE the link
text: `[RSVP for free.](url)`, not `[RSVP for free](url).` Paragraph's `/@thezao/<slug>` route
renders a visible space between a closing link and punctuation that follows it; the `/writing/`
route does not (measured 2026-09-20, headless browser). Punctuation inside the link renders flush
on both. Socials link the `/writing/<slug>` form. Zaal ruled both, 2026-09-20 23:43
(`zao-vault/decisions/grill-2026-09-20-seat-late.md`, item 3).

**Artist slots, all 8 placed.** Shipped: DCoop (258), LyonsDen (259), Tom Fellenz (260). Dated: Michael Anderson Mon 21 Sep, The Crown Vics Tue 22, OPEN X Thu 24, Acadia Rising Fri 25, Grass Rug Mon 28. The first 3 new slots follow the /program running order (seat, 2026-09-19); Acadia Rising went to Fri 25 on Zaal's ruling the same day, "this week Monday to Friday". Zaal can reorder.

The editorial calendar for the ZAOstock run, from `~/zao-vault/projects/zaostock-17-day-plan-2026-09-16.md`
section 3, as re-briefed on 2026-09-19. One row per day. Every file here is a whole Day N edition:
`zm`, the day line, the ZAOstock item, the sign-off, the same shape Days 258 to 260 shipped in.

Rules for every row. Announcement voice. Zero Paragraph credits: markdown here, Zaal pastes, no
Paragraph AI, no Polish. Only facts on zaostock.com, fetched, with the fetch time in the file's
header comment. No set times. No stream platform named until a test passes. No Art of Ellsworth
year number until Zaal rules. Zaal publishes; this lane never does.

**When /program and an artist page disagree on a genre, an edition does not pick a side.**
The artist pages read their Genre field from the database; /program and /artists read theirs from
code, so a correction reaches the two at different times, and either one can be the stale half.
Both directions were measured on 2026-09-19. Grass Rug: /program said "Indie jam rock" while
/artist/grass-rug still said "Jam rock band", the page behind because the SQL waits on a Supabase
login (ZAOstock #247). Tom Fellenz, earlier that day: /program said "Rock guitar and soundtrack"
while his page already said "Solo Instrumental Acoustic Guitar", so there the code was the stale
half; by 18:10 those two agreed.

So the instruction is: re-fetch both. If they agree, quote it. **If they differ, do not pick.**
Either use wording both surfaces share, which in practice means the artist's own bio (Day 271's
body does this, and it is why its subtitle can say "indie jam rock": his bio reads "indie jam-rock
sound" on both surfaces), or leave the genre out of that edition. Then tell the seat the same hour
so the zaostock lane reconciles the two. An edition never settles a disagreement the site has not
settled, and picking the surface that looks more current is settling it.

Day numbers are day of year from `edition-facts.sh` (2026-09-19 measured as 262), not from the plan,
which ran 1 low.

Status words: `shipped` (live on Paragraph, link in the row), `drafted` (in this folder, voice check
green), `text ready` (written, bio live, no photo yet, photo line left out), `blocked` (cannot be written yet, reason in the row),
`skeleton` (written with every fixed fact in and labelled blanks only the day can fill), `open` (nobody has written it).

Every `drafted` row was written on 2026-09-19 from a fetch that day. Each one names, in its header
comment, the page to re-fetch on the morning it goes out.

| Date | Day | Lead item | File | Source | Status |
|---|---|---|---|---|---|
| Tue 15 Sep | 258 | DCoop | - | https://paragraph.com/@thezao/year-of-the-zabal-day-258 | shipped |
| Wed 16 Sep | 259 | LyonsDen | - | https://paragraph.com/@thezao/year-of-the-zabal-day-259-1 | shipped |
| Thu 17 Sep | 260 | Tom Fellenz | - | https://paragraph.com/@thezao/year-of-the-zabal-day-260 | shipped |
| Fri 18 Sep | 261 | (Art of Ellsworth in the plan) | - | - | nothing shipped; not in the feed on 2026-09-19 |
| Sat 19 Sep | 262 | 2 weeks out, get prepared | `2026-09-19-day-262-two-weeks-out.md` | zaostock.com/tickets, /design, /ellsworth, /acadia, /apply, /sponsor, /live | never shipped. Slipped past its window twice, and its "2 weeks out" framing expired. Superseded by Day 263. Keep the file or cut it, Zaal's call |
| RESERVE | - | ZAOville, the July chapter, and the series | `2026-09-20-day-263-zaoville.md` | zaostock.com/zaoville, /festivals | held. Not cut. Its day number 263 is now taken, so the filename needs renaming to whatever day it runs. Fills the first artist day whose photo does not land (22, 24, 25 or 28 Sep). Its own "13 days" line needs re-checking on that day. **Day 263 as published already carries the 4-chapter series history, so this edition needs a new angle rather than a repeat** |
| Sun 20 Sep | 263 | What ZAOstock is, the running order, and the get-ready list | `published/2026-09-20-day-263.md` | https://paragraph.com/@thezao/year-of-the-zabal-day-263-13-days-until-zaostock | shipped 2026-09-20 23:12 EDT, post id `sEEVjfXTNIFU6qKZuqsN`. Rewritten in the Paragraph editor before sending; what changed is in `published/README.md` under "Day 263 note". Also published as an X Article 2026-09-20 23:32 EDT, https://x.com/i/status/2101877250132193503 (Paragraph content id `8154b460-065c-4e84-b534-2e40c22db3c9`, canonical URL set to the Paragraph post) |
| Mon 21 Sep | 264 | Artist slot: Michael Anderson | `2026-09-21-day-264-michael-anderson.md` | zaostock.com/artist/michael-anderson | drafted; page has bio and photo |
| Tue 22 Sep | 265 | Artist slot: The Crown Vics | `2026-09-22-day-265-the-crown-vics.md` | zaostock.com/artist/the-crown-vics | text ready; bio live, no photo on the page 2026-09-19, so the photo line is out. Re-fetch that morning |
| Wed 23 Sep | 266 | The 10 partners, and the volunteer call | `2026-09-23-day-266-partners.md` | zaostock.com/partners, /volunteer | drafted |
| Thu 24 Sep | 267 | Artist slot: OPEN X | `2026-09-24-day-267-open-x.md` | zaostock.com/artist/open-x | text ready; bio live, no photo on the page 2026-09-19, so the photo line is out. Re-fetch that morning |
| Fri 25 Sep | 268 | Artist slot: Acadia Rising | `2026-09-25-day-268-acadia-rising.md` | zaostock.com/artist/acadia-rising | text ready; dated on Zaal's ruling 2026-09-19 (the week of 21 to 25 Sep). Bio live, no photo on the page 2026-09-19; Zaal is asking Sen for it Sun 20 Sep: re-fetch that morning. The stream edition planned for this day stays blocked; Day 273 covers how to watch |
| Sat 26 Sep | 269 | 1 week out: the running order, no set times | `2026-09-26-day-269-one-week-out.md` | zaostock.com/program | drafted |
| Sun 27 Sep | 270 | The last 3 acts: DCoop, LyonsDen, Tom Fellenz | `2026-09-27-day-270-headliners.md` | the 3 artist pages | drafted; "headliners" wording is Zaal's call (see file header) |
| Mon 28 Sep | 271 | Artist slot: Grass Rug | `2026-09-28-day-271-grass-rug.md` | zaostock.com/artist/grass-rug | text ready; bio live, no photo on the page 2026-09-19, so the photo line is out. Photo due 20 Sep per the zaostock lane: re-fetch that morning |
| Tue 29 Sep | 272 | The place: getting there, parking, what to pack | `2026-09-29-day-272-the-place.md` | zaostock.com/ellsworth | drafted |
| Wed 30 Sep | 273 | 3 ways to be there, in person or online | `2026-09-30-day-273-how-to-be-there.md` | zaostock.com/live | drafted |
| Thu 1 Oct | 274 | How Saturday runs | `2026-10-01-day-274-run-of-show.md` | zaostock.com/program | drafted |
| Fri 2 Oct | 275 | Tomorrow | `2026-10-02-day-275-tomorrow.md` | zaostock.com/, /program | drafted |
| Sat 3 Oct | 276 | Day of | `2026-10-03-day-276-day-of.SKELETON.md` | the day itself | skeleton; fixed facts in, every [FILL] is a thing only the day answers |
| Sun 4 Oct | 277 | Recap, with photos | `2026-10-04-day-277-recap.SKELETON.md` | the day itself, the images lane | skeleton; same shape, plus the local-business measurement the site promises |

## Artist slots

8 acts, 3 shipped. The gate is a page that carries a bio and a photo. Measured by `curl` on 2026-09-19, 10:05 EDT:

| Act | Order | Bio | Photo | Edition |
|---|---|---|---|---|
| The Crown Vics | 1 | yes (live 2026-09-19) | no (initials tile) | `2026-09-22-day-265-the-crown-vics.md`, Tue 22 Sep |
| OPEN X | 2 | yes (live 2026-09-19) | no (initials tile) | `2026-09-24-day-267-open-x.md`, Thu 24 Sep |
| Grass Rug | 3 | yes | no (initials tile) | `2026-09-28-day-271-grass-rug.md`, Mon 28 Sep |
| Acadia Rising | 4 | yes | no (initials tile) | `2026-09-25-day-268-acadia-rising.md`, Fri 25 Sep |
| Michael Anderson | 5 | yes | yes | `2026-09-21-day-264-michael-anderson.md` |
| DCoop | 6 | yes | yes | shipped, Day 258 |
| LyonsDen | 7 | yes | yes | shipped, Day 259 |
| Tom Fellenz | 8 | yes | yes | shipped, Day 260 |

The seat ruled on 2026-09-19 that an act goes out from its bio once the bio is live. The old closing line, "confirmed in writing and sent a bio and a photo", is out of every unpublished edition and does not come back when a photo lands: zaostock.com/press says no act has countersigned, so the claim is not one we can make. Days 258 to 260 stay as shipped. Michael Anderson's edition says "The lineup is public" instead; the 4 no-photo artist editions simply end without the line. Re-fetch each artist page on the morning it goes out. All 8 acts are also covered by name in Days 269, 274 and 275.

## Open for Zaal

The Art of Ellsworth year. Days 258 to 260 went out saying "9th annual" and zaostock.com says the
same on /, /ellsworth and every artist page. These drafts say "part of Art of Ellsworth" with no
number. One word from Zaal puts it back or changes the site.

Day 258 still carries 1 Paragraph AI sentence (tracker card 9827). His edit, in the Paragraph editor.
