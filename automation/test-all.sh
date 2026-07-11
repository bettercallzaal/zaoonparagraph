#!/usr/bin/env bash
# Run every check (voice + links) against every real draft in one shot.
# A single command to answer "is everything actually still good" instead
# of running check-voice.sh and check-links.sh by hand per file.
#
# Usage: test-all.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

FAIL=0
CHECKED=0

for FILE in "$REPO_ROOT"/drafts/*.md "$REPO_ROOT"/published/*.md; do
  [ -f "$FILE" ] || continue
  REL_PATH="${FILE#"$REPO_ROOT"/}"
  CHECKED=$((CHECKED + 1))
  echo "=== $REL_PATH ==="

  if ! "$SCRIPT_DIR/check-voice.sh" "$FILE" > /tmp/test-all-voice.log 2>&1; then
    echo "VOICE FAIL"
    grep "^FAIL" /tmp/test-all-voice.log
    FAIL=1
  else
    echo "voice: ok"
  fi

  if ! "$SCRIPT_DIR/check-links.sh" "$FILE" > /tmp/test-all-links.log 2>&1; then
    echo "LINKS FAIL"
    grep "^DEAD" /tmp/test-all-links.log
    FAIL=1
  else
    echo "links: ok"
  fi
  echo
done

rm -f /tmp/test-all-voice.log /tmp/test-all-links.log

if [ "$CHECKED" -eq 0 ]; then
  echo "No draft/published files found."
  exit 0
fi

echo "$CHECKED files checked."
if [ "$FAIL" -eq 1 ]; then
  echo "At least one check failed - see above." >&2
  exit 1
fi
echo "Everything passes."
