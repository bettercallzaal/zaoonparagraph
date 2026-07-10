#!/usr/bin/env bash
# Pull real merged PRs across known repos since a given date - grounded raw
# material for a daily-3 or weekly-recap draft. Replaces the manual "grep
# git log across five repos by hand" step.
#
# Usage: collect-wins.sh <since-date YYYY-MM-DD> [repos-file]
# Example: collect-wins.sh 2026-07-09
# Example: collect-wins.sh 2026-07-03 automation/repos.txt   (a week's worth)

set -euo pipefail

SINCE="${1:?usage: collect-wins.sh <since-date YYYY-MM-DD> [repos-file]}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOS_FILE="${2:-$SCRIPT_DIR/repos.txt}"

if [ ! -f "$REPOS_FILE" ]; then
  echo "Repos file not found: $REPOS_FILE" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found - required to list merged PRs." >&2
  exit 1
fi

while IFS= read -r REPO_PATH; do
  [ -z "$REPO_PATH" ] && continue
  [[ "$REPO_PATH" == \#* ]] && continue
  [ ! -d "$REPO_PATH" ] && { echo "# skipping $REPO_PATH (not found)" >&2; continue; }

  REMOTE_URL=$(git -C "$REPO_PATH" remote get-url origin 2>/dev/null || true)
  [ -z "$REMOTE_URL" ] && { echo "# skipping $REPO_PATH (no git remote)" >&2; continue; }

  OWNER_REPO=$(echo "$REMOTE_URL" | sed -E 's#.*github\.com[:/]##; s#\.git$##')
  [ -z "$OWNER_REPO" ] && continue

  REPO_NAME=$(basename "$REPO_PATH")
  RESULT=$(gh pr list --repo "$OWNER_REPO" --state merged --search "merged:>=${SINCE}" \
    --json number,title,url,mergedAt --jq '.[] | "\(.mergedAt | split("T")[0]) | '"$REPO_NAME"' | #\(.number) | \(.title) | \(.url)"' 2>/dev/null || true)

  if [ -n "$RESULT" ]; then
    echo "$RESULT"
  fi
done < "$REPOS_FILE" | sort -r
