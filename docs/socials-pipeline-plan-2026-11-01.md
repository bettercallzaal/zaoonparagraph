# Newsletter to socials: what breaks today, and one plan

Written 2026-11-01 for Zaal, grill item 47: "i wanna share it out as muhcu as possible but im not confirident in our piplein". Day 304 and Day 305 socials wait on this. Nothing here has been built, sent or posted.

## The plan in one paragraph

When an edition goes live, one command reads the live edition, writes the socials, checks them against it, and puts the X post, X Article and LinkedIn post into Paragraph as drafts grouped with the edition. It prints one short page with the only things Paragraph cannot hold: the Farcaster cast and the LinkedIn first comment. You open Content in Paragraph, read three drafts, press Publish on each, paste the cast into Firefly set to Farcaster only, and paste the comment. Posting stays yours. It uses the existing `automation/stage-socials.py`, the socials skill and the Paragraph content API, and it does not use the in-app agent.

## What breaks or is manual today

| # | Problem | Evidence |
|---|---|---|
| 1 | The socials tool has not been fed since September. It refuses Day 304. | `stage-socials.py` on Day 304, with the key loaded, read 2026-11-01: `REFUSED: no drafts/socials/*-day-304.socials.md`. The newest edition with a socials file in `drafts/socials/` is Day 273. 12 editions from Day 274 to Day 304 have no file, of the last 40 posts the public API listed. |
| 2 | The same tool cannot find the key from a workspace. | With no environment key it prints `CANNOT RUN`. It looks in the repo's `.env` and in `~/Desktop/repos/zaoonparagraph/.env`, and that folder is gone. The `.env` file is in `~/Documents/repos/zaoonparagraph/`. |
| 3 | The tool and the skill still produce what you rejected on 31 Oct. | Eight paste blocks, a link on the end of the LinkedIn body against your first-comment ruling of 29 Oct, and a Firefly post that reaches X alongside an X post from Paragraph, which is the double post from your ruling of 13 Oct. The skill never mentions any of these rulings. |
| 4 | The rulings live in three places that disagree. | Skill, `docs/paragraph-platform-surfaces.md`, and this lane's private memory. A lane starting from the skill alone gets the old flow. |
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
| Telegram, Discord, Facebook, group chats | Paragraph cannot send these (`docs/paragraph-platform-surfaces.md`) | See the question below |

## What gets built, in order

1. **Fix the tool (one PR).** Find the key from the Documents clone or the environment. Remove the LinkedIn link and the Firefly-to-X overlap. Add tests on the existing `automation/test-stage-socials.py`.
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

Telegram, Discord, Facebook and the group chats: a short line for each on the printed page, or leave them out?

**Default if you do not answer: leave them out for Day 304 and Day 305**, keep X, X Article, LinkedIn and Farcaster, and review after step 8. You said you want it shared as much as possible and also did not want a paste list, so those two pull apart here. Adding them later is one flag.

## Sources

Read 2026-11-01: `automation/stage-socials.py`, the socials skill, `docs/paragraph-platform-surfaces.md`, `docs/paragraph-agent-workflow.md`, `docs/paragraph-best-practices-2026-10-31.md`, the public posts API (last 40), vault `decisions/grill-2026-10-31-misc-afternoon.md` items 1, 5, 6 and 47, and this lane's feedback memories. Not read: Paragraph's Content tab and Campaigns tab, and the Day 304 drafts themselves today, since the MCP is signed out.
