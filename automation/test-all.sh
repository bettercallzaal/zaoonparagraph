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

# IS THIS AN EDITION? Decided from the FILE'S CONTENT, never its name.
#
# Measured 2026-09-22: nine drafts failed the voice gate and three of them were
# never editions at all - a SCAFFOLD that says of itself "this is a frame, not
# copy", a .FACTS source trace, and a photo-post list for Zaal to post by hand.
# The gate failed the fact sheet for containing 151 commas, which a source trace
# is supposed to contain. published/README.md was already excluded on exactly
# this reasoning ("the index, not an edition") and the reasoning was never
# extended.
#
# NOT BY FILENAME. .SCAFFOLD and .FACTS are a convention nobody enforces, and
# the next non-edition will not carry one. An edition is a file that carries the
# zm opener or the ZABAL signature - the two things check-voice.sh itself
# requires of one - so anything holding either is held to the whole gate.
is_edition() {
  grep -qiE '^[[:space:]]*zm[.!]?[[:space:]]*$' "$1" && return 0
  grep -q "BetterCallZaal on behalf of the ZABAL Team" "$1" && return 0
  return 1
}

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
SKIPPED=0
SKIP_LIST=""
for FILE in "$REPO_ROOT"/drafts/*.md; do
  [ -f "$FILE" ] || continue
  QUEUED=$((QUEUED + 1))
  CHECKED=$((CHECKED + 1))
  REL="${FILE#"$REPO_ROOT"/}"
  echo "=== $REL ==="
  if is_edition "$FILE"; then
    if ! "$SCRIPT_DIR/check-voice.sh" "$FILE" > "$VOICE_LOG" 2>&1; then
      echo "VOICE FAIL"
      grep "^FAIL" "$VOICE_LOG"
      FAIL=1
    else
      echo "voice: ok"
    fi
  else
    # A SILENT SKIP IS THE SAME HAZARD AS AN EMPTY CHECK SET, wearing different
    # clothes. This script already refuses to pass on nothing checked; every
    # file that dodges the voice gate is named here and counted in the summary,
    # so a real edition slipping into this list is visible in the output rather
    # than discovered weeks later by someone reading the skip logic.
    echo "voice: SKIPPED - no zm opener and no ZABAL signature, so this is not an edition"
    SKIPPED=$((SKIPPED + 1))
    SKIP_LIST="${SKIP_LIST}${REL}"$'\n'
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

# The skip list is printed in the summary as well as inline, because the inline
# line scrolls past in a 29-file run and the summary is what people read. If a
# real edition ever appears here, that is the finding.
if [ "$SKIPPED" -gt 0 ]; then
  echo
  echo "$SKIPPED queued file(s) skipped the voice gate (not editions - no zm opener, no ZABAL signature):"
  printf '%s' "$SKIP_LIST" | sed 's/^/  /'
  echo "If any of those IS an edition, the gate is not covering it. Fix the file, not this list."
fi

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
