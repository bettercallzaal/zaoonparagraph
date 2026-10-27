# Working with the Paragraph agent

How The ZAO newsletter uses Paragraph's built-in agent (app.paragraph.com, the chat beside each post), the rules that came out of the first week, and the one incident that set them. Started 2026-10-27.

## What the agent is used for

The edition itself is written and fact-checked outside the agent, then entered in the Paragraph editor. The agent is used after that, to turn a finished edition into its social versions:

- an X article, posted by Paragraph to @bettercallzaal (Day 299 and Day 300 both went out this way);
- a LinkedIn post, drafted by the agent. Posting it through the agent failed on 2026-10-26 and 2026-10-27 with "account couldn't be selected", even after reconnecting, so it was posted by hand.

The full paragraph.com/@thezao/<slug> link goes in the body of every social version, LinkedIn included.

## Rules

1. **Never use an agent chat that is attached to a scheduled post.** Social drafts get made in their own chat. An instruction like "add them to the top" can land in the post body instead of the chat panel.
2. **Re-read every scheduled post about five minutes before it sends.** Compare it against the approved text. If anything changed, or anything is unsure, cancel the schedule and look. A 200 from the live URL is not a check; read the content.
3. **No notes in the post.** Nothing in square brackets, no fill-in markers, no notes to the author, ever, in a title, subtitle or body. Asks go to the author outside Paragraph. Scan for `[` before every write.
4. **Check the live page after it publishes**, by reading the body, not the status code.
5. **The agent's review suggestions are suggestions.** "Substantiate the split" on Day 300 was already sourced (the WaveZStation song data carries the 45/45/10 split). Approve nothing without reading it.

## Editor facts learned the hard way

- The new editor (app.paragraph.com/thezao/content/<id>) could not push an edit to an already-published post. The edit landed on a separate copy that still showed "Scheduled".
- The classic editor (paragraph.com/editor/<postId>) could. Editing a published post there creates a pending update. Its publish screen showed only "Publish online" (no email option). Publishing it updated the web page and gave the post a new id.
- Scheduling does not lock a post. Paragraph sends whatever the post says at send time.

## Incident, 2026-10-27 (Day 300)

The Day 300 edition was scheduled for 05:30 ET with its cover and approval. Before send, the agent was asked in the post's own chat to show the X and LinkedIn drafts "at the top". It wrote both drafts into the scheduled post body. Nothing re-read the body before send, so the email went to all 583 subscribers with an "X Article Draft" and a "LinkedIn Post Draft" section on top. The web version was corrected at about 05:45 ET through the classic editor; the email could not be recalled. Day 301 tells readers what happened. Rules 1, 2 and 4 above exist because of it.
