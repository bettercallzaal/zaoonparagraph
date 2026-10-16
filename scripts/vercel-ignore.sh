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

# 1. Diff base: the previous deploy's SHA, fetched if the shallow clone lacks
#    it. No previous SHA, or one still unreachable after the fetch, BUILDS.
#    There is deliberately no fallback to HEAD^: when the last deploy was
#    several commits back, HEAD^ misses the earlier ones, so a page change
#    followed by a draft in one push would skip (review of ZAODEVZ/ZAOstock
#    #474, which had the same fallback).
PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$PREV" ]; then
  echo "[vercel-ignore] no previous deploy sha -> BUILD (safe default)"
  exit 1
fi
if ! git cat-file -e "$PREV" 2>/dev/null; then
  git fetch --depth=1 origin "$PREV" 2>/dev/null || true
fi
if ! git cat-file -e "$PREV" 2>/dev/null; then
  echo "[vercel-ignore] previous deploy sha $PREV is not reachable -> BUILD (safe default)"
  exit 1
fi
BASE="$PREV"

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
