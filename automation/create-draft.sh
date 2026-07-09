#!/usr/bin/env bash
# Push a markdown file to Paragraph as a DRAFT via the public API.
# Never publishes, never sends the newsletter, never schedules.
# Usage: automation/create-draft.sh drafts/2026-07-09-day-190.md "Year of the ZABAL - Day 190"

set -euo pipefail

FILE="${1:?usage: create-draft.sh <markdown-file> <title>}"
TITLE="${2:?usage: create-draft.sh <markdown-file> <title>}"

if [ -z "${PARAGRAPH_API_KEY:-}" ]; then
  echo "PARAGRAPH_API_KEY not set. Put it in .env (gitignored) and source it, or export it in your shell." >&2
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

MARKDOWN=$(cat "$FILE")

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

echo "Draft created on Paragraph. Status confirmed: draft. Go publish it yourself when ready."
