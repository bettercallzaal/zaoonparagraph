#!/usr/bin/env bash
# One command, one answer: "what needs my attention to post more right now."
#
# Two halves:
#   1. Queued drafts - for every file in drafts/, voice-check pass/fail, whether
#      it has been pushed to Paragraph as a draft, and whether it has gone live.
#   2. Record drift - every edition live on Paragraph that this repo has no
#      record of. This half exists because the first half went quiet: drafts/
#      emptied in July, the script reported "0 drafts, 0 waiting" for six weeks,
#      and six real editions published in that window with nothing in
#      published/. An empty queue is not the same as a healthy repo, and this
#      script must never again imply it is.
#
# Usage: automation/status.sh
# Exit 0 = nothing queued and nothing unrecorded. Exit 1 = live editions are
# missing from the record.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MAP_FILE="$SCRIPT_DIR/post-ids.json"
PUBLICATION_ID="DB7iU1HMVzTT9bI4ec6X"

NEVER_PUSHED=()
NEEDS_ARCHIVING=()
QUEUED=0

echo "=== queued drafts ==="
echo

for FILE in "$REPO_ROOT"/drafts/*.md; do
  [ -f "$FILE" ] || continue
  QUEUED=$((QUEUED + 1))
  REL_PATH="drafts/$(basename "$FILE")"
  echo "--- $REL_PATH ---"

  if "$SCRIPT_DIR/check-voice.sh" "$FILE" >/dev/null 2>&1; then
    echo "voice: ok"
  else
    echo "voice: FAILS - run automation/check-voice.sh $REL_PATH for detail"
  fi

  POST_ID=$(python3 - "$MAP_FILE" "$REL_PATH" <<'PY'
import json, sys
map_file, key = sys.argv[1], sys.argv[2]
try:
    with open(map_file) as f:
        print(json.load(f).get(key, ""))
except FileNotFoundError:
    print("")
PY
)

  if [ -z "$POST_ID" ]; then
    echo "paragraph: not pushed yet - run automation/create-draft.sh $REL_PATH"
    NEVER_PUSHED+=("$REL_PATH")
  else
    RESPONSE=$(curl -sS "https://public.api.paragraph.com/api/v1/posts/${POST_ID}")
    FOUND=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if d.get('id') else 'no')" 2>/dev/null || echo "no")
    if [ "$FOUND" = "yes" ]; then
      echo "paragraph: LIVE (published) - run automation/archive-issue.sh $REL_PATH"
      NEEDS_ARCHIVING+=("$REL_PATH")
    else
      echo "paragraph: pushed, still a draft ($POST_ID) - go publish it at paragraph.com"
    fi
  fi
  echo
done

if [ "$QUEUED" -eq 0 ]; then
  echo "Nothing queued. drafts/ is empty."
  echo "That says nothing about whether the record is current - see below."
  echo
fi

echo "=== record drift (live on Paragraph vs published/ here) ==="
echo

DRIFT_OUTPUT=$(python3 - "$MAP_FILE" "$REPO_ROOT" "$PUBLICATION_ID" <<'PY'
import json, os, sys, urllib.request, urllib.error, datetime

map_file, repo_root, pub_id = sys.argv[1], sys.argv[2], sys.argv[3]

try:
    with open(map_file) as f:
        tracked = set(json.load(f).values())
except FileNotFoundError:
    tracked = set()

# The record starts where published/ starts. The ZAO newsletter has 400+
# editions going back to 2023 and this repo deliberately does not carry them,
# so anything older than the earliest archived edition is out of scope rather
# than drift. With an empty published/ there is no floor and everything counts.
dates = sorted(
    name[:10] for name in os.listdir(os.path.join(repo_root, "published"))
    if name.endswith(".md") and name[:4].isdigit()
) if os.path.isdir(os.path.join(repo_root, "published")) else []
floor = dates[0] if dates else ""

url = ("https://public.api.paragraph.com/api/v1/publications/"
       + pub_id + "/posts?limit=20")
try:
    req = urllib.request.Request(url, headers={"User-Agent": "zaoonparagraph-status"})
    items = json.load(urllib.request.urlopen(req, timeout=20)).get("items", [])
except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
    # Never pass silently: an unreachable API is an unknown record, not a clean one.
    print("UNKNOWN|could not reach Paragraph's public API (" + type(exc).__name__ + ")")
    raise SystemExit(0)

missing = []
in_scope = 0
for post in items:
    published = datetime.datetime.fromtimestamp(
        int(post["publishedAt"]) / 1000, datetime.timezone.utc).strftime("%Y-%m-%d")
    if published < floor:
        continue
    in_scope += 1
    if post.get("id") in tracked:
        continue
    missing.append((published, post.get("id", ""), post.get("title", "")))

print("FLOOR|" + (floor or "none - published/ is empty, every live edition counts"))
print("CHECKED|" + str(in_scope))
for published, post_id, title in missing:
    print("MISSING|" + published + "|" + post_id + "|" + title)
PY
)

DRIFT=0
while IFS='|' read -r KIND A B C; do
  case "$KIND" in
    FLOOR) echo "record starts: $A" ;;
    CHECKED) echo "$A live edition(s) at or after that date checked against automation/post-ids.json." ;;
    UNKNOWN) echo "drift: UNKNOWN - $A" ;;
    MISSING)
      echo "NO RECORD: $A  $C ($B)"
      DRIFT=$((DRIFT + 1))
      ;;
  esac
done <<< "$DRIFT_OUTPUT"

echo
echo "=== summary ==="
echo "${#NEVER_PUSHED[@]} draft(s) not yet pushed to Paragraph."
echo "${#NEEDS_ARCHIVING[@]} post(s) live and waiting to be archived."
echo "$DRIFT live edition(s) with no record in published/."

if [ "$DRIFT" -gt 0 ]; then
  echo
  echo "Editions shipped without landing in this repo. Recover them into" >&2
  echo "published/ and add their ids to automation/post-ids.json." >&2
  exit 1
fi
