#!/usr/bin/env bash
# Runs scripts/vercel-ignore.sh against throwaway git repos and checks each
# exit code: 0 = SKIP, 1 = BUILD. Usage: bash scripts/test-vercel-ignore.sh
set -u
SCRIPT="$(cd "$(dirname "$0")" && pwd)/vercel-ignore.sh"
TMP="$(mktemp -d)"
PASS=0; FAIL=0

new_repo() { # new_repo <name>: a repo shaped like this one, one commit
  local d="$TMP/$1"; mkdir -p "$d/drafts" "$d/published"
  git -C "$d" init -q
  git -C "$d" config user.email t@example.com; git -C "$d" config user.name t
  echo '<h1>site</h1>' > "$d/index.html"; echo '{}' > "$d/vercel.json"
  echo a > "$d/drafts/a.md"; echo b > "$d/published/b.md"; echo r > "$d/README.md"
  git -C "$d" add -A; git -C "$d" commit -qm init
  echo "$d"
}
change() { # change <repo> <path> : edit or create a file and commit it
  mkdir -p "$(dirname "$1/$2")"; echo "$RANDOM" >> "$1/$2"
  git -C "$1" add -A; git -C "$1" commit -qm "edit $2"
}
expect() { # expect <label> <want> <repo> [VERCEL_GIT_PREVIOUS_SHA]
  local got
  (cd "$3" && VERCEL_GIT_PREVIOUS_SHA="${4:-}" bash "$SCRIPT" >/dev/null 2>&1); got=$?
  if [ "$got" = "$2" ]; then PASS=$((PASS+1)); echo "PASS $1 (exit $got)"
  else FAIL=$((FAIL+1)); echo "FAIL $1 (want $2, got $got)"; fi
}

r=$(new_repo draft); p=$(git -C "$r" rev-parse HEAD); change "$r" drafts/a.md; expect "draft-only change skips" 0 "$r" "$p"
r=$(new_repo pub); p=$(git -C "$r" rev-parse HEAD); change "$r" published/new.md; expect "published-only change skips" 0 "$r" "$p"
r=$(new_repo readme); p=$(git -C "$r" rev-parse HEAD); change "$r" README.md; expect "root markdown change skips" 0 "$r" "$p"
r=$(new_repo nested); p=$(git -C "$r" rev-parse HEAD); change "$r" drafts/page.html; expect "html inside drafts/ skips" 0 "$r" "$p"
r=$(new_repo index); p=$(git -C "$r" rev-parse HEAD); change "$r" index.html; expect "index.html change builds" 1 "$r" "$p"
r=$(new_repo rootpage); p=$(git -C "$r" rev-parse HEAD); change "$r" about.html; expect "new root page builds" 1 "$r" "$p"
r=$(new_repo assets); p=$(git -C "$r" rev-parse HEAD); change "$r" assets/logo.svg; expect "assets/ change builds" 1 "$r" "$p"
r=$(new_repo cfg); p=$(git -C "$r" rev-parse HEAD); change "$r" vercel.json; expect "vercel.json change builds" 1 "$r" "$p"
r=$(new_repo self); p=$(git -C "$r" rev-parse HEAD); change "$r" scripts/vercel-ignore.sh; expect "ignore script change builds" 1 "$r" "$p"
r=$(new_repo mixed); p=$(git -C "$r" rev-parse HEAD); change "$r" drafts/a.md; change "$r" index.html; expect "mixed commit builds" 1 "$r" "$p"
r=$(new_repo nobase);                                        expect "no previous deploy sha builds"      1 "$r"
# Previous deploy SHA reachable: index changed two commits back, then a draft.
r=$(new_repo prev); p=$(git -C "$r" rev-parse HEAD)
change "$r" index.html; change "$r" drafts/a.md;              expect "change since previous deploy builds" 1 "$r" "$p"
r=$(new_repo prevskip); p=$(git -C "$r" rev-parse HEAD)
change "$r" drafts/a.md; change "$r" published/b.md;         expect "drafts since previous deploy skip"  0 "$r" "$p"
# Unreachable previous SHA builds: no HEAD^ fallback, which can miss earlier commits.
r=$(new_repo badprev); change "$r" drafts/a.md;              expect "unreachable prev builds"           1 "$r" 0123456789abcdef0123456789abcdef01234567

# The case the HEAD^ fallback got wrong: last deploy unreachable, then a page
# change followed by a draft in one push. HEAD^ sees only the draft.
r=$(new_repo codethendraft); change "$r" index.html; change "$r" drafts/a.md; expect "page then draft, unreachable prev, builds" 1 "$r" 0123456789abcdef0123456789abcdef01234567

echo "passed $PASS, failed $FAIL"
[ "$FAIL" = 0 ]
