# Paragraph: what we could do better, from the docs

Read 2026-10-31 for Zaal. Docs reading only: nothing here was changed, tested or started. Each doc page was fetched raw (`https://docs.paragraph.com/<page>.md`) on 2026-10-31. Live values come from the public API that day. This extends `docs/paragraph-platform-surfaces.md`, ZAOOS research docs 2527, 2528, 2547, 2554 and 2665, and the audience note of 31 October.

Effects below are reasoning, not measurements. No row has a base rate.

## Ranked

| # | Do | Now | What it could do | His cost | Source page |
|---|---|---|---|---|---|
| 1 | Read the Campaigns and Search & AI tabs once | No record of anyone reading either | Campaigns reports clickthroughs and signups by send, so the other rows can be judged. Search & AI shows whether search or AI assistants bring readers | A few minutes, or tell the lane to read them | `audience/analytics` |
| 2 | Add a subscribe button and a share button to each edition | The 27 blocks read back from Day 304 are all paragraphs and headings. The site's popup and scroll prompts are on, with no new active subscriber since 8 Sep if the list sorts newest first | Asks people already reading. It may do little, since prompts already run. Share is new since the audience note | One word, then two blocks per edition | `publishing/editor` |
| 3 | Clean the page a new reader sees: summary, Top list, pinned post | `summary` still has an em dash, `showMostPopular` is true, `featuredPost` is popular, `pinnedPostIds` is empty. The Top list under Day 304 shows 2024 and 2025 posts | Could help a visitor decide to subscribe. Open since doc 2527 | Settings taps, or one MCP `update-publication` call once signed in | `developers/mcp`, public publication API |
| 4 | Queue X and LinkedIn into the morning on the Calendar | Socials go out by hand after publish, and Day 304 went live late afternoon | His own X data favors 08:00 to 13:00 ET (4.47 mean likes at 08:00, 1.65 at 18:00). Likes, not clicks. Keep Automatic approval off, per doc 2665 | Approve each piece | `distribute/calendar` |
| 5 | Embed the replay and X posts in the body | Day 304 links the episode as plain text | A reader can watch in place on the web. It may lower clicks while raising viewing. How it shows in email was not read | Paste the link on its own line | `publishing/editor` |
| 6 | Send a test before each publish | Not part of the hand flow, as far as this lane knows | No subscriber effect. Catches a bad send before 583 people see it | One click | `distribute/newsletters` |
| 7 | Welcome and follow-up emails | State unknown, Settings not read | Little until new people join. They are set up by asking the in-app agent, so row 7 waits on his agent ruling | Agent use | `audience/lifecycle-emails` |

**Skip for now:** Playbooks (built around a code repository, doc 2547), video and Generate covers (doc 2665: no AI-made public design), segments (nothing to target yet), custom domain (brand only, no signups by itself). Plan stays as it is: Starter can't be bought again once left, per `account/plans-and-credits`.

**Dropped from older docs:** the advice to ask subscribers to reply or move mail to their primary inbox (doc 2547), and "judge each channel by its own job". Neither phrase is in today's `llms-full.txt`, so neither is cited as Paragraph's advice.

**Count to watch:** the public subscriber count read 593 on 2026-09-21 (doc 2528) and 584 today, while Analytics shows 0 unsubscribes in 12 weeks. Not reconciled.

## Archiving a published post safely

Steps are UNTESTED. Nobody has run them on this publication.

1. In Content, on the All tab, open the post's row **...** menu. Its contents were not opened for this page.
2. Choose **Archive** if offered. **Do not choose Delete all artifacts**: `distribute` says it permanently deletes the Web Article.
3. Check the public URL. `distribute` says Archive removes a piece from working lists and that a piece that went out stays marked Published. It does not say the page leaves the website, so it may still load.
4. If it still loads, the documented route is the post API: `status: "draft"` unpublishes and `status: "archived"` archives (`llms.txt`, Update a post). That needs the MCP signed in, or a key, and his word. No unpublish button appears on the pages read.

**What breaks, for Day 246:**
- **Its URL:** presumably stops loading. Not tested.
- **The email already sent:** stays in inboxes. Its web links may fail.
- **Links from other editions:** on `origin/main`, `published/`, `drafts/`, `docs/` and `automation/` link it only from generated Top and Latest lists in four records, plus the `published/README.md` table. The bodies of those records have no authored link to it. Not searched: X, Farcaster, other repos.
- **The repo record:** `published/2026-09-03-day-246.md` stays, but the folder README says every file there is live, so it needs a one-line note.
- **Analytics history:** not documented.
- **Worth knowing first:** doc 2554 found Day 246 had 33 clicks from 6 people, about five times any other edition in its window, and said to read it before writing another call to action. The record keeps the text.

**The agent's Day 246 row:** no dismissal is documented as needed first. The content archive reference says archiving dismisses suggestions proposing that piece, and only a queued send blocks it. Whether that covers a pending update on a published post is not stated. Default: archive directly, approve nothing.

## Can the in-app agent be limited?

**Not in chat, as far as the docs show.** Searched `llms-full.txt` for read-only mode, restrict or limit the agent, agent permissions, edit permissions, locking or protecting a post: 0 hits. Not searched: the live Settings and Brand screens.

What the docs do give:
- **Public actions wait for approval** (`agent`). That covers sending and posting, not private edits. On 31 Oct the agent edited Day 246 from a Day 304 request and called it a private update, while the public page shows that wording. Whether the two are connected is unconfirmed.
- **Automations have limits per job** (`agent/automations`): capabilities are chosen per automation and can't be added during a run. Chat has no equivalent on the pages read.
- **Memory is visible and removable** (`agent/voice-and-memory`): Brand, then Memory, then Remove note on a card.
- **Sessions:** the agent keeps voice, brand and notes across sessions (`agent/chat`), so a fresh chat does not clear memory.

**What this lane would do, each his call:**
1. Never use **Create new** under a post: it sent the agent a generic prompt with no further click on 31 Oct.
2. If the agent is used, name the post and say no edits and no memory. One run with that wording stayed in scope, which is one run.
3. Write socials through the clipboard or, once signed in, the MCP. Writing yourself uses no credits (`account/plans-and-credits`).
4. Read every agent draft against the edition. On 31 Oct its LinkedIn draft put links in the body, and its X post misdated a quote.
