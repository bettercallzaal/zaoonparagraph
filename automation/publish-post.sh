#!/usr/bin/env bash
# Publish, schedule, unschedule or test-email one existing Paragraph post, by id.
# The one script in this repo that can put something in front of readers, so it is
# built to do nothing unless told exactly what to do:
#
#   - it never runs on a bare id: one action flag is required
#   - --dry-run prints the exact request and sends nothing, with or without a key
#   - a real run also needs CONFIRM_POST_ID set to the same post id, so a retyped
#     or pasted command cannot fire by accident
#   - it refuses a post whose live body still carries a slot such as [FILL]
#     (Paragraph agent workflow, rule 3), and reads the status back afterwards,
#     because the update endpoint's answer is not proof
#
# API rules from docs.paragraph.com/llms.txt, read 2026-11-01: status "published"
# publishes a draft; scheduledAt is unix milliseconds, in the future, at most 30 days
# out, only for a post not yet published or scheduled; scheduledAt null cancels;
# test-email works on drafts only and goes to the publication owner.
#
# Usage: publish-post.sh <post-id> --publish [--newsletter] [--dry-run]
#        publish-post.sh <post-id> --schedule <unix-ms> [--newsletter] [--dry-run]
#        publish-post.sh <post-id> --unschedule [--dry-run]
#        publish-post.sh <post-id> --test-email [--dry-run]

set -euo pipefail

USAGE="usage: publish-post.sh <post-id> --publish|--schedule <unix-ms>|--unschedule|--test-email [--newsletter] [--dry-run]"
POST_ID="${1:?$USAGE}"
shift

ACTION=""; WHEN=""; NEWSLETTER=0; DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --publish|--unschedule|--test-email) ACTION="${1#--}"; shift ;;
    --schedule) ACTION="schedule"; WHEN="${2:?$USAGE}"; shift 2 ;;
    --newsletter) NEWSLETTER=1; shift ;;
    --dry-run) DRY=1; shift ;;
    *) echo "Unknown option: $1" >&2; echo "$USAGE" >&2; exit 2 ;;
  esac
done
[ -n "$ACTION" ] || { echo "$USAGE" >&2; exit 2; }

if [ "$ACTION" = "schedule" ]; then
  NOW_MS=$(($(date +%s) * 1000))
  case "$WHEN" in *[!0-9]*|"") echo "REFUSED: --schedule takes unix milliseconds, got $WHEN" >&2; exit 2 ;; esac
  if [ "$WHEN" -le "$NOW_MS" ] || [ "$WHEN" -gt $((NOW_MS + 30 * 86400000)) ]; then
    echo "REFUSED: the time must be in the future and at most 30 days out." >&2; exit 1
  fi
fi

NL_FIELD=""
[ "$NEWSLETTER" -eq 1 ] && NL_FIELD=',"sendNewsletter":true'
BASE="https://public.api.paragraph.com/api/v1/posts/${POST_ID}"
METHOD="PUT"; URL="$BASE"
case "$ACTION" in
  publish)    PAYLOAD="{\"status\":\"published\"$NL_FIELD}" ;;
  schedule)   PAYLOAD="{\"scheduledAt\":$WHEN$NL_FIELD}" ;;
  unschedule) PAYLOAD='{"scheduledAt":null}' ;;
  test-email) PAYLOAD='{}'; METHOD="POST"; URL="$BASE/test-email" ;;
esac

if [ "$DRY" -eq 1 ]; then
  echo "DRY RUN, nothing sent."
  echo "$METHOD $URL"
  echo "$PAYLOAD"
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -z "${PARAGRAPH_API_KEY:-}" ] && [ -f "$REPO_ROOT/.env" ]; then
  set -a; source "$REPO_ROOT/.env"; set +a
fi
[ -n "${PARAGRAPH_API_KEY:-}" ] || { echo "PARAGRAPH_API_KEY not set. Put it in .env (gitignored) at the repo root." >&2; exit 2; }

if [ "${CONFIRM_POST_ID:-}" != "$POST_ID" ]; then
  echo "REFUSED: set CONFIRM_POST_ID=$POST_ID to run this for real." >&2; exit 1
fi

read_field() {  # read_field <field>: reads the post with the key, prints one field
  curl -sS -H "Authorization: Bearer ${PARAGRAPH_API_KEY}" "$BASE?includeContent=true" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); d=d.get('post',d); print(d.get(sys.argv[1]) or '')" "$1"
}

if [ "$ACTION" != "unschedule" ]; then
  if read_field markdown | grep -qE '\[(FILL|CUT|CHECK|TODO)'; then
    echo "REFUSED: the post body on Paragraph still carries a [FILL], [CUT], [CHECK] or [TODO] slot." >&2
    exit 1
  fi
fi

curl -sS -X "$METHOD" "$URL" \
  -H "Authorization: Bearer ${PARAGRAPH_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
echo

if [ "$ACTION" != "test-email" ]; then
  echo "Paragraph now reads status: $(read_field status)"
  echo "Read the live body before calling it done. A status is not a check."
fi
