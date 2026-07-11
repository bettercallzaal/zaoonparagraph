# The ZAO on Paragraph - platform potential report

Date: 2026-07-09
Scope: what Paragraph the platform actually is right now, what it offers beyond "paste a post here," and where that does or doesn't line up with The ZAO's current setup (400+ editions across Year of the ZAO / Year of the ZABAL / ZTalent, 78 paid supporters, daily build-in-public voice).

All claims below are sourced - each has a link. Where public docs didn't disclose a number (fees, current publication count, writer-coin economics), that's flagged explicitly rather than estimated.

## 1. What Paragraph is, as of today

Paragraph started as "Papyrus," rebranded, and is built by founder Colin Armstrong (ex-Google engineering manager, ex-Coinbase engineer). [[gen.xyz]](https://gen.xyz/blog/paragraphxyz) It closed a $1.7M pre-seed round in October 2022 led by Lemniscap, [[gen.xyz]](https://gen.xyz/blog/paragraphxyz) then a $5M round led by Union Square Ventures and Coinbase Ventures in 2024. [[cryptouniverse.blog]](https://cryptouniverse.blog/paragraph-absorbs-mirror-in-web3-publishing-consolidation-what-changes-for-writers/)

In May 2024 Paragraph acquired Mirror.xyz, one of the two dominant web3 publishing platforms at the time. [[cryptouniverse.blog]](https://cryptouniverse.blog/paragraph-absorbs-mirror-in-web3-publishing-consolidation-what-changes-for-writers/) Migration finished by September 2025: all Mirror content, drafts, media, and subscriber lists moved over, old Mirror URLs redirect with no broken links. [[paragraph.com/@blog/bringing-the-best-of-mirror-to-paragraph]](https://paragraph.com/@blog/bringing-the-best-of-mirror-to-paragraph) Practically: Mirror is gone, Paragraph is now the only mainstream web3-native publishing platform left standing. The other reference point, Substack, has no crypto/token features at all. [[polyinnovator.space]](https://www.polyinnovator.space/substack-vs-beehiiv-vs-ghost-vs/)

Home page now bills itself as "your site, newsletter, audience, and agent" - agent is a first-class word in their own positioning, not an add-on. [[paragraph.com]](https://paragraph.com/)

## 2. Feature timeline - this moved fast in the last 12 months

| Date | Shipped | Source |
|---|---|---|
| 2025-08-11 | One account, multiple publications | [link](https://paragraph.com/@blog/one-account-multiple-publications) |
| 2025-08-15 | Remix system - collaborative response chains, shared revenue | [link](https://paragraph.com/@blog/a-better-way-for-ideas-to-strengthen-and-spread) |
| 2025-09-02 | "What we're learning from coins on Paragraph" - first coins retrospective | [link](https://paragraph.com/@blog/what-were-learning-from-coins-on-paragraph) |
| 2025-09-15 | Mirror migration complete, Mirror shut down | [link](https://paragraph.com/@blog/bringing-the-best-of-mirror-to-paragraph) |
| 2025-11-20 | Writer Coins launched | [link](https://paragraph.com/@blog/writer-coins) |
| 2025-12-10 | Search + discovery feed, XMTP integration | [link](https://paragraph.com/@blog/better-discovery) |
| 2025-12-17 | Public API & SDK launched | [link](https://paragraph.com/@blog/paragraph-api-and-sdk) |
| 2026-04-13 | "Your work, paid for by agents" - AI agents as buyers of content | [link](https://paragraph.com/@blog/your-work-paid-for-by-agents) |
| 2026-04-17 | "Paragraph is now AI-native" | [link](https://paragraph.com/@blog/paragraph-is-ai-native) |
| 2026-07-07 | Every publication gets a built-in AI agent | [link](https://paragraph.com/@blog/the-new-paragraph) |

That last one shipped two days before this report. The platform is mid-pivot from "publishing tool" to "publishing tool with an agent that runs your publication."

## 3. Monetization mechanics that actually exist today

**Paid subscriptions.** Paragraph supports subscription payments in stablecoins, ETH, and other crypto directly wallet-to-wallet - no fiat-to-crypto conversion hassle for readers who already hold crypto. [[ckxpress.com]](https://ckxpress.com/en/paragraph/) One firsthand account cites a 5% platform fee versus Substack's 10%, though this wasn't independently confirmed in Paragraph's own public docs - verify current rate in the dashboard before relying on it.

**Post/Content Coins.** Each post can become its own tradable ERC-20 token via automatic Uniswap liquidity pools - this is the same mechanism as Zora's Content Coins, and Paragraph explicitly built on it. [[paragraph.com/@mikeshupp]](https://paragraph.com/@mikeshupp/zora-creator-coins) [[docs.zora.co]](https://docs.zora.co/coins) A reader supports a specific post by buying its coin through a "Support" button or on a DEX directly.

**Writer Coins (Nov 2025).** A profile-level token, distinct from post coins - readers "back the writer" rather than one piece of content, in a flow deliberately stripped of crypto complexity ("one extra tap" for a new subscriber to also become a backer). [[paragraph.com/@blog/writer-coins]](https://paragraph.com/@blog/writer-coins) A writer can allocate roughly 5% of total coin supply to past supporters (previous post-coin buyers, existing subscribers) as a retroactive reward. Launching a Writer Coin also earns placement in Paragraph's discovery feed, which is explicitly built to surface writer-coin-backed publications. [[paragraph.com/@blog/writer-coins]](https://paragraph.com/@blog/writer-coins) Exact fee split and per-transaction writer earnings are not disclosed in any public source found - that's a real gap, not an oversight in this report.

**NFTs + storage.** Gasless NFT minting for posts, and permanent storage on Arweave as an automatic backup independent of Paragraph staying in business. [[ckxpress.com]](https://ckxpress.com/en/paragraph/)

**Data portability.** One-click import from Substack/WordPress/Mirror, one-click export. This matters for risk: it means testing any of the above (Writer Coin, agent) costs little, since walking away doesn't mean losing 400+ editions of archive. [[ckxpress.com]](https://ckxpress.com/en/paragraph/)

## 4. The built-in AI agent - direct answer to the open question in CLAUDE.md

CLAUDE.md for this repo flags an undecided question: lean on Paragraph's new AI assistant, or keep the zabalnewsletterbuilder + zaoonparagraph custom flow. Here's what the agent actually does, as documented:

- Researches and edits a post, cross-references the writer's own archive, generates images. [[paragraph.com/@blog/the-new-paragraph]](https://paragraph.com/@blog/the-new-paragraph)
- Repurposes writing into social posts (tweets, short videos) for distribution.
- Audits the entire archive for SEO fixes, with writers reporting real traffic gains from following its suggestions.
- Can design, lay out, and fully code a custom site from scratch, or apply a theme.
- Runs on its own isolated compute with internet access and the ability to install packages.
- Interaction model is **proactive, not conversational**: it emails the writer daily with "ready-to-execute growth suggestions" rather than working through a chat window on demand. Permissions are managed in settings.

What's NOT confirmed anywhere in public docs: whether this agent is the same system as the static "AI Assistant" API key found in Settings > Workspace > Developer (the one this repo's `automation/create-draft.sh` already uses), or a separate, newer system. That's worth checking directly in the dashboard rather than assuming.

**Assessment.** The native agent is genuinely capable, but two days old at full scope and built for a generic voice - proactive suggestion emails, not a scriptable/deterministic pipe. The ZAO's differentiator is a hand-disciplined voice (all lowercase, zero commas, no em dashes, one exact signoff, specific catchphrases) that a general-purpose "audit and suggest" agent has no documented way to hold to. The custom pipe built today (`create-draft.sh`, forced `status: draft`, hard-fails on anything else) gives a guarantee the native agent's permission-based suggestion model doesn't describe having: nothing publishes without an explicit human step, and the voice rules are enforced by a human-written script, not inferred by a model each time.

Recommendation: keep the custom pipe as the production path. Treat Paragraph's native agent as something to pilot in a narrow, low-stakes way (e.g., let it suggest SEO fixes on the archive, don't let it touch drafting or socials) rather than replace the existing flow with it. Revisit this once the agent's actual guardrails (permission granularity, whether it can be constrained to draft-only) are confirmed directly rather than inferred from a blog post.

## 5. Where The ZAO actually fits

- **Audience overlap is claimed, but the source is now dead - don't cite this number further without re-verifying it elsewhere.** About 15% of American freelance writers were reported to use at least one blockchain-based publishing tool as of early 2026, per a bitget.com academy article cited when this doc was written (2026-07-09). Checked again 2026-07-11 (both the original URL and its AMP variant): both return 404, the article's been taken down entirely. The underlying claim may still be true, but it can no longer be independently verified at its original source - treat the 15% figure as unconfirmed until a live source is found. A daily build-in-public newsletter from a project with its own live token ecosystem (ZABAL, ZOE, SANG) is still plausibly a closer culture match here than on Substack or Beehiiv, but that reasoning shouldn't lean on the dead stat.
- **Writer Coin vs. existing token stack - a real tension, not a slam dunk.** The ZAO already runs ZABAL as its central token narrative. A Paragraph Writer Coin for @thezao would be a second, platform-specific token surface. That could work as a low-stakes on-ramp for readers who aren't ZABAL-deep yet (discovery-feed visibility is real and free), or it could read as narrative dilution ("which token actually matters here?"). This needs a deliberate call, not a default yes - and it's a decision for Zaal, not something to auto-launch.
- **Analytics endpoint is underused.** The API exposes a SQL-queryable analytics endpoint (`run-an-analytics-sql-query`) and a subscriber-count endpoint. [[paragraph.com/docs/llms.txt]](https://paragraph.com/docs/llms.txt) Pulling real read/subscriber numbers into the newsletter itself would be a literal fit for the existing catchphrase "it reads the record not your word" - grounding claims in Paragraph's own data instead of estimates.
- **Low switching risk.** Between Arweave backup and one-click export, none of the above needs to be treated as a big bet. Testing a Writer Coin or the native agent in a narrow lane costs little if it doesn't work out.

## 6. What's still unverified - check before acting on it

- Actual current subscription fee percentage (5% cited in one first-person account, not confirmed in official docs).
- Writer Coin per-transaction economics - what a writer actually earns, any platform cut.
- Whether the dashboard's "AI Assistant" key is the same system as the July 2026 native agent.
- Current total publications / writers on Paragraph post-Mirror-merger - no figure found in any source checked.

## Sources

- [gen.xyz - Paragraph.xyz backing](https://gen.xyz/blog/paragraphxyz)
- [ckxpress.com - three reasons for moving to Paragraph](https://ckxpress.com/en/paragraph/)
- [polyinnovator.space - platform comparison](https://www.polyinnovator.space/substack-vs-beehiiv-vs-ghost-vs/)
- [cryptouniverse.blog - Paragraph absorbs Mirror](https://cryptouniverse.blog/paragraph-absorbs-mirror-in-web3-publishing-consolidation-what-changes-for-writers/)
- [paragraph.com/@blog - full post index](https://paragraph.com/@blog)
- [paragraph.com/@blog/the-new-paragraph](https://paragraph.com/@blog/the-new-paragraph)
- [paragraph.com/@blog/writer-coins](https://paragraph.com/@blog/writer-coins)
- [paragraph.com/@blog/bringing-the-best-of-mirror-to-paragraph](https://paragraph.com/@blog/bringing-the-best-of-mirror-to-paragraph)
- [paragraph.com/@mikeshupp/zora-creator-coins](https://paragraph.com/@mikeshupp/zora-creator-coins)
- [docs.zora.co/coins](https://docs.zora.co/coins)
- [paragraph.com/docs/llms.txt - API endpoint index](https://paragraph.com/docs/llms.txt)
- bitget.com - crypto publishing 2026 guide - DEAD as of 2026-07-11 (404, both standard and AMP URLs), cited at time of writing on 2026-07-09
