#!/usr/bin/env bash
# Overlay "DAY {N}" onto a background image and render it to PNG.
# Built for the ZABAL Daily Designs Canva template - drop in the clean
# background (day number removed/hidden in Canva, downloaded as PNG),
# this script draws the new day number in the same spot every time.
#
# Position/font defaults are an estimate from the original Canva
# screenshot - pass --top and --font-size to nudge them, then check
# the output PNG and adjust until it lines up.
#
# Usage: render-thumbnail.sh <background.png> <day-number> <output.png> [--top PCT] [--font-size PX]

set -euo pipefail

BG_IMAGE="${1:?usage: render-thumbnail.sh <background.png> <day-number> <output.png> [--top PCT] [--font-size PX]}"
DAY_NUMBER="${2:?usage: render-thumbnail.sh <background.png> <day-number> <output.png> [--top PCT] [--font-size PX]}"
OUTPUT="${3:?usage: render-thumbnail.sh <background.png> <day-number> <output.png> [--top PCT] [--font-size PX]}"
shift 3

TOP_PERCENT=78
FONT_SIZE=70
while [ $# -gt 0 ]; do
  case "$1" in
    --top) TOP_PERCENT="$2"; shift 2 ;;
    --font-size) FONT_SIZE="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ ! -f "$BG_IMAGE" ]; then
  echo "Background image not found: $BG_IMAGE" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/thumbnail-template.html"
BG_BASENAME="$(basename "$BG_IMAGE")"

# browse blocks file:// URLs - serve the temp dir over a local HTTP server instead.
TMP_DIR="$(mktemp -d -t thumbnail-XXXXXX)"
cp "$BG_IMAGE" "$TMP_DIR/$BG_BASENAME"
sed \
  -e "s|__BG_IMAGE__|$BG_BASENAME|g" \
  -e "s|__TOP_PERCENT__|$TOP_PERCENT|g" \
  -e "s|__FONT_SIZE__|$FONT_SIZE|g" \
  -e "s|__DAY_NUMBER__|$DAY_NUMBER|g" \
  "$TEMPLATE" > "$TMP_DIR/thumbnail.html"

PORT=8934
cd "$TMP_DIR"
python3 -m http.server "$PORT" --bind 127.0.0.1 &>/dev/null &
cd - >/dev/null
sleep 0.5

B=~/.claude/skills/gstack/browse/dist/browse
"$B" goto "http://127.0.0.1:${PORT}/thumbnail.html"
"$B" wait --networkidle
"$B" viewport 1200x628
"$B" screenshot "$OUTPUT"

pkill -f "http.server $PORT" 2>/dev/null || true
rm -rf "$TMP_DIR"
echo "Rendered: $OUTPUT (top=${TOP_PERCENT}% font-size=${FONT_SIZE}px)"
echo "Check it - if the number's off, rerun with --top or --font-size adjusted."
