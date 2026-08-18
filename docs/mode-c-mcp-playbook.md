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
