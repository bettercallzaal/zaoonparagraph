# blog.thezao.com - plan (9 Nov 2026)

**Outcome, 9 Nov 2026 evening: Zaal picked B (Your own website), and it is live.** See "What happened" at the end. The rest of this doc is the plan as written before the pick.

Zaal, seat pane, Mon 9 Nov: "i wanna set up blog.thezao.com and i wanna make the zaoonparagraph repo aswell alligned iwth all this".

This is a plan only. No DNS record, Paragraph setting or Vercel domain was changed. Each of those steps is his to do, and each is marked **Zaal** in the test card.

## What Paragraph offers (sources)

Paragraph has two separate ways to put the blog on our own domain. They need different DNS records and different work in this repo, so the first pick is which one.

**A. Custom domain: Paragraph hosts the blog at blog.thezao.com.** Source: the 3DNS guide, https://docs.3dns.box/docs/how-to-set-up-a-custom-3dns-domain-for-your-paragraph-publication (third party, read in full 9 Nov). It says to "Pay a one-time fee of $50 in your Paragraph publication settings to unlock the custom domain feature", then add the domain under "Custom domain". For a subdomain it gives **CNAME, name `blog`, value `paragraph.xyz`**. Verification is a status check in the Paragraph dashboard ("DNS changes may take up to 48 hours to propagate"). Old links: "Paragraph will automatically redirect from your old Paragraph URL to the new custom domain". **This repo needs no code for it.**

**B. "Your own website": we host the blog and Paragraph sends readers there.** Sources: Paragraph's post "Keep Your Blog on Your Own Website", https://paragraph.com/@blog/keep-your-blog-on-your-own-website (dated 30 Oct 2026, read in full 9 Nov), and the Website settings page as Zaal pasted it. The page reads "Where readers read your Web Articles", with two choices: Paragraph website, or Your own website. The second asks for a Website address (like `https://yoursite.com/blog`) and a Web Article address (like `https://yoursite.com/blog/{slug}`), and says "once your website is verified, readers go there instead". Newsletters, the subscribe page and RSS stay on Paragraph. The post says to "connect your site under Settings → Website by adding the TXT record Paragraph shows to your DNS". It also says "Whether readers follow an old paragraph.com link, a search result, your newsletter or a social post, they end up reading the post on your own domain", "Your blog's home and archive on Paragraph redirect readers to your site as well", and "Links in your newsletters go to each post's page on your site". Pricing is not stated.

**Not established.** Paragraph's own docs host was down: https://docs.paragraph.com returned HTTP 500 on 9 Nov. help.paragraph.com and support.paragraph.com redirect to the home page. So for B, three things are unread:

- the exact TXT record (Paragraph shows it only in the dashboard);
- whether a subdomain like blog.thezao.com is accepted as the Website address;
- how a canonical tag is set.

Before he saves B, re-read docs.paragraph.com, or ask hello@paragraph.com (the address in the post).

## Recommendation

**A, if Zaal will spend the $50.** It is one CNAME and one settings save. Paragraph keeps rendering, comments, collect and subscribe, and this repo does not change. If he will not spend it, B works, but this repo then becomes the public blog and has to render every post well.

## What blog.thezao.com must serve

- **Under A:** nothing from us. Paragraph serves `https://blog.thezao.com/{slug}`, using the same slugs as today.
- **Under B:** a page per Web Article at `/{slug}`, plus a home page at `/` (Paragraph redirects its home and archive there).
  - Each article page is rendered from the public API. `GET https://public.api.paragraph.com/api/v1/publications/DB7iU1HMVzTT9bI4ec6X/posts/slug/{slug}?includeContent=true` returned 200 for `year-of-the-zabal-day-307` on 9 Nov, with `staticHtml`, `json` and `markdown` fields. Without `includeContent=true` the body fields are absent.
  - The home page uses the list call that index.html already makes.
  - **A plain redirect back to paragraph.com does not work under B.** Paragraph would send the reader to blog.thezao.com, and we would send them straight back: a redirect loop. Under B, a redirect is only good as a placeholder for the few minutes before the settings save.

## What in this repo renders posts today, and what changes under B

| Path | What it does now | Change under B |
|---|---|---|
| `index.html` | A static page at zaoonparagraph.vercel.app. It lists the last 3 posts from the public API (line 160) and links each to `https://paragraph.com/@thezao/` + slug (line 172). | It becomes the blog home: list the posts and link to `/{slug}` on our domain. Lines 11 (og:url) and 111 (the "lives on Paragraph" line) change with it. |
| `vercel.json` | Only an ignoreCommand. | Add a rewrite from `/:slug` to the render function. Add `blog.thezao.com` as a domain in the Vercel project (**Zaal**). |
| `scripts/vercel-ignore.sh` | BUILD_PATHS covers the HTML, assets, public and vercel.json. | Add `api` so a change to the render function triggers a deploy. |
| `api/post.js` (new) | - | Fetch by slug with `includeContent=true`. Serve `staticHtml` inside the site shell, with title, og tags, the cover image, and a subscribe link back to Paragraph. Cache with a short s-maxage. Return 404 for an unknown slug. |
| `dashboard/` | A local server; `.vercelignore` keeps it off the site. | No change. |
| `published/` | Markdown records, each with its paragraph.com URL. | No change to old records; they are history. New records take the new address (see `record-edition.py` below). |

Under A, none of the rows above change. Only the URL table below matters.

## URLs that would change (README, CLAUDE.md, automation)

Read by grep on 9 Nov, branch off origin/main at e288c2f. One proposed change per file, under either option. **No automation is edited until Zaal picks the address pattern.**

| File:line | What it says now | Proposed change |
|---|---|---|
| README.md:191 | "Review the draft on Paragraph (paragraph.com/@thezao)" | Point the editor review at app.paragraph.com (the rule for editor links). Readers read at the new address. |
| README.md:208 | "the live newsletter at paragraph.com/@thezao" | The new reader address, with paragraph.com/@thezao kept as "also at". |
| CLAUDE.md:5 | "(paragraph.com/@thezao)" | Name both: the blog at the new address, the newsletter on Paragraph. |
| CLAUDE.md:52 | "Paragraph publication: paragraph.com/@thezao." | Add the new reader address on the next line. |
| automation/build-socials.py:40 | `PUB` default `https://paragraph.com/@thezao/`, overridable by `PARAGRAPH_PUB_BASE` | Change the default to the new address. The env override already exists, so this is one line. |
| automation/stage-socials.py:22 | `PUB = "https://paragraph.com/@thezao/"` | Read the same `PARAGRAPH_PUB_BASE` as build-socials, so the two scripts cannot disagree. |
| automation/record-edition.py:20 | `LIVE = "https://paragraph.com/@thezao/"` | The same env and default, so new `published/` records carry the new address. |
| automation/check-social-facts.py:29 | `ALLOWED_LINKS` allows `https://paragraph.com/@thezao/` | Allow the new address and keep the old one. Old socials, and anything staged before the switch, still carry it. |
| automation/paragraph-agent-context.md:32 | "Link Paragraph posts with the paragraph.com/@thezao/writing/ address." | The new address. The `/writing/` path is already stale: published records use `/@thezao/{slug}`. |
| automation/test-record-edition.py:70, :102, :126 | Fixture URLs on paragraph.com | Follow record-edition.py, or set the env inside the test. |
| automation/test-check-social-facts.py:23 | Fixture with the old address | Add one case for the new address, and keep the old one passing. |
| automation/test-stage-socials.py:146 | A "bad link" fixture that uses paragraph.com/@thezao/day-1 | No change. It tests a wrong slug, not the host. |

## Risks

- **Links in old socials.** Under A, the 3DNS guide says old paragraph.com URLs redirect. Under B, the Paragraph post says old links "end up reading the post on your own domain". Neither source says whether that is a 301 or a client-side hop. Test 3 in the card checks it with curl. If the old link does not land, every X, LinkedIn and Farcaster post since July points at a dead page.
- **RSS.** The working feed is `https://api.paragraph.com/blogs/rss/@thezao` (200, text/xml, 9 Nov). `paragraph.com/@thezao/rss` and `/feed` return 404. The items link to `paragraph.com/@thezao/{slug}` today. After the switch, the item links should carry the new address. Nothing in this repo publishes a feed, so there is nothing for us to change, only something to check.
- **SEO canonical.** Under A, Paragraph serves the canonical. Under B, our page has to emit `<link rel="canonical" href="https://blog.thezao.com/{slug}">`. The Paragraph copy should point there too. That is a Paragraph-side setting we cannot see, so test 5 checks it.
- **Redirect loop.** Under B, see "What blog.thezao.com must serve" above.
- **Content-group socials.** build-socials puts the edition URL into the X post, X Article and LinkedIn. If the address changes partway through a day, one edition's socials can mix the old and new hosts. Switch on a day with no edition in flight.
- **Public repo.** zaoonparagraph is public. The render function needs no API key (the public API is unauthenticated), so no secret goes near Vercel.
- **thezao.com DNS is at Porkbun** (the NS records read on 9 Nov). The apex A record is 216.198.79.1, and blog.thezao.com has no record yet. The existing TXT records (SPF, Google, MailerLite) stay. The new record is added beside them, never in place of them.

## Test card

Every outbound step is Zaal's hand. The lane runs only the read-only checks.

1. **Zaal** picks A or B. For B, he also picks the pattern: `https://blog.thezao.com/{slug}` (the recommended one), or `https://thezao.com/blog/{slug}`. Then he picks whether to spend the $50 (A).
2. **Under A:**
   - **Zaal**, Porkbun DNS for thezao.com: add **CNAME, host `blog`, answer `paragraph.xyz`**. Confirm this value against what the Paragraph dashboard shows before saving; the source is a third-party guide.
   - **Zaal**, Paragraph, Publication settings, Custom domain: enter `blog.thezao.com`, Add, then pay the $50.
3. **Under B:**
   - The lane opens a PR with `api/post.js`, the rewrite and the index.html change.
   - **Zaal** merges it.
   - **Zaal**, Vercel: add `blog.thezao.com` to the zaoonparagraph project. Vercel shows the CNAME value to use.
   - **Zaal**, Porkbun: add that CNAME, host `blog`.
   - **Zaal**, Paragraph, Settings, Website: copy the TXT record it shows and add it in Porkbun.
   - **Zaal**: choose Your own website, enter the Website address and the Web Article address, and Save.
4. **Lane, read only:** `dig +short blog.thezao.com` returns the CNAME target. `curl -sI https://blog.thezao.com/year-of-the-zabal-day-307` returns 200 with a valid certificate.
5. **Lane, read only:** `curl -sI https://paragraph.com/@thezao/year-of-the-zabal-day-307` lands on blog.thezao.com. Record whether it is a 301, a 308 or a client-side hop.
6. **Lane, read only:** the blog page has a canonical tag pointing at blog.thezao.com. The RSS items at `https://api.paragraph.com/blogs/rss/@thezao` carry the new host.
7. **Lane:** a PR with the URL-table changes, the new address set as the default, and `automation/test-all.sh` green. Only after tests 4 to 6 pass.
8. **Zaal** reads one live edition at the new address on his phone, and taps the subscribe link. It should land on Paragraph.

## Open for Zaal

- A ($50, no code) or B (our page, our upkeep)?
- The address pattern for B.
- Whether to ask hello@paragraph.com for the B details the docs outage hid (his send; the lane can draft it).

## What happened (9 Nov 2026, evening)

- Zaal picked **B**, with the address pattern `https://blog.thezao.com/{slug}`. The $50 custom domain was not used.
- #147 added `api/post.js`, `api/editions.js` and `api/_blog.js`, and Zaal merged it. Vercel serves a real file before a rewrite, and `index.html` sits at `/`, so the blog home is `/editions`. `/` on the blog host redirects there.
- Zaal's hand: added `blog.thezao.com` in Vercel; set the Paragraph Website page to Website address `https://blog.thezao.com/editions` and Web Article address `https://blog.thezao.com/{slug}`; added the TXT record Paragraph showed (name `_paragraph.blog.thezao.com`) in Porkbun. Paragraph reports it verified.
- Read by curl after verification:
  - `paragraph.com/@thezao/year-of-the-zabal-day-313` and `-307` return a 301 to the same slug on blog.thezao.com, which returns 200.
  - `paragraph.com/@thezao` returns a 301 to `/editions`.
  - `paragraph.com/@thezao/subscribe` stays on Paragraph (200).
  - 8 random older editions, Day 37 to Day 303, return 200 on the blog.
  - RSS item links still name paragraph.com, and each one 301s to the blog.
- Paragraph never showed the TXT record or the subdomain rules before Save, so those "not established" items above are now settled by the live result.
- The URL table above is carried out in #148: reader links default to the blog. `paragraph.com/@thezao/<slug>.md` still answers on Paragraph with no redirect, so record-edition keeps reading bodies from there.
