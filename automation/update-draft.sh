#!/usr/bin/env bash
# Update an existing Paragraph post's title + content by ID. Companion to
# create-draft.sh - built after a manual one-off curl was needed to fix
# the Day 191 draft in place instead of creating a duplicate.
#
# Note: Paragraph's update endpoint does not return a status field, so
# unlike create-draft.sh this cannot re-confirm status=draft after the
# call. Only use this on a post you already know is a draft - never on
# one you haven't verified.
#
# Usage: automation/update-draft.sh <post-id> <drafts/file.md> [title] [--force]

set -euo pipefail

POST_ID="${1:?usage: update-draft.sh <post-id> <markdown-file> [title] [--force]}"
FILE="${2:?usage: update-draft.sh <post-id> <markdown-file> [title] [--force]}"
shift 2

TITLE=""
FORCE=0
for ARG in "$@"; do
  case "$ARG" in
    --force) FORCE=1 ;;
    *) TITLE="$ARG" ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -z "${PARAGRAPH_API_KEY:-}" ] && [ -f "$REPO_ROOT/.env" ]; then
  set -a
  source "$REPO_ROOT/.env"
  set +a
fi

if [ -z "${PARAGRAPH_API_KEY:-}" ]; then
  echo "PARAGRAPH_API_KEY not set. Put it in .env (gitignored) at the repo root." >&2
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

CHECK_VOICE="$SCRIPT_DIR/check-voice.sh"
CHECK_LINKS="$SCRIPT_DIR/check-links.sh"

if [ "$FORCE" -eq 0 ] && [ -x "$CHECK_VOICE" ]; then
  if ! "$CHECK_VOICE" "$FILE"; then
    echo "Voice check failed - fix the draft or rerun with --force to push anyway." >&2
    exit 1
  fi
  echo
fi

if [ "$FORCE" -eq 0 ] && [ -x "$CHECK_LINKS" ]; then
  if ! "$CHECK_LINKS" "$FILE"; then
    echo "One or more links in this draft are dead - fix them or rerun with --force to push anyway." >&2
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
print(json.dumps({"title": title, "markdown": markdown}))
PY
)

RESPONSE=$(curl -sS -X PUT "https://public.api.paragraph.com/api/v1/posts/${POST_ID}" \
  -H "Authorization: Bearer ${PARAGRAPH_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$RESPONSE"

SUCCESS=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success', False))" 2>/dev/null || echo "False")

if [ "$SUCCESS" != "True" ]; then
  echo "WARNING: response did not confirm success. Check the response above." >&2
  exit 2
fi

echo "Post ${POST_ID} updated. This does not change its publish status - verify that separately if unsure."
