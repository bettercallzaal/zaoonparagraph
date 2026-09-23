# Year of the ZABAL - Day 266: what came in for bounty two

<!-- SUBTITLE (Paragraph field, not body):
     Bounty two closed at 5 pm Eastern yesterday. Here is what people made, and what bounty three asks for. -->

<!-- DRAFT v1, written 2026-09-22 afternoon for SEND ON Wed 23 Sep 2026, Zaal's tap.
     Shape set by Zaal on 2026-09-21: the newsletter reviews the submissions rather than announcing
     the bounty as a new thing. Day 265 was the exception, an announcement sent before the close to
     drive entries in, on his word at 10:4x on 2026-09-22.
     BUILD THE PASTE WITH `bash automation/make-agent-paste.sh <this file> --clip`. It refuses to
     print anything while a FILL or CHECK remains, so every slot below must be filled or cut first.
     MEASURED WHEN WRITTEN:
       2026-09-23 is day 266. Countdown: Oct 3 minus Sep 23 = 10. Recompute with `date` on the day.
       Bounty two: poidh.xyz/base/bounty/1410, contract id 424, Base, opened 2026-09-21 22:11:59 EDT,
         closes 5:00 pm Eastern Tue 22 Sep, pick named live on Twitch AT the close then a two-day
         contributor vote. All from the poidhz lane's API read at 22:12:52 EDT with a 404 control.
       Bounty two asks for video with audio most; the kit carries a 30-second spot and the
         2026-09-10 radio interview, 7 minutes 39 (ffprobe, Dotfiles lane).
       Bounty one: six claims, four before the 4 pm close and two after. Pick was claim 8086, a gig
         poster, submitted for the vote at 22:00:17 EDT 2026-09-21 (tx on Base, block 51626535).
         The four-and-two split is bounty ONE only, and it came from a clean chain read. Bounty
         two has no such split available, see below.
         THE VOTE RESOLVES WEDNESDAY 23 SEP 22:00:17 EDT, which is the evening this edition goes
         out. If it has resolved by send time, say so and say it paid; if not, say the vote runs
         until tonight. Ask the poidhz lane rather than assuming either.
     BOUNTY TWO AS MEASURED, poidhz lane, read 2026-09-22 19:33:46 EDT from poidh's /data endpoint:
       8 claims from 6 distinct wallets. Claim 8100 is a dead link superseded by 8107 from the same
       wallet, so the body says eight entries from six people and does not treat 8100 as a separate
       piece. NO PICK HAS BEEN NAMED and submitClaimForVote has NOT been sent; that is measured,
       not inferred from silence: 1410's deadline field is null where 1409's carries a real vote
       deadline. The bounty still reads OPEN because poidh has no on-chain close; the 5 pm close
       lives only in the description text.
       PER-CLAIM SUBMISSION TIMES ARE NOT MEASURED. Neither endpoint timestamps a claim, and the
       public RPC returned 403 on 15 of 18 log ranges, so the 14 logs the lane got are a floor and
       not a total. THEREFORE THIS EDITION SAYS NOTHING ABOUT WHO MADE THE CLOSE for bounty two.
       Say "eight entries came in", never "before the close", unless a clean chain read lands first.
     BOUNTY ONE, same read: the vote on claim 8086 is still running, deadline 1790215217 =
       2026-09-23 22:00:17 EDT. Its pot has GROWN during the vote, 0.004 ETH at cast to 0.0061 now,
       up 52 percent, so the poster wins more than was on the table when anyone entered. That is a
       true and quotable line IF Zaal clears a figure; rule 9 keeps pot figures out by default, so
       the percentage and the ETH both stay out unless he says otherwise.
       Do NOT print a matching figure for bounty two: no file records what it cast at, so its growth
       is UNRECORDED rather than zero.
     BOUNTY THREE DOES NOT EXIST at 19:33. 1411 is cast but belongs to another issuer
       ("Keep Kenjiquest Cooking!"), checked by issuer address rather than by the id existing, and
       1412 is not found. So the bounty three section is CUT unless Zaal casts one.
     PLATFORM MIX, for the socials and for Zaal rather than for the body: round one was 3 X and 3
       Farcaster, and BOTH late entries were Farcaster. Round two is 1 X only, 1 Farcaster only, 3
       both, 3 neither (two catbox.moe video files and one claim with no post link). Counted from
       the links each claim actually carries.
     THE ELIGIBILITY QUESTION, WHICH IS ZAAL'S AND IS NOT MADE. Three of the eight claims (8100,
       8107, 8111) are from @assay, which states in each one "Made by Assay, an autonomous AI
       agent", and also says "I have no X account, so the X tag is the one line of the bar I could
       not meet, said plainly". Bounty two's immutable text reads "THE BAR. Requirements, not
       preferences. Miss one and it is not entered", and rule 6 of that bar is the X tag. So by the
       bar as written, the two playable videos in the round are not entered, and the entrant
       declared it rather than hoping nobody checked. Two other entrants cross-posted specifically
       to meet that rule. ZAAL RULES: whether an autonomous agent is eligible at all, and whether
       an entrant who cannot meet a rule is judged anyway. Until he does, this edition describes
       what came in and does not call anything entered, eliminated or a contender.
     THE AFTER-PARTY END TIME, a correction to the poidhz lane's note and worth keeping. It said
       zaostock.com publishes no end time for Black Moon and that two entrants inventing "6 to 10"
       points at our copy. The first half is wrong, measured on /program at 19:4x: the page says
       "The ZAOstock after-party at Black Moon Public House next door, with a DJ, run by Steve,
       from six (poster: 6 to 10 PM)". So the entrants read it off our own page. The second half
       stands, and is stronger read properly: the homepage says only "from six", the
       program page hedges the 10 three ways (a parenthetical, attributed to "poster:", and
       followed by "Close. Approximate. Black Moon keeps its own hours"), and entrants are
       repeating it publicly as a flat fact. Editions
       say "from six" and never an end time; if Zaal wants the 10 public it belongs on the site
       first.
     NAMES: nobody is named unless Zaal says so in the Paragraph chat. He has not, through Day 265.
     STILL OUT: any pot figure; who added to the pot beyond Kenny; any licence claim about the kit
       (the CC-BY line in an entrant's claim is wrong and is not repeated); set times.
     Rule 10: he NAMES a pick, contributors vote to confirm. Never "won", "decided" or "paid" at the
       moment of the stream.
     Voice: announcement. -->

zm

year of the zabal day 266

10 days until ZAOstock. Bounty two closed at 5 pm Eastern yesterday, and this is what came in.

## What came in

Eight entries came in, from six people.

They run from a claim of 66 characters to one of 1,266. Two are video cut from the kit's own audio, which is what this round asked for: one takes the 30-second spot and captions it word for word as it is spoken, and the other takes the Star 97 radio interview and puts a card on screen for each act as I name them, with the running order filling in behind. One is a promo video for the festival. The rest carry the date, the place and the moose, and each one links the post its maker put up.

[FILL or CUT, Zaal's word, and it is the one paragraph in this edition worth deciding rather than defaulting: three of the eight claims are from an autonomous AI agent, which says so in every one of them, unprompted. It also says it has no X account and so could not meet one line of the bar, and it declared both things unprompted, in every claim, before anyone asked and before anyone checked. Whichever way the eligibility ruling goes, that conduct is the checkable fact worth carrying. Those three include both playable videos. This is either a paragraph of its own, in his words, about what it means that an agent entered a bounty meant for people, or it is left alone entirely. It is not something to mention in passing.]

## The pick

[FILL once Zaal has named a pick. As of 19:33 on the 22nd he had NOT: no claim is accepted and no vote is open on 1410. If he has still not picked by send time, this section is cut and the "What came in" section ends with a line saying the pick is coming, rather than implying one was made. Once he has: what he picked and why, in his words, describing the piece rather than the maker. Then the vote sentence: if submitClaimForVote has been sent, "That pick has gone to everyone who added to the pot, and they vote to confirm it before it pays out." If it has not, say he named a pick and the vote has not opened. Nobody has won or been paid at this point.]

## Round one is settled

[FILL or CHECK with the poidhz lane at send time: bounty one's vote was due to resolve tonight at 22:00 Eastern. If it has resolved, say the poster took it and that it has paid. If it has not, say the vote on the poster runs until tonight. Do not write either as measured without their read.]

## Bounty three

[FILL once Zaal has cast it: the ask in one or two sentences from the bounty's own text, the close time, and where the pick gets named. Then the line "Enter bounty three." linked to its poidh URL, with the full stop inside the link text. If it is not cast by send time, cut this section rather than promise it.]

Everything you need is in the [brand kit,](https://zaostock.com/brand) the moose by attabotty, the signage, illustrations, colours and type by Candy of CandyToyBox, and the audio. Please credit them when you use their work.

ZAOstock is a free music festival on Saturday, October 3, 2026, on the Franklin Street Parklet in downtown Ellsworth, Maine, from 12 to 6 pm Eastern. 8 acts on 1 stage, free for all ages. [See the running order.](https://zaostock.com/program) [RSVP for free.](https://ticket.zaostock.com)

- BetterCallZaal on behalf of the ZABAL Team
