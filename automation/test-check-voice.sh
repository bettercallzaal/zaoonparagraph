#!/usr/bin/env bash
# Self-test for check-voice.sh: feed it files it must pass and files it must fail,
# so a green voice gate means the gate can still see something. Body rules apply to
# the body; anything inside an HTML comment is a note and does not count.
#
# Usage: test-check-voice.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
FAILED=0

WORDS="one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone thirtytwo thirtythree thirtyfour thirtyfive thirtysix thirtyseven thirtyeight thirtynine forty"
SIG="- BetterCallZaal on behalf of the ZABAL Team"

# expect <0|1> <name> <file body> [gate flag]
expect() {
  local want="$1" name="$2" body="$3" flag="${4:-}"
  printf '%s\n' "$body" > "$TMP/case.md"
  "$SCRIPT_DIR/check-voice.sh" $flag "$TMP/case.md" > /dev/null 2>&1
  local got=$?
  if [ "$got" -eq "$want" ]; then
    echo "ok    $name"
  else
    echo "WRONG $name (wanted exit $want, got $got)"
    FAILED=1
  fi
}

expect 0 "clean body passes" "zm

$WORDS

$SIG"
expect 0 "comma and exclamation in a comment do not count, strict" "<!-- note, with a comma! -->

zm

$WORDS

$SIG" --strict
expect 0 "multi-line comment does not count" "<!-- line one, here
line two! -->

zm

$WORDS

$SIG" --strict
expect 1 "comma in the body fails under --strict" "zm

$WORDS, more

$SIG" --strict
expect 0 "comma and a clock time pass in the default" "zm

$WORDS, more at 6 PM

$SIG"
expect 1 "a clock time fails under --strict" "zm

$WORDS more at 6 PM

$SIG" --strict
expect 1 "exclamation in the body fails" "zm

$WORDS!

$SIG"
expect 1 "signature only inside a comment fails" "zm

$WORDS

<!-- $SIG -->"
expect 1 "unclosed comment stays counted" "<!-- never closed, here

zm

$WORDS

$SIG" --strict

if [ "$FAILED" -ne 0 ]; then
  echo "voice gate self-test FAILED" >&2
  exit 1
fi
echo "voice gate self-test passed"
