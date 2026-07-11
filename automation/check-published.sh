#!/usr/bin/env bash
# Check every tracked draft against Paragraph's real status - flags any
# that have actually been published so they can be archived. Uses the
# public get-post-by-id endpoint (no auth needed): a published post
# resolves, a draft returns "Post not found" since drafts aren't
# publicly visible by design.
#
# Usage: check-published.sh [post-ids-file]

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MAP_FILE="${1:-$SCRIPT_DIR/post-ids.json}"

if [ ! -f "$MAP_FILE" ]; then
  echo "No post-ids.json found at $MAP_FILE - nothing tracked yet." >&2
  exit 1
fi

ENTRIES=$(python3 -c "
import json
with open('$MAP_FILE') as f:
    data = json.load(f)
for file_path, post_id in sorted(data.items()):
    print(file_path + '|' + post_id)
")

ANY_PUBLISHED=0

while IFS='|' read -r FILE_PATH POST_ID; do
  [ -z "$FILE_PATH" ] && continue

  RESPONSE=$(curl -sS "https://public.api.paragraph.com/api/v1/posts/${POST_ID}")
  FOUND=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print('yes' if d.get('id') else 'no')" 2>/dev/null || echo "no")

  FULL_PATH="$REPO_ROOT/$FILE_PATH"
  ALREADY_ARCHIVED="no"
  [ -f "$REPO_ROOT/published/$(basename "$FILE_PATH")" ] && ALREADY_ARCHIVED="yes"

  if [ "$FOUND" = "yes" ] && [ "$ALREADY_ARCHIVED" = "no" ]; then
    echo "PUBLISHED, needs archiving: $FILE_PATH ($POST_ID)"
    echo "  run: automation/archive-issue.sh $FILE_PATH"
    ANY_PUBLISHED=1
  elif [ "$FOUND" = "yes" ] && [ "$ALREADY_ARCHIVED" = "yes" ]; then
    echo "published, already archived: $FILE_PATH"
  else
    echo "still draft: $FILE_PATH"
  fi
done <<< "$ENTRIES"

if [ "$ANY_PUBLISHED" -eq 1 ]; then
  echo
  echo "At least one tracked draft is now live and needs archiving - see above."
fi
