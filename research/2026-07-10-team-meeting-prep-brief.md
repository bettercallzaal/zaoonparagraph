# Team meeting prep - Paragraph, 2026-07-10

Two things came up while checking the live @thezao dashboard this morning that are worth bringing to the team: a Writer Coin that already exists and is dormant, and how much autonomy Paragraph's native agent actually has. Both verified directly against the live site/contract, not assumed.

## 1. @thezao already has a live Writer Coin - $ZAAL

**Confirmed facts:**
- Ticker `ZAAL`, full name "The ZAO Newsletter (ZAAL)", contract `0x321380ab345f9044a08da94ed8518e82667d03d4` on Base. Verified live at `paragraph.com/@thezao/coin` and on Basescan.
- 1,000,000,000 total supply (the standard Writer Coin supply per Paragraph's spec).
- **86 holders** per Basescan.
- Paragraph's own coin page shows **"No supporters yet."**
- The GeckoTerminal pool link on the coin page returns a 404 - no indexed trading pool. There's a token, but no real functioning market for it right now.
- Writer Coins are confirmed **opt-in, not automatic** - Paragraph's own docs (`docs/earn/writer-coins`) require going to Publication Settings > Monetization and clicking "Launch writer coin" with a wallet connected. This did not happen by accident or by default - someone deliberately launched it.

**What's NOT confirmed - worth checking in Settings > Monetization directly before the meeting:**
- Who launched it and when. Basescan didn't surface a clean creation timestamp from what's publicly readable, and this predates anything discovered in this session's research - it wasn't mentioned in yesterday's Paragraph platform research pass at all, meaning it was launched before that research or missed by it.
- Whether the newsletter's own AI agent (live since 2026-07-07) launched it, or a team member did manually at some earlier point.

**One thing everyone should know before the meeting:** launching a Writer Coin already changed the site's main call to action - Paragraph's docs confirm the top-nav "Subscribe" button becomes "Support" once a coin is live, and existing support buttons now point to buying the coin instead of a plain subscribe/tip flow. This is already live on @thezao right now, whether or not anyone remembers deciding it.

**The actual decision for the meeting:** yesterday's platform research flagged a Writer Coin as an open, undecided tension against the ZABAL token narrative. That framing was wrong - it's not a future decision, it already happened. The real question now is what to do with a coin that exists and has zero real activity: let it sit as-is, seed real liquidity and promote it, or actively address the Subscribe-button change if that wasn't an intentional choice.

## 2. Paragraph's native AI agent - what it can actually do

Confirmed from the live Suggestions inbox (`app.paragraph.com/thezao/suggestions`), not just the blog announcement:

- The agent queues **specific, ready-to-fire actions** - including posting directly to X/Twitter - and shows an "Approve & run" button per suggestion. Clicking that button is a real publish/post action, not a preview.
- At least one suggestion in the queue today cited a specific number ("368 logs") as justification for a post - unverified by us, worth checking before anyone approves it.
- Separately, one suggestion was a fully-drafted "Year of the ZABAL Day 190" post dated Jul 8 - two days stale, and built on facts ("onchain bounty parsing from the zpoidh repo") not verified anywhere in this session's research. It has no awareness that the real Day 190 (and Day 191) already went out through the manual pipe built yesterday.
- **What's not confirmed:** the exact permission model behind "Approve & run" - whether it can ever fire without that manual click, or whether there's a settings toggle that changes this. Public docs don't cover this level of detail; it's account-specific configuration. Worth checking Settings > Workspace > Developer/Permissions directly - CLAUDE.md's own standing rule is publish and post-tweets should stay gated, save-draft/update-draft/send-test-email can auto-allow. Confirm that's actually how permissions are set, not assumed.

## Bottom line for the meeting

Two real, undecided things, not hypotheticals: a live but dormant token already changing the site's main button, and an AI agent already queuing real posts for one-click approval. Both are worth five minutes of the team's actual attention today, not follow-up research.

## Sources

- `paragraph.com/@thezao` and `paragraph.com/@thezao/coin` - checked live, 2026-07-10
- Basescan: `0x321380ab345f9044a08da94ed8518e82667d03d4`
- `paragraph.com/docs/earn/writer-coins`
- `app.paragraph.com/thezao/suggestions` - checked live, 2026-07-10
- `paragraph.com/@blog/the-new-paragraph` (native agent announcement, 2026-07-07)
