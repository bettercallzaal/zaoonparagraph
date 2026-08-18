# Paragraph node catalogue - what strong publications actually use

Field study run 2026-08-18 via the Paragraph MCP: recent posts from six live
publications pulled and their Tiptap json dissected. Publications studied (all
fetched FULL): ETH Daily News (ethdaily), Global Coin Research (globalcoinrsrch),
SpiritDAO (spiritdao), The BSCN Debrief (bscnalpha), Salon de l'Empress
(empresstrash), The Late Night Brief (latenightbrief). Credit to those writers -
the patterns below are theirs, observed.

## Node types seen in the wild (17)

| Node | Shape | Who uses it |
|---|---|---|
| paragraph | `{"type":"paragraph","attrs":{"textAlign":null},"content":[...]}` | everyone |
| heading | `attrs: {level: 1-3, textAlign}` | everyone |
| bold + link marks combined | `"marks":[{"type":"link","attrs":{"href":...}},{"type":"bold"}]` | ETH Daily, GCR, BSCN headline-links |
| italic mark | | Empress, Late Night, SpiritDAO |
| horizontalRule | `{"type":"horizontalRule"}` | everyone, 3-7 per post |
| figure + image | figure wraps image, `attrs: {float, width}` | GCR, SpiritDAO, Empress |
| figcaption | caption inside figure ("Source: Velo") | GCR, SpiritDAO |
| bulletList + listItem | | BSCN, GCR, Late Night |
| orderedList + listItem | `attrs: {start}` | SpiritDAO (table of contents) |
| customButton | `attrs: {href}`, bold text content | GCR, SpiritDAO, Late Night |
| callout | `attrs: {type: "info"}` | GCR, SpiritDAO |
| hardBreak | line break inside a paragraph | GCR, SpiritDAO |
| twitter | `attrs: {tweetData: {...}}` - editor-built, do not hand-author | Late Night |
| emoji | `attrs: {name}` - section markers (violates ZAO no-emoji rule; skip) | Late Night |
| subscribeButton | `attrs: {href: <memberships url>}` | SpiritDAO footer |
| shareButton | `attrs: {href: <post url>}` | SpiritDAO footer |
| codeBlock / equation | available in editor + menu | rare |

## Craft patterns worth stealing

1. Opening: greeting line, one-line week summary, horizontalRule, first H2.
2. Section rhythm: H2, 1-3 short paragraphs, optional image+caption, optional
   list, horizontalRule. Repeat.
3. Bold+link headlines for news items - the link IS the headline (BSCN).
4. "By the Numbers" block: 5-8 lines of `bold stat - one sentence of context`
   (GCR). Falsifiable numbers front-loaded.
5. Sponsors treated as content: H3 per sponsor, 1-2 sentences of real value.
6. customButton directly after the section it pays off, never floating.
7. Footer ritual: horizontalRule, CTA, signature, subscribe + share buttons
   (SpiritDAO closes every post this way).
8. Tweet embeds as social proof near the claim they prove (Late Night).
9. Long-form opinion: H3 concept sections, strategic bold on phrases not
   sentences (Empress).
10. Emoji section markers give visual navigation without color support - noted
    for completeness, excluded here by the ZAO no-emoji rule.

## Applied so far

Day 230 finals edition (see case-study-day230.md): callout for prizes/dates,
horizontalRules between sections, bold+link, customButton on the recordings
archive, two tweet embeds. Not yet used: subscribeButton/shareButton footer,
figure+figcaption, By-the-Numbers block as a dedicated section.
