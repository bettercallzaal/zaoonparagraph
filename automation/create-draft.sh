#!/usr/bin/env bash
# Push a markdown file to Paragraph as a DRAFT via the public API.
# Never publishes, never sends the newsletter, never schedules.
# Runs check-voice.sh first and refuses to push if a hard rule fails.
#
# Usage: automation/create-draft.sh <drafts/file.md> [title] [--force]
# Title is optional - if omitted, derived from the file's "# Heading" line.
# The file can be the raw drafts/ file (with its "# Title" line) or a
# body-only file - either way the H1 line is stripped before posting.
# --force skips the voice check (use only when you've reviewed it yourself).

set -euo pipefail

FILE="${1:?usage: create-draft.sh <markdown-file> [title] [--force]}"
shift

TITLE=""
FORCE=0
for ARG in "$@"; do
  case "$ARG" in
    --force) FORCE=1 ;;
    *) TITLE="$ARG" ;;
  esac
done

if [ -z "${PARAGRAPH_API_KEY:-}" ]; then
  echo "PARAGRAPH_API_KEY not set. Put it in .env (gitignored) and source it, or export it in your shell." >&2
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_VOICE="$SCRIPT_DIR/check-voice.sh"

if [ "$FORCE" -eq 0 ] && [ -x "$CHECK_VOICE" ]; then
  if ! "$CHECK_VOICE" "$FILE"; then
    echo "Voice check failed - fix the draft or rerun with --force to push anyway." >&2
    exit 1
  fi
  echo
fi

if [ -z "$TITLE" ]; then
  TITLE=$(grep -m1 '^# ' "$FILE" | sed 's/^# //')
  if [ -z "$TITLE" ]; then
    echo "No title given and no '# Heading' line found in $FILE - pass a title explicitly." >&2
    exit 1
  fi
fi

MARKDOWN=$(python3 - "$FILE" <<'PY'
import sys
with open(sys.argv[1]) as f:
    lines = f.readlines()
lines = [l for l in lines if not l.startswith("# ")]
while lines and lines[0].strip() == "":
    lines.pop(0)
print("".join(lines), end="")
PY
)

PAYLOAD=$(python3 - "$TITLE" "$MARKDOWN" <<'PY'
import json, sys
title, markdown = sys.argv[1], sys.argv[2]
print(json.dumps({
    "title": title,
    "markdown": markdown,
    "status": "draft",
    "sendNewsletter": False,
}))
PY
)

RESPONSE=$(curl -sS -X POST "https://public.api.paragraph.com/api/v1/posts" \
  -H "Authorization: Bearer ${PARAGRAPH_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$RESPONSE"

STATUS=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "unknown")

if [ "$STATUS" != "draft" ]; then
  echo "WARNING: Paragraph did not return status=draft (got: $STATUS). Check the response above before trusting this ran safely." >&2
  exit 2
fi

POST_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")
if [ -n "$POST_ID" ]; then
  MAP_FILE="$SCRIPT_DIR/post-ids.json"
  python3 - "$MAP_FILE" "$FILE" "$POST_ID" <<'PY'
import json, os, sys
map_file, file_key, post_id = sys.argv[1], sys.argv[2], sys.argv[3]
data = {}
if os.path.exists(map_file):
    with open(map_file) as f:
        data = json.load(f)
data[file_key] = post_id
with open(map_file, "w") as f:
    json.dump(data, f, indent=2, sort_keys=True)
    f.write("\n")
PY
  echo "Recorded post id in automation/post-ids.json"
fi

echo "Draft created on Paragraph. Status confirmed: draft. Go publish it yourself when ready."
