# Are we leveraging email well - bridge to the existing audit

Date: 2026-07-09
Trigger: asked whether we can add more email people, then reframed to "audit our whole system, we're not leveraging email well at all," with an honest "not sure / mixed list" on consent for any list beyond the current subscribers.

This was already audited in depth. Doc `944-newsletter-growth-deliverability-playbook` in the ZAOOS repo (`research/dev-workflows/944-newsletter-growth-deliverability-playbook/`), last-validated 2026-07-03 - six days old, still current. This doc doesn't redo that work. It connects it to what's true right now and says what to do next.

## What's true right now (verified live, 2026-07-09)

- Real subscriber count on Paragraph: **592**, publication id `DB7iU1HMVzTT9bI4ec6X`, pulled via the public `GET /v1/publications/{id}/subscribers/count` endpoint - no auth needed, safe to check anytime.
- Doc 957's Dec-31 reach plan targets newsletter at **4k** subscribers by December. 592 today means the newsletter channel is at roughly 15% of its H2 target with under 6 months left.

## What doc 944 already found - the actual answer to "are we leveraging email well"

No. Specifically, three flagged gaps ("biggest miss" x2 plus a third):

1. **No landing page or lead magnet** (effort 3/10). Landing pages convert ~23x a generic web page; optimized forms hit 8%+ vs 1.5-3% for a bare email field.
2. **No welcome sequence** (effort 3/10). A 3-6 email sequence lifts first-year retention 25-40% - the first 30 days set 12-month retention, and right now new subscribers get nothing.
3. **No referral loop, no list hygiene, no click/reply metrics.** Referral programs add ~17% growth on their own; a dual-sided reward at a 1-referral threshold gets ~40% participation.

Doc 944 already drafted specs for the landing page and a 3-email welcome sequence skeleton, and named lead magnet candidates (WaveWarZ one-pager ranked best). None of it has shipped yet.

## On the original question - adding more emails

Given the "not sure / mixed list" answer: don't cold-import anything. That instinct is correct - the documented, consented levers already outperform a cold import anyway:

- **Cross-promo swaps** (effort 5/10): 5-10 aligned partners (SongJam, POIDH, Bonfires, Wide, Magnetiq, Empire Builder - flagged `[verify]` in doc 944, not yet confirmed), each worth ~50-200 subscribers.
- **Substack mirror** (from doc 957): mirroring content to Substack's network drove one case study from 11 to 5,800 subscribers in 6 months; 3+ Notes at launch adds ~50% more reach. This is the single highest-leverage lever in either doc for pure list growth, and it's fully consent-clean - people opt in on Substack same as anywhere else.
- **Referral loop** (effort 4/10, SparkLoop or beehiiv-style): existing 592 subscribers referring in new ones, ~17% lift.

None of these require deciding what to do with an ambiguous-consent list. They grow the list with people who opted in directly.

## Recommended next action

Two lowest-effort, highest-doc-flagged-impact items, both effort 3/10 and both already spec'd in doc 944:

1. Stand up the landing page + lead magnet (WaveWarZ one-pager).
2. Ship the 3-email welcome sequence for the 592 subscribers already here - this alone is pure retention upside on an audience that already exists, no new acquisition needed.

Everything else (referral loop, cross-promo, Substack mirror) compounds better once those two exist, since they're what a referred or cross-promoted visitor actually lands on.

## Sources

- ZAOOS repo, `research/dev-workflows/944-newsletter-growth-deliverability-playbook/` (README.md + IMPLEMENTATION.md)
- ZAOOS repo, `research/business/957-100k-total-reach-h2-2026/README.md`
- Paragraph API, verified live 2026-07-09: `GET /v1/me`, `GET /v1/publications/{id}/subscribers/count`
