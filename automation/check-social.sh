#!/usr/bin/env bash
# Gate a SOCIAL post file. Socials are not newsletter editions, so the zm opener,
# the signature and the word band do not apply - but the two gates that exist to
# stop real harm do.
#
# WHY THIS EXISTS. On 2026-09-08 seven platform posts were generated straight to a
# clipboard page. They were never a file, so nothing checked them - not the handle
# gate, not the placeholder gate, nothing. A social post is the MOST outbound thing
# this repo produces and it had the least checking. Write socials to
# drafts/socials/ and run this before Zaal posts.
#
# Usage: check-social.sh <file>
set -uo pipefail
FILE="${1:?usage: check-social.sh <social-post-file>}"
[ -f "$FILE" ] || { echo "File not found: $FILE" >&2; exit 1; }
FAIL=0
check(){ if [ "$2" -eq 0 ]; then echo "PASS  $1"; else echo "FAIL  $1"; FAIL=1; fi; }

SRC="$(perl -0777 -pe 's/<!--.*?-->//gs' "$FILE")"

D=$(printf '%s' "$SRC" | grep -c '—\|–' || true)
check "zero em/en dashes (found: $D)" $([ "$D" -eq 0 ] && echo 0 || echo 1)

# BSD grep on macOS has no -P, so emoji detection goes through python.
E=$(printf '%s' "$SRC" | python3 -c '
import sys,re
t=sys.stdin.read()
print(len(re.findall(r"[\U0001F300-\U0001FAFF\u2600-\u27BF\u2190-\u21FF\u2B00-\u2BFF]",t)))
')
check "zero emojis (found: $E)" $([ "$E" -eq 0 ] && echo 0 || echo 1)

H=$(printf '%s' "$SRC" | grep -oE '(^|[[:space:]])#[A-Za-z][A-Za-z0-9_]+' | grep -v '^#\{1,6\} ' | wc -l | tr -d ' ')
check "zero hashtags (found: $H)" $([ "$H" -eq 0 ] && echo 0 || echo 1)

PH=$(printf '%s' "$SRC" | sed -E 's/\[([^]]*)\]\([^)]*\)/\1/g' \
     | grep -oE '\[[^]]{2,}\]|\b(TODO|TBD|FIXME|XXX|TK|PLACEHOLDER|SLOT)\b' | sort -u | tr '\n' ' ')
check "no placeholders (found: ${PH:-none})" $([ -z "$PH" ] && echo 0 || echo 1)

HS="$(dirname "$0")/check-handles.py"
if [ -f "$HS" ]; then
  if python3 "$HS" "$FILE" >/tmp/sh.$$ 2>&1; then
    grep -E "^(ok|WARN)" /tmp/sh.$$ | sed 's/^/      /'; check "all tagged handles verified" 0
  else
    grep -E "^(FAIL|BLOCKED)" /tmp/sh.$$ | sed 's/^/      /'; check "all tagged handles verified" 1
  fi
  rm -f /tmp/sh.$$
else
  echo "WARN  check-handles.py missing - handle gate SKIPPED"
fi

if [ "$FAIL" -eq 0 ]; then echo "All social checks passed. Zaal posts; nothing here sends."; else
  echo "BLOCKED. Fix before Zaal posts." >&2; fi
exit $FAIL
