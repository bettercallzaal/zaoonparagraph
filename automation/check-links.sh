#!/usr/bin/env bash
# Extract every http(s) link and check it's still live. Grounded claims
# are only as good as the links backing them - this catches rot before
# someone clicks a dead source.
#
# Usage: check-links.sh [file]
# With no argument: scans drafts/, published/, and research/.
# With a file argument: scans just that one file (e.g. called from
# create-draft.sh before pushing a specific issue).

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

TARGET="${1:-}"
if [ -n "$TARGET" ]; then
  LINKS=$(grep -hoE '\]\((https?://[^)]+)\)' "$TARGET" 2>/dev/null \
    | sed -E 's/^\]\((.*)\)$/\1/' \
    | sort -u)
else
  LINKS=$(grep -rhoE '\]\((https?://[^)]+)\)' drafts/ published/ research/ 2>/dev/null \
    | sed -E 's/^\]\((.*)\)$/\1/' \
    | sort -u)
fi

if [ -z "$LINKS" ]; then
  echo "No links found."
  exit 0
fi

TOTAL=0
DEAD=0

while IFS= read -r URL; do
  [ -z "$URL" ] && continue
  TOTAL=$((TOTAL + 1))
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" -L --max-time 10 -A "Mozilla/5.0" "$URL" 2>/dev/null || echo "000")
  if [ "$CODE" -ge 200 ] && [ "$CODE" -lt 400 ]; then
    echo "OK   $CODE  $URL"
  else
    echo "DEAD $CODE  $URL"
    DEAD=$((DEAD + 1))
  fi
done <<< "$LINKS"

echo
echo "$TOTAL links checked, $DEAD dead."
if [ "$DEAD" -gt 0 ]; then
  exit 1
fi
