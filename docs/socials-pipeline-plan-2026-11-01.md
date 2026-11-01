# Newsletter to socials: what breaks today, and one plan

Written 2026-11-01 for Zaal, grill item 47: "i wanna share it out as muhcu as possible but im not confirident in our piplein". Day 304 and Day 305 socials wait on this. Nothing here has been built, sent or posted.

## The plan in one paragraph

When an edition goes live, one command reads the live edition, writes the socials, checks them against it, and puts the X post, X Article and LinkedIn post into Paragraph as drafts grouped with the edition. It prints one short page with the only things Paragraph cannot hold: the Farcaster cast and the LinkedIn first comment. You open Content in Paragraph, read three drafts, press Publish on each, paste the cast into Firefly set to Farcaster only, and paste the comment. Posting stays yours. It uses the existing `automation/stage-socials.py`, the socials skill and the Paragraph content API, and it does not use the in-app agent.

## What breaks or is manual today

| # | Problem | Evidence |
|---|---|---|
| 1 | The socials tool has not been fed since September. It refuses Day 304. | `stage-socials.py` on Day 304, with the key loaded, read 2026-11-01: `REFUSED: no drafts/socials/*-day-304.socials.md`. The newest edition with a socials file in `drafts/socials/` is Day 273. 12 editions from Day 274 to Day 304 have no file, of the last 40 posts the public API listed. |
| 2 | The same tool cannot find the key from a workspace. | With no environment key it prints `CANNOT RUN`. It looks in the repo's `.env` and in one hard-coded clone path that no longer exists. The file with the key is in a different local clone. |
| 3 | The tool and the skill still produce what you rejected on 31 Oct. | Eight paste blocks, a link on the end of the LinkedIn body against your first-comment ruling of 29 Oct, and a Firefly post that reaches X alongside an X post from Paragraph, which is the double post from your ruling of 13 Oct. The skill never mentions any of these rulings. |
| 4 | The rulings live in three places that disagree. | Skill, `docs/paragraph-platform-surfaces.md`, and this lane's own notes. A lane starting from the skill alone gets the old flow. |
| 5 | Every draft path depends on a sign-in or on the agent. | The Paragraph MCP is signed out now. The in-app agent is stopped except where you lift it, and on 31 Oct it edited published Day 246 from a Create new click on Day 304. |
| 6 | The LinkedIn first comment is manual, and an update can erase it. | Measured 31 Oct: `update-content` removes `body.firstComment` with no error. Whether `create-content` keeps it is untested. |
| 7 | No check compares a social to the edition. | This lane's read of the 31 Oct agent drafts: LinkedIn had links in the body and the X post misdated a quote. The existing checks cover the tweet length, slots and em dashes only. |
| 8 | Nothing records what went out where. | No file in this repo says which channels carried an edition. So "as much as possible" cannot be measured, and a repeat post cannot be caught. |
| 9 | Results by channel are unread. | `docs/paragraph-best-practices-2026-10-31.md` row 1: no record of anyone reading the Campaigns tab, which reports clicks and signups by send. |

## The channels

| Channel | How it goes | Your step |
|---|---|---|
| X post | Paragraph draft in the edition's group | Publish |
| X Article | Paragraph draft in the group | Publish |
| LinkedIn | Paragraph draft, no link in the body | Publish, then the first comment if the test in step 2 fails |
| Farcaster | Printed for Firefly | Paste, Farcaster only, so X is not hit twice |
| Telegram, Discord, Facebook, group chats | Paragraph cannot send these. See the next section | One tap or one paste each |

## The channels Paragraph cannot send

Zaal, grill item 54: "lets resaerch best practices to make it easiest for us mayhbe we can use the zen browser for that". The rule for all of them is the same as for the rest: the tool fills, Zaal sends. Each block on the printed page gets a Copy button and, where the channel has one, a link that opens it with the text already in.

| Channel | Easiest way, by the sources below | Recommendation |
|---|---|---|
| Telegram | A share link, `t.me/share/url?url=...&text=...`, opens Telegram with the link and text filled in. Telegram then asks the user to pick the chat, group or channel, and the text can still be edited. A bot could post instead: `sendMessage` takes a group or a channel `@username`, up to 4096 characters, with link previews, and The ZAO already runs bots. | Share link now. One tap, pick the group, send. A bot that posts is a send, so it only comes in on his word. |
| Discord | No share link. A channel webhook posts with no bot and no login, up to 2000 characters, but its URL is the credential and anyone holding it can post. | Copy and paste now. A webhook for the one announcements channel later, on his word, run by a command he types after reading the text. Its URL is stored as a secret, never in this repo. |
| Facebook | The posting API covers Pages only, through a Page token and Facebook Login. It says nothing about personal profiles, where the family and IRL friends audience is. The Share Dialog fills in the link but has no field for text. | A share link that opens Facebook with the edition link, then he pastes the text. If the audience is ever a Page, the API is the route, and that needs an app. |
| X group chat | The API can post into an existing group DM, but it needs an approved developer account and his own sign-in. | Copy and paste. The setup costs more than the paste it saves. |
| Farcaster group chat | Not checked: no source fetched. UNVERIFIED. | Copy and paste. |

**Zen.** Zen is already his everyday browser, with one Chromium profile kept for agents, per the browser decision of 26 Aug. That decision says Claude in Chrome runs only on Chromium. This lane did not re-check that today. So no agent drives Zen, and a browser automation that fills and never sends would run in that Chromium profile, not in Zen. Where Zen does help:
- A **Socials workspace** with Telegram, Discord, Facebook and the two group chats pinned. The share links above open there.
- **Containers.** A workspace can have a default container, and a container keeps its own logins. So the ZAO accounts stay signed in apart from his personal ones, in one profile. Containers do not separate history or extensions.

A link opened from the printed page can land outside that workspace. Opening Zen with the workspace already selected avoids that, and a page that opens links in a set container would need a Firefox add-on. Neither was tested here, since the load hold rules out any browser run.

**What his posting looks like after this.** He publishes the edition, runs one command, reads three drafts in Paragraph and presses Publish on each. Then, in the Zen Socials workspace, from top to bottom: Farcaster in Firefly, Telegram by one tap, Discord by paste, Facebook by one tap plus a paste, and the two group chats by paste. Each block is short and ready, and nothing goes out without his press.

**Sources, fetched 2026-11-01:**
- core.telegram.org/widgets/share, FULL.
- core.telegram.org/bots/api, the `sendMessage` section, FULL. It was read from the saved page, since the fetch tool stopped at 200,000 of 582,000 characters.
- docs.discord.com/developers/resources/webhook, FULL. It does not cover announcement channels.
- developers.facebook.com/docs/sharing/reference/share-dialog, FULL.
- developers.facebook.com/docs/pages-api/posts, FULL.
- docs.x.com/x-api/direct-messages/manage/introduction, FULL.
- docs.zen-browser.app/user-manual/workspaces, FULL.
- docs.paragraph.com/llms.txt and agent/connections.md, FULL. Telegram there is only a chat with Paragraph's agent, and there are no publish webhooks.

**UNVERIFIED:** Farcaster group chats, Facebook's plain sharer link (only the Share Dialog was read), whether the Share Dialog needs an app id, and the Chromium-only claim, which comes from the 26 Aug decision.

## What gets built, in order

1. **Fix the tool (one PR).** Find the key from a setting at runtime, with no local path in the code. Remove the LinkedIn link and the Firefly-to-X overlap. Add tests on the existing `automation/test-stage-socials.py`.
2. **Test the first comment, on your word.** Create one throwaway LinkedIn draft with `body.firstComment`, read it back, archive it. Nothing is sent. If it survives, the comment stops being a paste, and the tool never runs an update after it.
3. **Write the drafts through the API.** Bucket, then `POST /v1/content` for the three drafts. This endpoint only drafts, per `developers/content.md`. It runs on the key at runtime, so no sign-in is needed if the key has write access. **That is unproven:** the only read so far is of a post that may be readable with no key.
4. **Add the fact check.** Every number, date, handle and quote in a social must appear in the live edition, or the tool refuses and names the line.
5. **Record each run** in `published/` beside the edition: draft ids, channels, and what you published, read back from the API.
6. **Replace the skill's old flow** with this, so a fresh lane gets one answer. The skill lives in the dotfiles repo, so that is a separate PR.
7. **Run it on Day 304 and Day 305.** Day 304 has three agent drafts from 31 Oct in Paragraph. This lane reads them first, then updates or archives them so nothing is doubled. The archive is your tap if the tool cannot read them. Day 305 runs only after it publishes.
8. **After two editions, read Campaigns** and drop any channel that earns nothing.

## What this does not do

It posts nothing. It does not schedule. It does not make covers: the API takes no media on a social draft, so an X or LinkedIn image other than the article's own is set in the app, and `/zabal-cover` stays as it is. Effects on reach are not measured, and no row here has a base rate.

## The one question

May the Telegram and Discord blocks ever send by themselves, through a ZAO bot or a channel webhook, after you read them and type one command?

**Default if you do not answer: no.** Every channel gets its block on the printed page, with a share link where one exists, and nothing sends but your own press. Days 304 and 305 go out that way. This replaces the earlier question, which was whether to include these channels. Item 54 asks for the easiest way to reach them, so they are in.

## Sources

Read 2026-11-01: `automation/stage-socials.py`, the socials skill, `docs/paragraph-platform-surfaces.md`, `docs/paragraph-agent-workflow.md`, `docs/paragraph-best-practices-2026-10-31.md`, the public posts API (last 40), the 31 Oct grill items 1, 5, 6 and 47, and Zaal's earlier rulings as this lane holds them. Not read: Paragraph's Content tab and Campaigns tab, and the Day 304 drafts themselves today, since the MCP is signed out.
