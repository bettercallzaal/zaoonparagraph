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

FILE="${1:?usage: check-voice.sh <markdown-file>}"

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

FAIL=0

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

COMMA_COUNT=$(grep -o ',' "$FILE" | wc -l | tr -d ' ')
check "zero commas (found: $COMMA_COUNT)" $([ "$COMMA_COUNT" -eq 0 ] && echo 0 || echo 1)

DASH_COUNT=$(grep -o '—\|–' "$FILE" | wc -l | tr -d ' ')
check "zero em/en dashes (found: $DASH_COUNT)" $([ "$DASH_COUNT" -eq 0 ] && echo 0 || echo 1)

EXCLAIM_COUNT=$(grep -o '!' "$FILE" | wc -l | tr -d ' ')
check "zero exclamation marks (found: $EXCLAIM_COUNT)" $([ "$EXCLAIM_COUNT" -eq 0 ] && echo 0 || echo 1)

TIME_HITS=$(grep -io "today\|this morning\|by tonight\|at [0-9]*am\|at [0-9]*pm" "$FILE" | tr -d ' ')
check "no work-day time references (found: ${TIME_HITS:-none})" $([ -z "$TIME_HITS" ] && echo 0 || echo 1)

SIG_COUNT=$(grep -c "BetterCallZaal on behalf of the ZABAL Team" "$FILE")
check "exactly one signature (found: $SIG_COUNT)" $([ "$SIG_COUNT" -eq 1 ] && echo 0 || echo 1)

# opens with "zm." on the first non-empty, non-heading line
OPENING_LINE=$(grep -v '^#' "$FILE" | grep -v '^[[:space:]]*$' | head -1)
if echo "$OPENING_LINE" | grep -qi '^zm\.'; then
  check "opens with zm." 0
else
  echo "FAIL  opens with zm. (found: \"$OPENING_LINE\")"
  FAIL=1
fi

WORD_COUNT=$(wc -w < "$FILE" | tr -d ' ')
if [ "$WORD_COUNT" -ge 250 ] && [ "$WORD_COUNT" -le 480 ]; then
  check "word count in 250-480 band (found: $WORD_COUNT)" 0
else
  echo "WARN  word count outside 250-480 band (found: $WORD_COUNT) - soft target, not a hard fail"
fi

if [ "$FAIL" -eq 0 ]; then
  echo "All hard checks passed."
else
  echo "One or more hard checks failed. Fix before pushing." >&2
fi

exit $FAIL
