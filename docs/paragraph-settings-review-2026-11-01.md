# Paragraph settings review, 1 Nov 2026

Zaal asked on 1 Nov: "we should have paragraph lane update all things and setitgngs on paragraph and reivew it and log that in the zaoonparagraph repo". This is the review. It is read-only: nothing on Paragraph was changed, archived, sent or published. Each change below is a step for Zaal, with a recommendation. Publishing and account settings stay his.

**How it was read.** Through the REST API with the publication's key, at 07:31 EST by `date`: `GET /v1/me`, `GET /v1/posts?status=draft`, `GET /v1/posts`, `GET /v1/content` and the public subscriber count. The setting names come from the PATCH schema in `docs.paragraph.com/openapi.json`, which lists 14 writable settings. The app was not opened, so anything that only the app shows is marked NOT READ.

## Publication settings

| Setting | Now | Recommendation | His step |
|---|---|---|---|
| `name` | The ZAO Newsletter | Keep | None |
| `summary` | "The ZAO Newsletter is your daily pulse on the decentralized creator revolution", then an em dash, then "featuring reflections from the frontlines, updates from our guild..." | Replace. It has an em dash and crypto-era wording the newsletter no longer uses. Proposed: "The ZAO is an impact network that gives artists back their profit margin, data and IP rights. Music first, community second, technology third. This is the daily record of what the community builds." That is the line every edition already ends on. | Approve or edit the text |
| `featuredPost` | popular | Change to latest, so a new visitor sees this week's edition first. The best-practices review of 31 Oct found the Top list under Day 304 showing 2024 and 2025 posts. | Approve |
| `showMostPopular` | true | Change to false, for the same reason | Approve |
| `pinnedPostIds` | none | Keep empty until a start-here post exists. Pinning an old edition would repeat the problem above. | None |
| `postListType` | grid | Keep | None |
| `themeColor`, `headerFont`, `bodyFont` | default, default, default | Keep. No brand colour is decided for Paragraph. | None |
| `enableSubscribePopup` | true | Keep | None |
| `enableSubscribeScroll` | true | Keep | None |
| `emailNotifications.newSubscriber` | true | Keep, so a new signup is seen | None |
| `logoUrl` | set | Keep | None |
| `hideStats` | NOT READ: the GET does not return it | Read in the app | Read it once |
| `enableTableOfContents` | NOT READ: the GET does not return it | Read in the app | Read it once |
| `plan` | starter | Keep. Starter is no longer sold, so a downgrade cannot be undone (31 Oct review). | None |

Subscribers: 584 by the public count. The list itself was not read, so no subscriber data is here.

## Post drafts

`GET /v1/posts?status=draft` lists 10 drafts: Day 305, 8 stale ones and the weekly roundup. Each title is as the API gives it.

| Draft | Id | Last saved (API) | Recommendation |
|---|---|---|---|
| Day 305 | `KPYoAnEYiIGlHYsfJIHa` | 31 Oct | The live draft. Publish after adding the fractal line, per #129 |
| Day 304 | `wSJNatYcTZtnHQSyy1kh` | 30 Oct | Archive. Day 304 is live as `O92qHVhCVfCD92qSeM2I` |
| Day 303 | `FfOig4jQW9dVAqt7U0Mc` | 29 Oct | Archive. Day 303 is live as `Cc9VxTLyCifiWFU7yxah` |
| Days 295, 296, 297, 298 | `GajC748kW6FyIIplQUS3`, `3048LrpVa4eczgjAa4iD`, `pM8wte5lT2GI1IMFZJbQ`, `NKCexBixiDBBAmuLruP1` | 26 Oct | Archive. Those days were skipped and the series has moved on |
| Day 286 | `l8wRNYWLfFxxLq9pdjju` | 13 Oct | Archive, same reason |
| Day 276 | `TbOcraFalTlKHA09lCRm` | 3 Oct | Archive, same reason |
| The ZAO last week: Fable Boy, Found Some and Base Rooms | `rPcXnushXxkrJv5k3hYk` | 17 Oct | His call. It is the only weekly roundup draft, and whether the weekly roundup stands is unsettled (30 Oct review) |

The same call also returned Day 263 (`sEEVjfXTNIFU6qKZuqsN`) with status published. It may carry an unpublished edit. Not checked further.

Archive, not delete: Paragraph's docs say "Delete all artifacts" permanently deletes the web article. Archiving these was not tested. The safe test is one archive in the app, then a check that the live editions above still load.

## Drafted socials (Content)

`GET /v1/content` lists 32 pieces: 12 published and 20 drafts. The published ones are history and stay. The drafts:

| Drafts | Recommendation |
|---|---|
| 3 Day 304 drafts (X post, LinkedIn, X Article), made by the in-app agent on the evening of 31 Oct, bucket `82100b55` | Do not use. The Day 304 socials page from 1 Nov replaces them and passed the fact check. Archive once Day 304 is shared, so nothing goes out twice |
| Day 303 X post, Day 302 and Day 301 X Articles | Archive. Their editions are four or more days old |
| Day 300 era: the 1,000 SOL X Article | Archive |
| Fractal 119 Session 2 X post and LinkedIn, Fractal 119 explainer LinkedIn | Archive. That fractal has passed |
| ZAOstock support X Article, ZAOstock explainer LinkedIn for Day 263 | Archive. ZAOstock ran on 3 Oct |
| 8 X drafts from 10 Aug (ZABAL Gamez, the arcade, Day 189, Day 200, Unlock Protocol) | Archive. Season 1 is over |

That leaves Content with only what is current, so a Publish press cannot pick up an old draft by mistake.

## Not read: only the app shows these

The API has no route for these. Reading them means opening the logged-in app, which this review did not do. It also means going near the in-app agent, which is stopped except where Zaal lifts it.

| Item | Where it lives (docs) | Why it matters |
|---|---|---|
| Agent memory | Brand, then the Memory tab | On 31 Oct the agent saved to its memory during a run that also edited published Day 246. What it now remembers about The ZAO is unknown |
| Brand voice and account voices | Brand; Connectors, then Accounts | Decides how any agent draft sounds |
| Connections | Connectors | X and LinkedIn are connected and X Premium works (29 Oct). Telegram and Slack connect as chats with the agent only, not as places it posts |
| Welcome and follow-up emails | Changed by asking the agent, per the docs | The first thing a new subscriber gets |
| `hideStats`, `enableTableOfContents` | Settings | Not in the GET response |
| Campaigns and Search & AI tabs | Analytics | Clicks and signups by send. Nobody has a record of reading them (31 Oct review) |

**Recommendation:** one supervised read-only pass in the app, with Zaal watching or on his word. Open Brand, then Memory, and copy each note into this file. The same for Brand voice, Connectors and the welcome email. Press nothing, and never Create new under a post. Then decide the memory notes one by one: keep, or Remove note.

## His steps, in order

1. Approve or edit the new `summary` text.
2. Approve `featuredPost` to latest and `showMostPopular` to false.
3. Archive the 8 stale post drafts and the 20 social drafts listed above, after Day 304 and Day 305 are shared.
4. Say whether the read-only app pass happens, and when.

Steps 1 and 2 are API calls this lane can make on his word, each followed by a read back. Step 3 is archiving, which this lane does not do without his word, one batch at a time. Nothing in this file has been done.
