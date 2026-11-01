# The ZAO Desk

Zaal, on this repo: "Revamp UI so I can do everything through the dashboard instead of through my terminal."

One page over the jobs that used to be commands. It runs the scripts in `automation/` and shows what they printed, so the rules stay in one place. Node built-ins only, no npm and no build. Needs Node 20 or later, plus what the scripts already need: bash, python3, curl and git. `gh` for Open PR and Collect wins.

## Start it

Put this in the gitignored `.env` at the repo root, then run it:

```bash
DASHBOARD_PASSWORD=<12 characters or more>
PARAGRAPH_API_KEY=<the key you already use>
```

```bash
node dashboard/server.mjs      # http://127.0.0.1:4173
```

It comes up as a **dry run**: nothing reaches Paragraph or GitHub, and every such button prints what it would do. When you trust it, add `DASHBOARD_LIVE=1` and restart.

## Env

| Name | Needed | What |
|---|---|---|
| `DASHBOARD_PASSWORD` | Yes | The owner's password. The server refuses to start without 12 characters or more |
| `PARAGRAPH_API_KEY` | For Paragraph writes, analytics and socials | Same key as the scripts |
| `DASHBOARD_LIVE` | No | `1` lets writes reach Paragraph and GitHub. Anything else is a dry run |
| `DASHBOARD_HOST`, `DASHBOARD_PORT` | No | Default `127.0.0.1:4173` |
| `DASHBOARD_ALLOWED_HOSTS` | Past localhost | Comma-separated names you will type in the browser. Others get a 421 |
| `DASHBOARD_SECURE_COOKIE` | With TLS | `1` marks the session cookie Secure |
| `CANVA_ZABAL_DESIGN_URL` | No | Where Open Canva goes. Treat it as a secret, per the zabal-cover skill |
| `DASHBOARD_BASH`, `DASHBOARD_PYTHON` | No | If `bash` or `python3` are not those names on the PATH |

## From a phone

The server has to run where the repo and the scripts are, so a hosted Vercel function is not a drop-in: it has no checkout to write and no promise of bash or python3. To use it from a phone, run it on the Mac or a box you own and reach it over a private network such as Tailscale: `DASHBOARD_HOST=0.0.0.0`, `DASHBOARD_ALLOWED_HOSTS=<that machine's name>`. Do not put it on the open internet without TLS in front. `.vercelignore` keeps this folder out of the public site.

## Safety

- Every `/api` route needs a session, except sign in and the session check. Sessions are random, kept in memory, HttpOnly and SameSite=Strict, and last 12 hours. Five wrong passwords lock that address for 15 minutes.
- Writes need a same-origin request and a custom header. An unknown Host is refused.
- Jobs are a fixed list. Each spawns one program with an argument list, never a shell string. Paths are checked against the folder each job may touch. `published/` and `drafts/archive/` are read only in the editor.
- Every write needs the confirm step, and the server re-checks it. Publish, schedule and cancel need a typed word.
- The key never reaches the page: it stays in the server's environment, and script output has it scrubbed.
- Update draft and Set cover are refused on a live post, since an update without `status: "published"` can unpublish it.
- Commit only takes files in `drafts/`, `published/` and `automation/post-ids.json`. Push refuses `main`.

## Jobs

| Terminal job | On the page |
|---|---|
| `check-voice.sh`, `check-links.sh` | Editor, step 1 |
| `make-agent-paste.sh` | Editor, step 1 |
| New file from `templates/`, day number by hand | Today or Editions, New draft |
| Zabal-cover skill: day number, attach the Canva download | Editor, step 2 |
| `render-thumbnail.sh` | Editor, step 2, Generate. The same template, drawn in the browser. The script is one button below it, if its browse tool is on the machine |
| `set-thumbnail.sh` | Editor, step 2 |
| `create-draft.sh`, `update-draft.sh`, hand edits to `post-ids.json` | Editor, step 3 |
| `publish-post.sh` (new): publish, schedule, cancel, test email | Editor, step 4 |
| `record-edition.py` (new), `archive-issue.sh` | Today, The record panel, and editor step 5 |
| `stage-socials.py`, `check-social-facts.py` | Socials |
| `analytics.sh` and `--sql` | Numbers |
| `status.sh`, `test-all.sh`, `check-published.sh`, self-tests, `collect-wins.sh` | Today and Jobs |
| `git commit`, `push`, `gh pr create` | Jobs, Save to GitHub |

Still outside it: changing the number in Canva, since that drives his Chrome through the zabal-cover skill. The Paragraph MCP flow and the in-app agent, which need Claude or the Paragraph app. Agent paste and Open editor hand off to them. Deleting anything on Paragraph, on purpose.

## Test it

```bash
node --test dashboard/test/dashboard.test.mjs
```

It runs the real server and the real scripts on a throwaway repo, with a fake `curl` in place of the network and a local bare repo in place of GitHub.
