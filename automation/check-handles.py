#!/usr/bin/env python3
"""Fail a draft that tags a handle nobody verified.

WHY THIS EXISTS. On 2026-09-07 three handles were nearly published against the
wrong human being:

  @dr_bruce     an occupational medicine specialist, 91 followers, no connection
                to ZAO. Found by searching, looked right, was a stranger.
  @candytoybox  0 followers, not Candy. Her real handle is @CandyToyBoxYT1 and
                the YT1 suffix was unguessable.
  @NessyNFT     Nessy's account was hacked. She must never be tagged.

A fourth, @MCFLYETH, was rated "likely" - which felt safe and was wrong. A hedged
wrong still ships if nobody checks it.

Every one of those corrections came from Zaal, not from better searching. So the
rule is: a handle is either confirmed by someone who knows the person, or it stays
plain prose. This script is that rule made mechanical, because honor-system rules
in this estate run at 3-40% and enforced ones run at ~100%.

Usage:  check-handles.py <file> [<file> ...]
Exit 0 = every tagged handle is verified. Exit 1 = at least one is not.
"""
import csv, io, os, re, sys

CSV = os.path.expanduser("~/zao-vault/people/handles.csv")

# Handles that are not people and never need CRM verification.
SAFE = {
    "zao", "zabal", "purple", "base", "music", "build", "founders",  # FC channels
    "handle", "example", "someone", "yourhandle",
}

def load():
    ok, banned, hedged = {}, {}, {}
    if not os.path.exists(CSV):
        print(f"FAIL  cannot read {CSV} - refusing to pass a draft I cannot check")
        sys.exit(1)
    for r in csv.DictReader(io.open(CSV, encoding="utf-8")):
        h = (r.get("x_handle") or "").strip().lstrip("@").lower()
        if not h:
            continue
        c = (r.get("confidence") or "").strip().lower()
        name, note = r.get("name", "?"), (r.get("notes") or "")[:90]
        if c == "verified":
            ok[h] = name
        elif c in ("wrong", "do-not-tag", "do-not-link"):
            banned[h] = (name, note)
        else:
            hedged[h] = (name, c)
    return ok, banned, hedged

def main():
    if len(sys.argv) < 2:
        print(__doc__.strip().splitlines()[-3]); sys.exit(2)
    ok, banned, hedged = load()
    fail = warn = 0
    for path in sys.argv[1:]:
        text = io.open(path, encoding="utf-8").read()
        text = re.sub(r"<!--.*?-->", "", text, flags=re.S)          # skip comments
        text = re.sub(r"https?://\S+", "", text)                     # skip URLs
        seen = []
        for m in re.findall(r"(?<![\w/])@([A-Za-z0-9_]{2,15})\b", text):
            if m.lower() in SAFE or m.lower() in seen:
                continue
            seen.append(m.lower())
            h = m.lower()
            if h in banned:
                who, note = banned[h]
                print(f"FAIL  {os.path.basename(path)}: @{m} is BANNED - {who}. {note}")
                fail += 1
            elif h in ok:
                print(f"ok    {os.path.basename(path)}: @{m} -> {ok[h]}")
            elif h in hedged:
                who, c = hedged[h]
                print(f"WARN  {os.path.basename(path)}: @{m} is '{c}', not verified ({who}). "
                      f"A hedged wrong still ships. Confirm with a human or use plain prose.")
                warn += 1
            else:
                print(f"FAIL  {os.path.basename(path)}: @{m} is NOT in the CRM at all. "
                      f"Verify it and add a row, or write the name as plain prose.")
                fail += 1
    print()
    if fail:
        print(f"BLOCKED - {fail} unverified or banned handle(s). "
              f"A handle is confirmed by someone who knows the person, or it stays prose.")
        return 1
    print(f"All tagged handles verified against the CRM." + (f" {warn} warning(s)." if warn else ""))
    return 0

if __name__ == "__main__":
    sys.exit(main())
