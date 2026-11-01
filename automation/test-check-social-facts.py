#!/usr/bin/env python3
"""Self-test for check-social-facts.py: cases it must pass and cases it must refuse.

    python3 automation/test-check-social-facts.py

Exit 0 all pass, 1 any wrong.
"""
import os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
TOOL = os.path.join(HERE, "check-social-facts.py")
EDITION = """# Year of the ZABAL - Day 304

zm

Find Gigi on X at [@gigi_gw_](https://x.com/gigi_gw_). She said "the music and humor mainly". Also @esc\\_aped\\_ here.

The full conversation is about 38 minutes: [https://bczyapz.com/22](https://bczyapz.com/22)
"""
CASES = [
    (0, "facts that are in the edition", 'ZM. @gigi_gw_ said "the music and humor mainly", 38 minutes https://bczyapz.com/22'),
    (0, "the Day number from the title", "ZM. day 304"),
    (0, "the edition and share links", "https://paragraph.com/@thezao/year-of-the-zabal-day-304 https://t.me/share/url?url=x"),
    (1, "an invented number", "ZM. 200 builders"),
    (1, "a handle one character short", "ZM. ask @gigi_gw"),
    (1, "a misquote", 'ZM. she said "i love crypto"'),
    (1, "a link not in the edition", "ZM. https://bczyapz.com/23"),
    (2, "no facts at all", "ZM. just words."),
    (0, "a handle the API body escaped", "ZM. ask @esc_aped_"),
]

def run(text):
    with tempfile.TemporaryDirectory() as d:
        ed, so = os.path.join(d, "ed.md"), os.path.join(d, "so.txt")
        open(ed, "w").write(EDITION); open(so, "w").write(text)
        return subprocess.run([sys.executable, "-I", TOOL, ed, so], capture_output=True).returncode

wrong = 0
for want, name, text in CASES:
    got = run(text)
    print("%s %s" % ("ok   " if got == want else "WRONG", name + ("" if got == want else " (wanted %d, got %d)" % (want, got))))
    wrong += got != want
print("fact check self-test %s" % ("passed" if not wrong else "FAILED"))
sys.exit(1 if wrong else 0)
