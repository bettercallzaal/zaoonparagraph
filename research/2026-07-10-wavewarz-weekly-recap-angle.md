# A new Paragraph angle - WaveWarZ weekly recap

Date: 2026-07-10 (loop pass 3, following the COC Concertz brief and the formatting/tooling cleanup)
Scope: checked the pieces of the ZAO ecosystem named in the original ask but not yet looked at - WaveWarZ, ZOE, SANG, ZOLs - for a genuinely new Paragraph fit.

## What's real vs. thin, checked today

**WaveWarZ - real and live, checked directly.** `wavewarz.info/leaderboards/artists` shows actual live competitive data, not placeholder: artist "Lui" ranked #1 at 4W-0L (100% win rate), 30.0261 SOL (~$2,367.56) earned; "STILOWORLD" at 3W-1L (75%); "Geek Myth" at 3W-0L (100%); 49 artists ranked total, down to "Steve Strange" at 0W-1L. Five live leaderboard categories exist: Artist Rankings, Song Charts, Community Rankings, Trader Rankings, Clipper Rankings. Real cadence: Quick Battles run nightly around 8:30pm EST, Community AMAs run weekday mornings around 11am EST on X Spaces and YouTube. ~1,125 all-time battles, ~491 SOL (~$33k) cumulative volume, 112 artist signups as of late June. Source: live site read plus ZAOOS doc 974 (financials snapshot, 2026-07-06).

**No recurring written recap exists for any of this.** The Airtable "Improvements" table (87 rows) is entirely "Not Started," and sponsorship/revenue tracking tables are built but empty. There's a single point-in-time financials snapshot, not an ongoing series.

**ZOE - producing real research, but its pipeline is broken, not a Paragraph fit today.** ZOE generates real numbered research docs continuously, but per ZAOOS's own estate audit (`research/estate/README.md`), "failed tasks produce nothing; proactive Telegram research never committed" - flagged as a high-priority internal problem (doc 1006). Its output sits in unmerged PRs (doc 990 = PR #1143, open 3+ days as of today) rather than anywhere reader-facing. Worth revisiting once that pipeline is actually fixed - broken infrastructure isn't a content opportunity yet.

**SANG (SongJam's token) and ZOLs (ZAO's contribution credits) - real systems, no content cadence.** Both exist and are tracked (SANG in identity/security docs around wallet policy, ZOLs in a single Q1 2026 recap naming real top earners like GodFactor and wildermax), but neither has an ongoing written series. Thin material to build a recurring newsletter segment on right now.

## The new idea

WaveWarZ already has exactly what COC Concertz didn't: a **daily-to-weekly cadence of real, numbers-rich competitive activity** (nightly battles, real SOL volumes, real win/loss records, real named artists) with zero long-form written recap anywhere. This is a distinct opportunity from the COC Concertz idea in the prior brief - COC Concertz has occasional shows (4 total), WaveWarZ has nightly events and live leaderboards, which is a much closer cadence match to a newsletter.

**Concrete shape:** a weekly "WaveWarZ standings" segment, using the `templates/weekly-recap.md` format already built today, sourced directly from `wavewarz.info/leaderboards/*` - top artist by wins, biggest volume swing, a real name and record every time (exactly the "credit a person by name" and "one real number" rules the daily-3 voice already enforces). This could run as its own recurring slot inside the existing @thezao newsletter (no new publication needed, unlike the COC Concertz idea), or as a distinct WaveWarZ-branded publication if the volume of material justifies a dedicated one later.

**Why this is lower-friction than the COC Concertz idea:** no cross-project buy-in question - WaveWarZ leaderboard data is already public on `wavewarz.info`, reading it and writing a recap doesn't require anyone's permission the way posting COC Concertz show content on a new publication would. It's purely an editorial/formatting decision Zaal can make alone.

## What's not yet confirmed

Whether WaveWarZ exposes this leaderboard data via an API (checked only the public web pages, not for a documented API) - if it does, `collect-wins.sh`'s pattern could extend to pull real standings automatically instead of reading the leaderboard pages by hand each week.

## Sources

- `wavewarz.info/leaderboards` and `wavewarz.info/leaderboards/artists` - read live, 2026-07-10
- ZAOOS repo: doc 974 (WaveWarZ financials snapshot, 2026-07-06)
- ZAOOS repo: `research/estate/README.md` (ZOE pipeline audit)
- ZAOOS repo: doc 1006 (ZOE pipeline issues, high priority)
- ZAOOS repo: doc 079 (SongJam/SANG research)
- ZAOOS repo: doc 241 (Q1 2026 ZOLs recap)
