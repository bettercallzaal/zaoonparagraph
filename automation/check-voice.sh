#!/usr/bin/env bash
# Run every mechanical ZAO voice check in one shot - replaces retyping the
# same five grep commands for every draft. Checks the hard, mechanical
# rules only (commas, em dashes, exclamation, opening line, signature,
# word count band). It cannot check whether the content actually sounds
# like Zaal - that's a human judgment call, not a grep.
#
# Usage: check-voice.sh <markdown-file>
# Exit 0 = all hard checks pass. Exit 1 = at least one hard check failed.

set -uo pipefail

# Two voices, two rule sets. The lowercase zero-comma staccato is DAILY-only;
# an announcement uses sentence case, numerals, real punctuation and headings.
# Running an announcement through the daily rules is how the Day 223 edition
# cost six rewrite passes. Default stays daily.
MODE="daily"
ARGS=()
for a in "$@"; do
  case "$a" in
    --announcement|-a) MODE="announcement" ;;
    --daily|-d)        MODE="daily" ;;
    *)                 ARGS+=("$a") ;;
  esac
done
set -- "${ARGS[@]+"${ARGS[@]}"}"

FILE="${1:?usage: check-voice.sh [--daily|--announcement] <markdown-file>}"

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

FAIL=0

# Strip HTML comments ONCE, up front, and run every check against the stripped
# text. Drafts carry <!-- ... --> notes (subtitle text, slot markers) that are not
# published copy. A previous fix taught only the opening-line check to skip them,
# which left the comma / dash / exclamation counts scanning comment bodies - and
# the marker "<!-- SUBTITLE (Paragraph field, not body):" alone contributes one
# exclamation and one comma, failing a clean daily draft on its own metadata.
STRIPPED="$(mktemp -t checkvoice)"
trap 'rm -f "$STRIPPED"' EXIT
perl -0777 -pe 's/<!--.*?-->//gs' "$FILE" > "$STRIPPED"
FILE="$STRIPPED"

check() {
  local label="$1"
  local passed="$2"
  if [ "$passed" -eq 0 ]; then
    echo "PASS  $label"
  else
    echo "FAIL  $label"
    FAIL=1
  fi
}

echo "mode: $MODE"

COMMA_COUNT=$(grep -o ',' "$FILE" | wc -l | tr -d ' ')
if [ "$MODE" = "daily" ]; then
  check "zero commas (found: $COMMA_COUNT)" $([ "$COMMA_COUNT" -eq 0 ] && echo 0 || echo 1)
else
  echo "SKIP  comma check (announcements use real punctuation)"
fi

DASH_COUNT=$(grep -o '—\|–' "$FILE" | wc -l | tr -d ' ')
check "zero em/en dashes (found: $DASH_COUNT)" $([ "$DASH_COUNT" -eq 0 ] && echo 0 || echo 1)

EXCLAIM_COUNT=$(grep -o '!' "$FILE" | wc -l | tr -d ' ')
if [ "$MODE" = "daily" ]; then
  check "zero exclamation marks (found: $EXCLAIM_COUNT)" $([ "$EXCLAIM_COUNT" -eq 0 ] && echo 0 || echo 1)
else
  echo "SKIP  exclamation check (announcement)"
fi

# Hard fail on explicit clock times only. "today" / "this morning" are used freely
# in the published dailies (day 205, day 215), so they are a warning, not a failure.
CLOCK_HITS=$(grep -ioE "at [0-9]{1,2}(:[0-9]{2})? ?(am|pm)" "$FILE" | tr '\n' ' ')
if [ "$MODE" = "daily" ]; then
  check "no explicit clock times (found: ${CLOCK_HITS:-none})" $([ -z "$CLOCK_HITS" ] && echo 0 || echo 1)
else
  echo "SKIP  clock-time check (an announcement carrying a deadline needs the time)"
fi

SOFT_TIME=$(grep -ioE "today|this morning|by tonight" "$FILE" | sort -u | tr '\n' ' ')
[ -n "$SOFT_TIME" ] && echo "WARN  soft time references present (${SOFT_TIME}) - fine in a daily, cut them in an announcement"

SIG_COUNT=$(grep -c "BetterCallZaal on behalf of the ZABAL Team" "$FILE")
check "exactly one signature (found: $SIG_COUNT)" $([ "$SIG_COUNT" -eq 1 ] && echo 0 || echo 1)

# opens with "zm." on the first non-empty, non-heading line
# The opener is a bare "zm" in every published edition (day 205 through day 236).
# This check previously required "zm." with a period and therefore failed all six
# editions in published/. Accept "zm" with optional trailing punctuation.
# Skip headings, blank lines, and HTML comments. Drafts carry <!-- ... --> notes
# (subtitle text, slot markers) that are not published body copy, and treating one
# as the opening line is a false failure.
OPENING_LINE=$(grep -v '^#' "$FILE" | grep -v '^[[:space:]]*$' | head -1)
if echo "$OPENING_LINE" | grep -qiE '^zm[.!]?$'; then
  check "opens with zm" 0
else
  echo "FAIL  opens with zm (found: \"$OPENING_LINE\")"
  FAIL=1
fi

WORD_COUNT=$(wc -w < "$FILE" | tr -d ' ')
if [ "$MODE" = "daily" ]; then LO=40; HI=480; else LO=250; HI=900; fi
if [ "$WORD_COUNT" -ge "$LO" ] && [ "$WORD_COUNT" -le "$HI" ]; then
  check "word count in $LO-$HI band (found: $WORD_COUNT)" 0
else
  echo "WARN  word count outside $LO-$HI band (found: $WORD_COUNT) - soft target, not a hard fail"
fi

if [ "$FAIL" -eq 0 ]; then
  echo "All hard checks passed."
else
  echo "One or more hard checks failed. Fix before pushing." >&2
fi

exit $FAIL
