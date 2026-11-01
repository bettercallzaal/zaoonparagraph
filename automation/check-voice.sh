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

# Three modes.
#   daily (default)  the recent style: sentence case, commas, numerals and clock
#                    times are fine. Still no exclamation marks, and the 40-480
#                    word band. This became the default on 2026-11-01: Zaal's
#                    question on the voice went unanswered and its default, the
#                    recent style, stands (grill ruling, 1 Nov). Every
#                    published daily from Day 299 on uses commas, and the old
#                    default failed all of them.
#   --strict         the old lowercase zero-comma staccato, kept for the day it
#                    comes back. Running an edition through the wrong rules is
#                    how Day 223 cost six rewrite passes.
#   --announcement   real punctuation, a deadline time, 250-900 words.
MODE="daily"
STRICT=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --announcement|-a) MODE="announcement" ;;
    --daily|-d)        MODE="daily" ;;
    --strict|-s)       MODE="daily"; STRICT=1 ;;
    *)                 ARGS+=("$a") ;;
  esac
done
set -- "${ARGS[@]+"${ARGS[@]}"}"

FILE="${1:?usage: check-voice.sh [--daily|--strict|--announcement] <markdown-file>}"

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

# Every check below reads the body only. HTML comments are draft notes and record
# headers, not copy: the "!" in "<!--" alone failed every file carrying one, so all
# 6 records from Day 299 to Day 304 read as breaking the exclamation rule when none
# has an exclamation mark in its body. An unclosed comment is left in and counted.
BODY=$(mktemp)
trap 'rm -f "$BODY"' EXIT
python3 - "$FILE" > "$BODY" <<'PY' || { echo "could not read $FILE" >&2; exit 2; }
import re, sys
text = open(sys.argv[1], encoding="utf-8", errors="replace").read()
sys.stdout.write(re.sub(r"<!--.*?-->", "", text, flags=re.S))
PY
FILE="$BODY"

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

if [ "$STRICT" -eq 1 ]; then echo "mode: daily, strict"; else echo "mode: $MODE"; fi

COMMA_COUNT=$(grep -o ',' "$FILE" | wc -l | tr -d ' ')
if [ "$STRICT" -eq 1 ]; then
  check "zero commas (found: $COMMA_COUNT)" $([ "$COMMA_COUNT" -eq 0 ] && echo 0 || echo 1)
else
  echo "SKIP  comma check (the recent style and announcements use real punctuation; --strict checks it)"
fi

DASH_COUNT=$(grep -o '—\|–' "$FILE" | wc -l | tr -d ' ')
check "zero em/en dashes (found: $DASH_COUNT)" $([ "$DASH_COUNT" -eq 0 ] && echo 0 || echo 1)

# No emojis, and none of the decorative symbols that stand in for them (checkmarks,
# warning triangles, play buttons, stars). Both voices. Counted by code point in
# python3 because a bracket range of 4-byte characters is not portable across greps.
EMOJI_COUNT=$(python3 - "$FILE" <<'PY'
import sys
R = [(0x1F000, 0x1FAFF), (0x2600, 0x27BF), (0x2B00, 0x2BFF), (0x25A0, 0x25FF), (0xFE0F, 0xFE0F), (0x200D, 0x200D)]
text = open(sys.argv[1], encoding="utf-8", errors="replace").read()
print(sum(1 for ch in text if any(lo <= ord(ch) <= hi for lo, hi in R)))
PY
)
check "zero emojis or decorative symbols (found: ${EMOJI_COUNT:-UNKNOWN})" $([ "${EMOJI_COUNT:-x}" = "0" ] && echo 0 || echo 1)

EXCLAIM_COUNT=$(grep -o '!' "$FILE" | wc -l | tr -d ' ')
if [ "$MODE" = "daily" ]; then
  check "zero exclamation marks (found: $EXCLAIM_COUNT)" $([ "$EXCLAIM_COUNT" -eq 0 ] && echo 0 || echo 1)
else
  echo "SKIP  exclamation check (announcement)"
fi

# Hard fail on explicit clock times only. "today" / "this morning" are used freely
# in the published dailies (day 205, day 215), so they are a warning, not a failure.
CLOCK_HITS=$(grep -ioE "at [0-9]{1,2}(:[0-9]{2})? ?(am|pm)" "$FILE" | tr '\n' ' ')
if [ "$STRICT" -eq 1 ]; then
  check "no explicit clock times (found: ${CLOCK_HITS:-none})" $([ -z "$CLOCK_HITS" ] && echo 0 || echo 1)
else
  echo "SKIP  clock-time check (an event time is fine outside --strict)"
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
OPENING_LINE=$(sed 's/<!--.*-->//' "$FILE" \
  | awk '/<!--/{c=1} !c; /-->/{c=0}' \
  | grep -v '^#' | grep -v '^[[:space:]]*$' | head -1)
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
