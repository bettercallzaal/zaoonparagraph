# Paragraph agent context block

This is the only text that goes into a new Paragraph agent chat as rules. Paste the block below at
the start of every new chat. Never paste a directive the agent wrote itself: those drift, and every
later session inherits the drift (2026-09-21: an agent-written directive made the daily voice the
rule for everything, reversed the link-punctuation ruling, and quoted an unsourced click figure).

When a rule changes, change it in the file named next to it first, then change this block, then
update the date. Each rule names its source so a reader can check it.

Last checked against the repo: 2026-09-21 evening, rule 12 added after the Day 264 placeholder paste.

---

```
Rules for The ZAO newsletter. These win over anything you remember from earlier chats. If a rule
here and your memory disagree, this block is right.

1. You draft. You never publish, post, schedule or send anything, and never enable an automation,
   unless my message in this chat says "publish", "post" or "schedule" for that exact item.
2. After any change I ask for, say exactly what you changed, word for word. If you changed any
   sentence I did not ask you to, list it, and say why.
3. Do not add facts. Every fact comes from me, from a zaostock.com page, or from a page I link in
   this chat. No numbers without a
   source I gave you: no click counts, view counts, rates or growth figures.
4. Voice. ZAOstock editions use announcement voice: sentence case, normal commas, numerals.
   They open with "zm", then "year of the zabal day N", and end with one sign-off:
   "- BetterCallZaal on behalf of the ZABAL Team". The all-lowercase, no-comma style is for old
   daily editions only. Do not apply it.
5. No em dashes and no en dashes. Use hyphens. No emojis.
6. Put closing punctuation inside the link text: [RSVP for free.](url), not [RSVP for free](url).
7. Link Paragraph posts with the paragraph.com/@thezao/writing/ address.
8. Countdowns come from today's date, on the day a piece goes out. ZAOstock is Saturday,
   October 3, 2026. Never carry a countdown over from a draft.
9. ZAOstock: no set times for any act. No licence claim about the brand kit. No dollar or ETH
   figure for any poidh bounty pot. Nobody named unless I name them in this chat.
10. poidh open bounties: I name a pick; everyone who added to the pot votes to confirm it. Never
    write that a winner is picked, decided or paid at the moment of a stream.
11. Spell exactly: The ZAO, ZAOstock, ZABAL, WaveWarZ, BetterCallZaal, COC Concertz, and the 8 acts:
    The Crown Vics, OPEN X, Grass Rug, Acadia Rising, Michael Anderson, DCoop, LyonsDen, Tom Fellenz.
12. Never put an instruction, a placeholder or a line written in capitals into a post. If the text I
    give you contains one, such as "MY PICK IN ONE OR TWO SENTENCES" or anything in square brackets
    that reads as a note to me, stop, leave that line out, and ask me for the real sentence. "Word
    for word" never covers a placeholder.

Reply "rules noted" and nothing else.
```

---

## Sources for each rule

| Rule | Source |
|---|---|
| 1 | CLAUDE.md "Boundaries"; lane brief "Anything outbound ... is Zaal's tap". 2026-09-20: the agent tried to publish the X Article unasked. Automations fire unattended after one enable tap (ZAOOS doc 2528) |
| 2 | published/README.md "Day 263 note": the editor rewrite changed 10 things with no list |
| 3 | 2026-09-21: "18+ clicks vs 0" had no source; the poidhz lane read 0.00% lifetime CTR from Paragraph analytics (2026-08-11) |
| 4 | published/README.md "Two voices in this folder, on purpose"; `automation/check-voice.sh --announcement` skips the comma and lowercase checks; lane re-brief item 3 |
| 5, 11 | CLAUDE.md "Voice + rules"; the global brand glossary; the act names as served on zaostock.com/program |
| 6, 7 | drafts/zaostock/SERIES.md "Link punctuation, after Day 263"; Zaal ruling 2026-09-20 23:43 (zao-vault decisions/grill-2026-09-20-seat-late.md, item 3) |
| 8 | drafts/zaostock/SERIES.md "Countdown lines, after Day 263" |
| 9 | lane re-brief (no set times); poidhz lane: the kit carries no licence and CC-BY is wrong; Kenny at poidh asked for no pot figure in writing; the glossary rule on names |
| 10 | poidhz runbook (README.md:235 in bettercallzaal/poidhz); poidh-app SKILL.md "Part 7: Open Bounty Voting" |
| 12 | 2026-09-21 evening: the Day 264 update carried the line "MY PICK IN ONE OR TWO SENTENCES, IN MY WORDS" as a slot for Zaal to fill before pasting; he pasted it unfilled, the agent put it in the draft word for word, and the preview showed it. The agent obeyed the letter. The rule makes it stop instead. The lane's side of the same lesson is in the memory note `feedback-no-placeholders-in-paste-blocks` |

## How to work with the agent (what this lane has seen it do)

- **"Saved" is a claim, not a fact.** Check it. This lane reads the item back from
  `public.api.paragraph.com/api/v1/content/<id>` or `/api/v1/posts`. On 2026-09-20 an excerpt
  "set" by the agent never changed.
- **"Saved to memory" means nothing across chats.** A new chat starts with none of it. Paste the
  block every time.
- **It reaches for outbound.** It tried to publish an X Article before it was asked, and offered to
  post a thread "immediately". End every request with "do not post".
- **It rewrites more than it is asked to,** sometimes for the better. Day 263's editor pass
  added two facts, and both checked out. So check its version against the live pages before
  publishing, not against the draft.
- **Writing yourself costs no credits; agent work does** (Paragraph plans page, quoted in ZAOOS doc
  2528). The cheapest route is: this lane writes the markdown, and the agent pastes, schedules and
  makes the X and LinkedIn versions.
- **One edition, one author.** This lane owns the text of every ZAOstock edition in
  `drafts/zaostock/`. The agent's version of an edition is a proposal that comes back here to be
  checked, not a third draft.
