#!/usr/bin/env bash
# Move a drafts/ file to published/ once Zaal has actually published it on
# Paragraph. Keeps published/ a real archive of the 400+ real editions
# instead of staying permanently empty.
#
# Usage: archive-issue.sh drafts/2026-07-09-day-190.md

set -euo pipefail

DRAFT="${1:?usage: archive-issue.sh <path under drafts/>}"

if [ ! -f "$DRAFT" ]; then
  echo "File not found: $DRAFT" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BASENAME="$(basename "$DRAFT")"
DEST="$REPO_ROOT/published/$BASENAME"

if [ -f "$DEST" ]; then
  echo "Already archived: $DEST" >&2
  exit 1
fi

git -C "$REPO_ROOT" mv "$DRAFT" "$DEST"

MAP_FILE="$REPO_ROOT/automation/post-ids.json"
if [ -f "$MAP_FILE" ]; then
  python3 - "$MAP_FILE" "$DRAFT" "published/$BASENAME" <<'PY'
import json, sys
map_file, old_key, new_key = sys.argv[1], sys.argv[2], sys.argv[3]
with open(map_file) as f:
    data = json.load(f)
if old_key in data:
    data[new_key] = data.pop(old_key)
    with open(map_file, "w") as f:
        json.dump(data, f, indent=2, sort_keys=True)
        f.write("\n")
PY
fi

echo "Archived to published/$BASENAME. Commit and PR this on its own - it's a record of what actually went out, keep it separate from unrelated changes."
