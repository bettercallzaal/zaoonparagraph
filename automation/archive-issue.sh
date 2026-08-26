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
MAP_STATUS=0
if [ -f "$MAP_FILE" ]; then
  if ! python3 - "$MAP_FILE" "$DRAFT" "published/$BASENAME" <<'PY'
import json, sys
map_file, old_key, new_key = sys.argv[1], sys.argv[2], sys.argv[3]
with open(map_file) as f:
    data = json.load(f)
if old_key in data:
    data[new_key] = data.pop(old_key)
    with open(map_file, "w") as f:
        json.dump(data, f, indent=2, sort_keys=True)
        f.write("\n")
    print("Post id remapped to " + new_key + " in post-ids.json.")
else:
    # Silence here is how the map went stale in the first place: a file moves,
    # the key does not, and nothing says so. Never exit 0 on a lost mapping.
    sys.stderr.write(
        "WARNING: no post id tracked for " + old_key + " - the file moved but "
        "post-ids.json still has no entry under that path. The edition is "
        "archived, its Paragraph post id is not. Add it by hand under the key "
        + new_key + ".\n")
    sys.exit(1)
PY
  then
    MAP_STATUS=1
  fi
else
  echo "WARNING: no post-ids.json at $MAP_FILE - nothing tracked." >&2
  MAP_STATUS=1
fi

echo "Archived to published/$BASENAME. Commit and PR this on its own - it's a record of what actually went out, keep it separate from unrelated changes."
echo "Add it to the table in published/README.md too - that index is the human-readable half of the record."

if [ "$MAP_STATUS" -ne 0 ]; then
  echo "Archived, but the post id mapping did not survive - see the warning above." >&2
  exit 1
fi
