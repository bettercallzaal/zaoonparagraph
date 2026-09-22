#!/usr/bin/env bash
# make-agent-paste.sh - turn a draft in drafts/zaostock/ into the message that goes
# into the Paragraph agent chat, and REFUSE if that message would carry a placeholder.
#
#   bash automation/make-agent-paste.sh drafts/zaostock/2026-09-22-day-265-review.md
#   bash automation/make-agent-paste.sh <file> --clip        # also open it as a clipboard page
#
# Why this exists. On 2026-09-21 the Day 264 update carried the line
# "MY PICK IN ONE OR TWO SENTENCES, IN MY WORDS" as a slot for Zaal to fill before
# pasting. He pasted it unfilled, the agent obeyed "word for word", and the placeholder
# reached the live preview as body text. Rule 12 in paragraph-agent-context.md tells the
# agent to stop if it sees one. This is the other half: the message never contains one.
# A rule nobody can forget beats a rule everybody remembers.
#
# Exit 0 the message is on stdout and safe to paste. Exit 1 it carries a placeholder,
# nothing is printed but the reason. Exit 2 the check could not run.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="${1:-}"
CLIP=""
[ "${2:-}" = "--clip" ] && CLIP=1

if [ -z "$FILE" ]; then
  echo "usage: make-agent-paste.sh <draft.md> [--clip]" >&2
  exit 2
fi
if [ ! -s "$FILE" ]; then
  echo "CANNOT RUN: $FILE is missing or empty" >&2
  exit 2
fi

# Title and subtitle come from the draft's own H1 and SUBTITLE comment, never invented.
TITLE="$(sed -n '1s/^# //p' "$FILE")"
# The subtitle may sit on the marker's own line or on the lines below it. Both are
# read; the marker line is never assumed empty. A subtitle written as
# "<!-- SUBTITLE (Paragraph field): the news -->" used to be skipped, and awk then
# took the whole body as the subtitle (Dotfiles review, 2026-09-22).
SUBTITLE="$(awk '
  !f && /SUBTITLE \(Paragraph field/ {
    line = $0
    sub(/.*SUBTITLE \(Paragraph field[^)]*\)[[:space:]]*:?[[:space:]]*/, "", line)
    if (line ~ /-->/) { sub(/-->.*/, "", line); print line; exit }
    if (line != "") print line
    f = 1; next
  }
  f {
    line = $0
    if (line ~ /-->/) { sub(/-->.*/, "", line); print line; exit }
    print line
  }' "$FILE" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr '\n' ' ' | sed 's/[[:space:]]*$//')"

if [ -z "$TITLE" ]; then
  echo "CANNOT RUN: $FILE has no H1 title on line 1" >&2
  exit 2
fi
if [ -z "$SUBTITLE" ]; then
  echo "CANNOT RUN: $FILE has no SUBTITLE comment, and the subtitle carries the news" >&2
  exit 2
fi

# The body is everything from the zm opener down. Header comments never travel.
BODY="$(awk '/^zm$/{f=1} f' "$FILE")"
if [ -z "$BODY" ]; then
  echo "CANNOT RUN: no 'zm' opener found in $FILE, so the body cannot be located" >&2
  exit 2
fi

# THE GUARD. Any line the body carries that is an instruction rather than copy.
# The all-caps half is looser than the bracket half, so a line of real copy can trip
# it. When that happens the fix is this marker on that line, not a looser pattern:
#   <!-- paste-ok -->
# which is stripped from the body below.
SLOTS="$(printf '%s\n' "$BODY" | grep -v 'paste-ok' \
  | grep -nE '\[(FILL|CUT|CHECK|TODO)|[A-Z]{4,}[[:space:]]+[A-Z]{2,}' || true)"
BODY="$(printf '%s\n' "$BODY" | sed 's/[[:space:]]*<!-- paste-ok -->//')"
if [ -n "$SLOTS" ]; then
  echo "REFUSED: the body still carries $(printf '%s\n' "$SLOTS" | wc -l | tr -d ' ') line(s) that are notes, not copy." >&2
  echo "$SLOTS" >&2
  echo "" >&2
  echo "Fill them or cut them first. A slot in a paste block ends up in the post." >&2
  exit 1
fi

# The checks that already exist, run here so one command answers "is it ready".
VOICE_OUT="$(bash "$REPO_ROOT/automation/check-voice.sh" --announcement "$FILE" 2>&1)" || {
  echo "REFUSED: check-voice.sh --announcement failed:" >&2; echo "$VOICE_OUT" >&2; exit 1; }
LINK_OUT="$(bash "$REPO_ROOT/automation/check-links.sh" "$FILE" 2>&1)" || {
  echo "REFUSED: check-links.sh failed:" >&2; echo "$LINK_OUT" >&2; exit 1; }

cat <<MSG
Make this today's post. Save it as a draft. Do not publish, post, schedule or send it, and do not turn on any automation.

TITLE: $TITLE

SUBTITLE: $SUBTITLE

COVER: make a cover in the same style as the last one, same colours and type, reading "Year of the ZABAL", the day number from the title above, and the countdown from the first line of the body, with the ZAOstock moose. Nothing else on it. Check the day number against the title before you attach it.

BODY (markdown), word for word. Do not rewrite, reorder, shorten or add a sentence. Keep the links as they are, with the full stop inside the link text. Keep the ## lines as headings:

$BODY

When the draft is saved, reply with the preview link, then paste the title, subtitle and body back to me exactly as you saved them, and list anything you changed word for word. If you changed nothing, say "no changes".

Do not post.
MSG

echo "" >&2
echo "$LINK_OUT" | tail -2 >&2
echo "$VOICE_OUT" | tail -1 >&2

if [ -n "$CLIP" ] && [ -x "$HOME/.claude/skills/clipboard/bin/clipboard-emit.sh" ]; then
  SLUG="$(basename "$FILE" .md)"
  {
    echo "Paste into the Paragraph agent chat. Generated by automation/make-agent-paste.sh, which refuses to print a body containing a placeholder."
    echo ""
    echo "<pre>"
    bash "${BASH_SOURCE[0]}" "$FILE" 2>/dev/null | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g'
    echo "</pre>"
  } | bash "$HOME/.claude/skills/clipboard/bin/clipboard-emit.sh" "Agent paste: $TITLE" "$SLUG-agent-paste" >&2
fi
