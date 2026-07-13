#!/usr/bin/env bash
# One command, one answer: "what needs my attention to post more right now."
# For every file in drafts/, shows voice-check pass/fail, whether it's been
# pushed to Paragraph as a draft yet, and whether it's actually gone live
# (needs archiving). Replaces manually cross-checking drafts/, post-ids.json,
# and the Paragraph dashboard by hand.
#
# Usage: automation/status.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MAP_FILE="$SCRIPT_DIR/post-ids.json"

NEVER_PUSHED=()
NEEDS_ARCHIVING=()

for FILE in "$REPO_ROOT"/drafts/*.md; do
  [ -f "$FILE" ] || continue
  REL_PATH="drafts/$(basename "$FILE")"
  echo "=== $REL_PATH ==="

  if "$SCRIPT_DIR/check-voice.sh" "$FILE" >/dev/null 2>&1; then
    echo "voice: ok"
  else
    echo "voice: FAILS - run automation/check-voice.sh $REL_PATH for detail"
  fi

  POST_ID=$(python3 -c "
import json, sys
try:
    with open('$MAP_FILE') as f:
        data = json.load(f)
    print(data.get('$REL_PATH', ''))
except FileNotFoundError:
    print('')
" 2>/dev/null)

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

echo "=== summary ==="
echo "${#NEVER_PUSHED[@]} draft(s) not yet pushed to Paragraph."
echo "${#NEEDS_ARCHIVING[@]} post(s) live and waiting to be archived."
