# Mode C playbook - driving Paragraph through the MCP

Operational knowledge from the Day 230 finals edition build (2026-08-18), where the
entire edition - text restructure, three inline images, cover, callout, button,
links, two tweet embeds - was assembled without Zaal touching the editor. Everything
below was hit live; nothing is speculation.

The MCP tools are `mcp__paragraph__*` (hosted MCP, browser auth - see ZAOOS doc 429).
The bash scripts in `automation/` remain the batch path; the MCP is the interactive
path and can now do everything they do except thumbnails-from-template.

## The core loop

1. `get-post` with `id: <postId>` (NOT `postId` - the param is `id`, or
   `publicationSlug` + `postSlug`). Read the Tiptap `json`. The `markdown` field is
   LOSSY - embeds and images degrade; never edit from it.
2. Build the full replacement doc json.
3. `update-post` with `id` and `bodyJson` (NOT `json` - a wrong param name is
   silently ignored and the tool answers "No updatable fields were provided").
   `title` updates in the same call.
4. Re-read `get-post` and verify node-by-node before telling anyone it is done.

The concurrency guard fires if the writer edited in the browser after your last
read: re-read, find their change, preserve it, re-apply. Never force.

## Image hosting - the sandbox-path trap and the laundering trick

The Paragraph AI agent (Mode B) will insert attached images as
`src: "/mnt/workspace/uploads/x.jpg"` - ITS OWN sandbox path. The editor renders
them, the published email breaks them. Check every image src for
`storage.googleapis.com/papyrus_images/` before trusting an image.

To get a local file onto Paragraph's real storage without the agent:

1. Upload it as the post's COVER (the hidden file input in the editor side panel -
   find it with the browser tools, never click Upload, which opens a native picker).
2. `get-post` - the `imageUrl` field is now the hosted
   `storage.googleapis.com/papyrus_images/<hash>` URL. Save it.
3. Repeat per image, then upload the REAL cover last.
4. `update-post` writing each `{"type":"image","attrs":{"src":"<hosted url>"}}`.

## USE THE CHAT, NOT THE EDITOR - Zaal's standing rule (2026-09-07)

**Zaal: "dont ever use the editor i want u to use the chat and then look at the editor."**
The editor is for LOOKING. Every change goes through the Paragraph chat.

He is right on the evidence, not just as a preference. Pasting a body into the editor
turned the sign-off into a bulleted list **three separate times**, and each one needed a
manual repair. The chat produced a correct plain-paragraph sign-off **first try**, because
it is told the rule and applies it, where a markdown paste just obeys markdown.

### Getting a long body through the chat

The input submits on Enter, so a multi-paragraph body cannot be typed. It CAN be pasted,
and a paste does not fire the submit. The reliable recipe:

1. Flatten the body to ONE line, replacing every paragraph break with a pilcrow
   character. Assert no newline survives before you continue.
2. Prefix an instruction naming the convention: pilcrow marks a paragraph break, a
   segment starting with `##` is a heading, double asterisks are bold, and the sign-off
   must be a plain paragraph and never a bulleted list.
3. Put the whole thing on the clipboard, click the input **by ref**, `cmd+v`, screenshot
   to confirm the tail arrived, then Return.

Measured 2026-09-07: 48 paragraphs, 6,997 characters, zero newlines, pasted and applied
cleanly with headings, bold and a plain sign-off all correct.

## The chat input swallows messages typed at COORDINATES - use a ref (found 2026-09-06)

Four messages to the Paragraph chat vanished this session: typed, Return pressed, thread
unchanged, input still showing its placeholder, **no error of any kind.** The old playbook
note blamed focus loss after every send. That was not the cause.

**The real cause is that the app resizes its own window between screenshots.** Two
consecutive captures came back 1564x784 then 1565x785, and the chat pane reflows with it.
A coordinate read off the previous screenshot lands a few pixels out - in the message list
instead of the textbox - and typing into a non-input swallows the text silently.

**The fix that works: address the input by element reference, never by coordinate.**

```
find  -> query "the chat message input box"   -> returns e.g. ref_111
computer left_click with ref: "ref_111"       (NOT coordinate)
computer type  ...
screenshot to confirm the text is visibly in the box
computer key Return
screenshot to confirm the send - look for "Mulling it over" or the message in the thread
```

Clicking by ref succeeded on the first try after four coordinate attempts failed. Same
applies to any control in this app: `find` first, click the ref.

Related, and the reason this is so easy to miss: **the chat panel renders a STALE copy of
the post.** After editing the draft in the editor, the chat pane still showed the previous
body, including a Saturday placeholder that had already been replaced. Judge the draft
only from the right-hand editor panel or a `get-post`, never from the chat's echo.

## The signature becomes a bullet on markdown paste (found 2026-09-05)

Pasting an edition's markdown into the editor converts it to rich text correctly for
every node EXCEPT the sign-off. `- BetterCallZaal on behalf of the ZABAL Team` is
valid markdown for a list item, so the editor renders it as a **bulleted list**.

**Every published edition renders it as a plain paragraph with a literal hyphen** -
verified against the live Day 246 post, not from memory. So the paste is wrong and
must be repaired every time.

`Cmd+Shift+V` does NOT fix it - in the Paragraph editor the plain-text paste silently
did nothing and left the line empty.

**What works:**

1. Triple-click the bullet line, `Delete`, then `Backspace` to lift out of the list.
2. Type the text with a LEADING SPACE and no hyphen:
   `" BetterCallZaal on behalf of the ZABAL Team"`.
3. `cmd+Left` to the line start, then type the single character `-`.

The list input rule fires on typing a SPACE after `-`, never on the hyphen itself, so
inserting the hyphen last is what defeats it. Check the rendered line before moving on.

## Tweet embeds

The `twitter` node carries a large `tweetData` blob the editor builds on paste -
do not hand-author it. Two working paths:

- Paragraph AI agent: attach nothing, send one single-line chat message with the
  bare `https://x.com/<user>/status/<id>` URLs and EXACT placement ("directly after
  the callout box in the section X"), plus "do not change any text" and "do not
  publish". Verify placement in `get-post` json after.
- Editor UI: `+` toolbar menu, Embed block, paste URL.

## Node types that work in `bodyJson` (verified on this publication)

`paragraph`, `heading` (levels 1-3, attrs include `textAlign`), `image`,
`horizontalRule`, `callout` (`attrs: {type: "info"}`, renders a boxed info block in
email and web), `customButton` (`attrs: {href}`, content is bold text - renders as a
real button), text marks `bold`, `italic`, `link` (`attrs: {href}`). A wider
catalogue observed across other live publications is in
`paragraph-node-catalogue.md`.

## Mode B chat traps (when the browser agent is unavoidable)

- The chat input LOSES FOCUS after every send. A `type` without a preceding click
  goes nowhere, silently. Click the input, type, SCREENSHOT to confirm the text is
  in the box, then press Return. The screenshot step caught a swallowed message the
  same night this playbook was written.
- The input submits on any newline - messages must be one unbroken line.
- The chat reply is not the draft. Judge only the editor panel or the `get-post`
  json.

## Facts stay gated

The fact gate from the newsletter skill binds in every mode: every number, name,
and handle from a live fetch (`zabalgamez.com/api/submissions?feed=projects` for
counts - `?feed=builders` is a partial view; `zabalgamez.com/data/points-roster.json`
for handles). Publishing is Zaal's, always - the MCP never publishes and every
agent instruction ends "do not publish".
