#!/usr/bin/env bash
# Vercel ignoreCommand logic. Exit 0 = SKIP the build, non-zero = BUILD.
#
# Adapted from bettercallzaal/zao-app scripts/vercel-ignore.sh (PR 8, MIT,
# Zaal Panthaki / The ZAO), itself ported from ZAOOS. Changes: the build
# paths are this site's, and preview deploys are not skipped wholesale, so a
# PR that changes the page still gets a preview.
#
# Why: none of the 39 commits to main from 22 Sep to 16 Oct 2026 changed a
# served page (replayed against the paths below: 39 skip, 0 build); each
# touched drafts/, published/, research/, templates/, docs/ or markdown. The site is one static page, index.html, which reads its
# posts and PRs live from the Paragraph and GitHub APIs, so a newsletter
# draft never changes what a visitor sees. Every decision is logged so the
# build log says why it built or skipped.
#
# Measured 2026-10-16 on https://zaoonparagraph.vercel.app : / and
# /index.html return 200 and are the site. Vercel also serves the repo's
# other files raw (drafts/, published/, docs/, automation/ paths return 200),
# but nothing on the page links to them. After this change those raw copies
# update only when a build-path file changes; GitHub stays the place to read
# them.

BUILD_PATHS=(
  index.html
  ':(glob)*.html'
  assets public favicon.ico
  vercel.json scripts/vercel-ignore.sh
)

# 1. Make the previous deploy's SHA reachable. The clone is shallow, so the
#    SHA is usually absent; fetch just that object before giving up on it.
PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -n "$PREV" ] && ! git cat-file -e "$PREV" 2>/dev/null; then
  git fetch --depth=1 origin "$PREV" 2>/dev/null || true
fi

# 2. Diff base: the previous deploy's SHA when reachable, else this commit's
#    parent (deepen by one if the shallow clone lacks it). Only when NO base
#    exists do we fall through to the safe default of building.
BASE=""
if [ -n "$PREV" ] && git cat-file -e "$PREV" 2>/dev/null; then
  BASE="$PREV"
else
  git rev-parse --verify -q HEAD^ >/dev/null 2>&1 || git fetch --deepen=1 origin 2>/dev/null || true
  if git rev-parse --verify -q HEAD^ >/dev/null 2>&1; then
    BASE="HEAD^"
  fi
fi
if [ -z "$BASE" ]; then
  echo "[vercel-ignore] no diff base reachable (prev=${PREV:-unset}) -> BUILD (safe default)"
  exit 1
fi

# 3. Build only if a served file changed since the base. git diff --quiet
#    exits 0 (no change -> SKIP), 1 (changed -> BUILD), or 128 on an error,
#    which is non-zero and so also BUILDS.
if git diff --quiet "$BASE" HEAD -- "${BUILD_PATHS[@]}"; then
  echo "[vercel-ignore] no served-file change vs $BASE -> SKIP"
  exit 0
else
  echo "[vercel-ignore] served-file change vs $BASE (or diff error) -> BUILD"
  exit 1
fi
