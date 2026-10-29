# Paragraph beyond the MCP: CLI, REST API, X Articles, LinkedIn

Researched 2026-10-29 from real fetches only. Every claim below cites the URL it came
from, and each URL is marked FULL (read in full), PARTIAL (read in part) or FAILED.
Nothing here was run against the publication except where it says so.

## The short version

- **There is an official Paragraph CLI.** It is the npm package `@paragraph-com/cli`,
  and its binary is called `paragraph`. On 2026-10-29 it was at version 0.5.0,
  published 2026-10-24, and its maintainers are Paragraph staff. It is not installed on
  this Mac: there is no `paragraph` on PATH, no `paragraph` Homebrew formula, and
  nothing in `npm -g`.
  - Why an earlier check missed it: a plain npm search for "paragraph cli" does not
    surface the scoped package in its top 20 results (it returns tiptap and editor.js
    extensions instead). The package only shows up when you fetch it by name.
- **The CLI, the REST API, the TypeScript SDK and the MCP all cover the same
  ground.** The docs say the CLI "covers the same ground as the REST API". The MCP we
  already use exposes the same post, content and bucket calls.
- **Every X Article, LinkedIn post and X post drafted through the API only drafts.**
  Sending happens in the Paragraph app, under Content.
- **An X Article needs X Premium on the connected X account.** Without Premium, the
  Article stays a draft. Once an Article is published it cannot be edited or taken down
  from Paragraph.
- **LinkedIn link placement.** When a LinkedIn post is made from a Paragraph article,
  Paragraph puts the article link in the first comment, not the post body, because
  LinkedIn shows posts with links to fewer people.
  - Our standing rule is that every social carries the full link in the text. That
    rule conflicts with this default, and Zaal has not ruled on it.

## Sources

| URL | Status | What it gave |
|---|---|---|
| https://docs.paragraph.com/llms.txt (paragraph.com/docs redirects to docs.paragraph.com) | FULL | Index of every guide and API endpoint |
| https://docs.paragraph.com/developers/cli.md | PARTIAL (first 60 lines) | Install, sign-in, post commands |
| https://raw.githubusercontent.com/paragraph-xyz/paragraph-cli/main/README.md | FULL | Every CLI command and flag quoted below |
| https://docs.paragraph.com/developers/content.md | FULL | Content kinds, bodies, buckets, errors |
| https://docs.paragraph.com/distribute/x-articles.md | FULL | X Article rules |
| https://docs.paragraph.com/distribute.md | FULL | X post, LinkedIn and grouping behaviour |
| https://docs.paragraph.com/agent/connections.md | PARTIAL (grep for X and LinkedIn) | Connecting accounts |
| https://registry.npmjs.org/@paragraph-com%2fcli | FULL | Version, bin, repo, maintainers |
| https://registry.npmjs.org/@paragraph-com%2fsdk | FULL | SDK 2.6.0, 2026-10-27 |
| https://registry.npmjs.org/@paragraph-com%2fmcp | FULL | MCP 1.8.2, 2026-10-24, bin `paragraph-mcp` |
| https://registry.npmjs.org/-/v1/search?text=paragraph%20cli | FULL | Top 20 results; the CLI is not among them |
| https://api.github.com/orgs/paragraph-xyz/repos | FULL | Repos `paragraph-cli`, `paragraph-mcp`, `paragraph-sdk-js`, `api-docs`, `skill`, `homebrew-tap` |
| https://raw.githubusercontent.com/paragraph-xyz/homebrew-tap/main/README.md | FAILED (404) | The tap repo exists, but it has no README at that path |

## The CLI

Install is one of two commands, both from the README:

- npm: `npm install -g @paragraph-com/cli` (needs Node 18 or later)
- Homebrew: `brew tap paragraph-xyz/tap && brew install paragraph`

Sign-in options, also from the README:

- `paragraph login` opens the browser.
- `paragraph login --token <key>` takes the API key directly.
- `paragraph login --with-token` reads the key from stdin.
- Setting `PARAGRAPH_API_KEY` per command skips login entirely.
- Credentials are stored in `~/.paragraph/config.json` with mode 0600.
- `paragraph whoami` shows which publication you are signed in to.

Commands that matter to this repo, copied from the README:

- Posts:
  - `paragraph post list --status draft`
  - `paragraph post get <id|url|@pub/slug> --field markdown`
  - `paragraph post create --title ... --file ./draft.md`
  - `paragraph post update <id-or-slug> --file ...`
  - `paragraph post test-email <id>`
  - `paragraph post publish <id-or-slug> [--newsletter] [--dry-run]`
  - Also: `draft`, `archive`, `delete --yes`
- Content:
  - `paragraph content create --kind tweet|linkedin|newsletter|x_article`
  - Body flags: `--text`, `--file`, stdin, `--tweet` (repeat it for a thread), `--headline` and `--canonical-url` for an Article, `--subject` and `--preheader` for a newsletter, `--body-json-file` for a rich newsletter
  - Lifecycle: `content list`, `content get <id> --field body`, `content update`, `content archive`, `content restore`
- Content groups:
  - `paragraph content bucket create <post-id>` is safe to repeat.
  - `paragraph content create ... --bucket <bucket-id>` drafts into a group.
  - `paragraph content bucket for-post <post-id>` reads a post's group.
- Scripting:
  - Every command takes `--json`. Data goes to stdout and errors go to stderr as structured JSON.
  - Set `PARAGRAPH_NON_INTERACTIVE=1` or `CI=true` to turn off the TUI.

What the CLI adds over the MCP, per the README:

- `--dry-run` on publish and delete
- `post get --field markdown`, which pipes a post body straight to a file
- `post get` accepts a URL or `@thezao/slug`
- Subscriber CSV import

It does not unlock anything the API cannot already do. Media still cannot be attached
to social drafts.

**Do not install it or log in without Zaal's say.** A login stores the publication's API
key on disk, and this repo's rule is that keys are injected at runtime only. Using
`PARAGRAPH_API_KEY` per command, as the README documents, would keep the key off disk.

## The REST API, in brief

The base URL is `https://public.api.paragraph.com/api/v1`, and requests carry a
Bearer API key (developers/content.md). These are the parts we touch:

- **Posts.**
  - Create defaults to **published** on the raw API unless `status: "draft"` is set.
  - `scheduledAt` can be at most 30 days out. Pass `scheduledAt: null` to unschedule.
  - Updating a live post needs `status: "published"` in the request, or the update
    can unpublish it.
  - `imageUrl` on update fetches and re-hosts a cover image.
  - These rules are from llms.txt.
  - The MCP `create-post` defaults to draft, so this does not bite us today. It would
    bite a raw `curl`.
- **Content.**
  - `POST /v1/content` creates a draft and never sends it.
  - Drafts created this way are text only.
  - Unknown fields are rejected with a 400.
  - Editing a piece that already has a send queued is refused.
- **Buckets (content groups).**
  - `POST /v1/posts/{postId}/bucket` is idempotent.
  - `GET /v1/buckets/{id}` lists the group's members.
  - Taking a piece out of a group can only be done in the app.

## X Articles (distribute/x-articles.md)

- **Premium:** X Premium is required on the connected X account. Without it the Article
  stays a draft, and Paragraph offers a thread instead.
- **Formatting that carries over:**
  - Two heading levels
  - Bold, italic and strikethrough
  - Code blocks, tables and quotes
  - Lists, horizontal rules and links
  - Images, inline and the cover
- **Formatting that is dropped:**
  - Video and GIFs
  - Embedded posts
  - Raw HTML
  - Footnotes
- **Cover:** Use Add cover, Change cover or Remove cover on the draft in the app. An Article
  drawn in the app from one of your articles opens with that article's cover and a closing
  link back to it. An API draft is text only, so its cover is added in the app.
- **Publishing:** You publish now or schedule on the Calendar. What you approve is what
  goes out, word for word. **Once published, an Article cannot be edited or removed from
  Paragraph.**

## LinkedIn and X posts (distribute.md)

- A LinkedIn post made from an article uses the article's cover as its image.
  - The link goes in the **first comment**, posted from the same account.
  - The comment only goes up if the article is live by the time the post goes out.
- An X post that links one of your articles shows a link card built from the article's
  title and cover.
- A post cannot be approved until its account is connected (Connectors, then
  Accounts).

## Which socials the Paragraph app can send itself

Zaal ruled on 2026-10-29: "socials through paragraph app".

Sources:
- distribute.md, distribute/calendar.md and agent/connections.md, all FULL.
- https://docs.paragraph.com/llms-full.txt, FULL, 161 KB. It contains no mention of
  Farcaster or Warpcast.

| Channel | Paragraph sends it? | What it needs |
|---|---|---|
| X post or thread | Yes | A connected X account (Connectors, then Accounts) |
| X Article | Yes | A connected X account with X Premium |
| LinkedIn post | Yes | A connected LinkedIn account |
| Email to subscribers | Yes | Nothing extra; the newsletter already does this |
| Farcaster cast | **No** | Not in the docs at all. It stays on Firefly or Farcaster. |
| Telegram | **No** | Telegram is only a chat channel for talking to Paragraph's agent, not a place it posts |
| Discord, Facebook, the group chats | **No** | Not in the docs |

The X and LinkedIn accounts are already connected, and X Premium works. Evidence from
`list-content` on 2026-10-29: the X Article `b97bd0e9-510f-476a-8cfa-174ca793b1fe`
published to `x.com/bettercallzaal/status/2115013758443806919` on 2026-10-27, and the
LinkedIn post `8361dcec-86f8-418f-827f-1cb807d74927` published on 2026-10-27.

**Firefly overlap.** Firefly posts to both Farcaster and X. If the X post goes out
through Paragraph, the same text sent through Firefly lands on X twice. So the cast goes
to Farcaster only.

**Sending a draft.** Each draft has Publish, or Schedule next to Publish. Picking a time
with Schedule approves it.

## How we run Day N distribution with this

1. `create-post-content-bucket` on the published post.
2. `create-content` with that `bucketId`:
   - `x_article`: `body.title` is the headline. The `canonicalUrl` must also appear as a markdown link inside the body.
   - `linkedin`: `text` carries the full paragraph.com link, per our rule.
   - `tweet`: the X post, with the full link.
   - The Farcaster cast, the group chats, Telegram, Discord and Facebook still come from the `/socials` clipboard.
3. Zaal opens app.paragraph.com, then Content, then the post's row. There he reviews
   both drafts in the preview, adds the cover if he wants one, and presses Publish.
   - That tap is his. The X Article step needs X Premium on the connected account.
4. Nobody opens X's own composer.

Example, 2026-10-29: Day 302 has bucket `d7f574a9-36a1-4b45-946e-c2bd8840d70e` with
three drafts in it:

- X Article `fa08550b-20a5-4e24-a9c5-8fb20ba2bac5`
- LinkedIn post `c5f89b4d-3c91-429d-ac6a-9dbf7891fc80`
- X post `a72b7866-1c0e-4776-9fc8-685a6d8fc478`

All three are drafts.

## Open questions for Zaal

- **LinkedIn link:** in the body, which is our rule, or in the first comment, which is
  Paragraph's default for posts made from an article?
- **CLI:** install it, using `PARAGRAPH_API_KEY` per command so no key is stored on
  disk? Or keep the MCP only?
