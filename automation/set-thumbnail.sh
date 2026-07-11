#!/usr/bin/env bash
# Set an existing post's thumbnail (imageUrl) via the Paragraph API.
# Paragraph fetches whatever URL is given and re-hosts it on its own
# storage - the URL just needs to be publicly reachable at call time.
#
# Usage: set-thumbnail.sh <post-id> <image-url>

set -euo pipefail

POST_ID="${1:?usage: set-thumbnail.sh <post-id> <image-url>}"
IMAGE_URL="${2:?usage: set-thumbnail.sh <post-id> <image-url>}"

if [ -z "${PARAGRAPH_API_KEY:-}" ]; then
  echo "PARAGRAPH_API_KEY not set. Put it in .env (gitignored) and source it, or export it in your shell." >&2
  exit 1
fi

PAYLOAD=$(python3 -c "import json,sys; print(json.dumps({'imageUrl': sys.argv[1]}))" "$IMAGE_URL")

RESPONSE=$(curl -sS -X PUT "https://public.api.paragraph.com/api/v1/posts/${POST_ID}" \
  -H "Authorization: Bearer ${PARAGRAPH_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$RESPONSE"

SUCCESS=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('success', False))" 2>/dev/null || echo "False")

if [ "$SUCCESS" != "True" ]; then
  echo "WARNING: response did not confirm success. Check the response above." >&2
  exit 2
fi

echo "Thumbnail set on post ${POST_ID}."
