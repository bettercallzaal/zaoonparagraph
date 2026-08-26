#!/usr/bin/env bash
# Run every check that applies to every file, in one shot, so "is this repo
# still good" is one command instead of five per file.
#
# What gets checked, and why not everything gets the same checks:
#
#   drafts/*.md          queued to ship - voice gate + link check
#   drafts/archive/*.md  triaged, never shipping - link check only
#   published/*.md       already shipped - link check + record integrity
#                        (tracked post id). No voice gate: the record is not
#                        editable, and half these editions are announcement
#                        voice, which check-voice.sh is not written for.
#
# published/README.md is the index, not an edition, and is excluded from
# edition checks.
#
# This script used to glob drafts/ and published/ only, print "No
# draft/published files found" and exit 0. Once drafts/ emptied that was a
# green light over an empty set for six weeks. Nothing to check is now a
# failure, not a pass.
#
# Usage: test-all.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MAP_FILE="$SCRIPT_DIR/post-ids.json"
VOICE_LOG=$(mktemp)
LINK_LOG=$(mktemp)
trap 'rm -f "$VOICE_LOG" "$LINK_LOG"' EXIT

FAIL=0
CHECKED=0

check_links() {
  if ! "$SCRIPT_DIR/check-links.sh" "$1" > "$LINK_LOG" 2>&1; then
    echo "LINKS FAIL"
    grep "^DEAD" "$LINK_LOG"
    FAIL=1
  else
    echo "links: ok"
  fi
}

echo "### queued drafts (voice + links) ###"
echo
QUEUED=0
for FILE in "$REPO_ROOT"/drafts/*.md; do
  [ -f "$FILE" ] || continue
  QUEUED=$((QUEUED + 1))
  CHECKED=$((CHECKED + 1))
  echo "=== ${FILE#"$REPO_ROOT"/} ==="
  if ! "$SCRIPT_DIR/check-voice.sh" "$FILE" > "$VOICE_LOG" 2>&1; then
    echo "VOICE FAIL"
    grep "^FAIL" "$VOICE_LOG"
    FAIL=1
  else
    echo "voice: ok"
  fi
  check_links "$FILE"
  echo
done
[ "$QUEUED" -eq 0 ] && echo "none queued." && echo

echo "### archived drafts (links only) ###"
echo
for FILE in "$REPO_ROOT"/drafts/archive/*.md; do
  [ -f "$FILE" ] || continue
  CHECKED=$((CHECKED + 1))
  echo "=== ${FILE#"$REPO_ROOT"/} ==="
  check_links "$FILE"
  echo
done

echo "### published record (links + tracked post id) ###"
echo
PUBLISHED=0
for FILE in "$REPO_ROOT"/published/*.md; do
  [ -f "$FILE" ] || continue
  [ "$(basename "$FILE")" = "README.md" ] && continue
  PUBLISHED=$((PUBLISHED + 1))
  CHECKED=$((CHECKED + 1))
  REL_PATH="published/$(basename "$FILE")"
  echo "=== $REL_PATH ==="

  POST_ID=$(python3 - "$MAP_FILE" "$REL_PATH" <<'PY'
import json, sys
try:
    with open(sys.argv[1]) as f:
        print(json.load(f).get(sys.argv[2], ""))
except FileNotFoundError:
    print("")
PY
)
  if [ -n "$POST_ID" ]; then
    echo "post id: $POST_ID"
  else
    echo "RECORD FAIL - no post id in automation/post-ids.json under $REL_PATH"
    FAIL=1
  fi
  check_links "$FILE"
  echo
done

echo "=== summary ==="
echo "$CHECKED file(s) checked: $QUEUED queued, $PUBLISHED published."

if [ "$CHECKED" -eq 0 ]; then
  echo "Nothing to check. That is a broken repo or a broken glob, not a pass." >&2
  exit 1
fi

if [ "$FAIL" -eq 1 ]; then
  echo "At least one check failed - see above." >&2
  exit 1
fi
echo "Everything passes."
echo "Record currency (live editions missing from published/) is a separate"
echo "question - run automation/status.sh for that."
