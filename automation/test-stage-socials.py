#!/usr/bin/env python3
"""test-stage-socials.py - the Firefly rule and the refusal path, with no network.

    python3 automation/test-stage-socials.py

Three parts. Part 1 checks the length count against hand-counted strings. Part 2 runs the REAL
main() of stage-socials.py in a child process, against a made-up edition in a temp directory and
a stand-in for the one network call, and reads its exit code and stderr. Part 3 feeds every
socials file in the repo through the Firefly rule.

Part 2 exists because the first version of this test compared numbers itself and never ran
main(), so removing the refusal from the script still printed "0 failed".

Exit 0 all pass, 1 any fail, 2 nothing to test.
"""
import glob, importlib.util, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "stage-socials.py")
spec = importlib.util.spec_from_file_location("stage", SCRIPT)
stage = importlib.util.module_from_spec(spec); spec.loader.exec_module(stage)

URL = stage.PUB + "year-of-the-zabal-day-000-a-slug-about-as-long-as-the-real-ones-are"
FAILS = []

def check(label, got, want):
    ok = got == want
    print("%s  %s: got %r, want %r" % ("PASS" if ok else "FAIL", label, got, want))
    if not ok: FAILS.append(label)

def part1():
    print("-- part 1: the length count")
    x = stage.x_length
    check("plain text", x("hello"), 5)
    check("one link", x("a https://zaostock.com/live b"), 2 + 23 + 2)
    check("link then full stop", x("see https://zaostock.com/live."), 4 + 23 + 1)
    check("link then bang", x("go https://zaostock.com/live!"), 3 + 23 + 1)
    check("link in brackets", x("(https://zaostock.com/live)"), 1 + 23 + 1)
    check("link then comma and text", x("at https://zaostock.com/live, noon"), 3 + 23 + 6)
    check("two links", x("https://a.co/x https://b.co/y"), 23 + 1 + 23)
    check("the reviewer's case, 281", x("x" * 257 + "https://zaostock.com/live!"), 257 + 23 + 1)
    b, n = stage.firefly("see https://zaostock.com/program now", URL)
    check("swap", (b, n), ("see %s now" % URL, 4 + 23 + 4))
    b, n = stage.firefly("no link here", URL)
    check("append", (b, n), ("no link here\n\n" + URL, 12 + 2 + 23))
    b, n = stage.firefly("https://zaostock.com/program and https://zaostock.com/program", URL)
    check("swap takes the first only", b, URL + " and https://zaostock.com/program")

RUNNER = """
import importlib.util, sys
spec = importlib.util.spec_from_file_location("stage", %r)
stage = importlib.util.module_from_spec(spec); spec.loader.exec_module(stage)
stage.ROOT = %r
stage.get_post = lambda pid: {"id": pid, "status": %r, "slug": "a-made-up-edition",
                              "title": "Year of the ZABAL - Day 999"}
sys.argv = ["stage-socials.py", "madeupid", "--dry-run"]
stage.main()
"""

def edition(root, firefly_body):
    d = os.path.join(root, "drafts", "socials"); os.makedirs(d)
    chans = ["## 1. Firefly\n\n%s\n" % firefly_body] + ["## %d. Channel\n\nZM. text.\n" % n for n in range(2, 7)]
    open(os.path.join(d, "2026-01-01-day-999.socials.md"), "w").write("# t\n\n" + "\n".join(chans))
    for suf in (".linkedin.md", ".x-article.md"):
        open(os.path.join(d, "2026-01-01-day-999" + suf), "w").write("# t\n\n## Draft\n\nZM. text.\n")

def run_main(firefly_body, status="published"):
    with tempfile.TemporaryDirectory() as root:
        edition(root, firefly_body)
        r = subprocess.run([sys.executable, "-c", RUNNER % (SCRIPT, root, status)],
                           capture_output=True, text=True)
    return r.returncode, r.stdout, r.stderr

def part2():
    print("-- part 2: the real main(), in a child process")
    code, out, err = run_main("ZM. short post.")
    check("a short Firefly post stages, exit", code, 0)
    check("and its row says it is linked", "link=True" in out.splitlines()[0] if out else False, True)
    code, out, err = run_main("ZM. " + "x" * 300)
    check("an over-cap Firefly post is refused, exit", code, 1)
    check("and stderr says REFUSED", "REFUSED" in err, True)
    # 254 of text, a blank line, a link: 254 + 2 + 23 = 279, under. One more character glued
    # to nothing pushes it; this pins the boundary on both sides.
    code, out, err = run_main("x" * 255)
    check("exactly 280 on X stages, exit", code, 0)
    code, out, err = run_main("x" * 256)
    check("281 on X is refused, exit", code, 1)
    # text, a space, a link, a bang, then the appended blank line and edition link.
    # 230 + 1 + 23 + 1 + 2 + 23 = 280 stages. 231 gives 281 and is refused. A count that
    # swallows the bang into the link scores the second one 280 and lets it through.
    code, out, err = run_main("x" * 230 + " https://zaostock.com/live!")
    check("link with a glued bang, 280 on X, stages, exit", code, 0)
    code, out, err = run_main("x" * 231 + " https://zaostock.com/live!")
    check("link with a glued bang, 281 on X, refused, exit", code, 1)
    code, out, err = run_main("ZM. short post.", status="draft")
    check("a draft is refused, exit", code, 1)
    check("and stderr says REFUSED", "REFUSED" in err, True)

def part3():
    print("-- part 3: every socials file in the repo")
    files = sorted(glob.glob(os.path.join(stage.ROOT, "drafts/socials/*-day-*.socials.md")))
    if not files:
        print("UNKNOWN: no socials files found"); sys.exit(2)
    for f in files:
        secs = stage.sections(open(f).read())
        name = os.path.basename(f)
        if 1 not in secs:
            print("SKIP  %s: no channel 1" % name); continue
        body, on_x = stage.firefly(secs[1][1], URL)
        ok = on_x <= stage.FIREFLY_CAP and URL in body
        print("%s  %s: %d on X" % ("PASS" if ok else "FAIL", name, on_x))
        if not ok: FAILS.append(name)
    print("%d files checked" % len(files))

if __name__ == "__main__":
    part1(); part2(); part3()
    print("\n%d failed: %s" % (len(FAILS), FAILS) if FAILS else "\nall passed")
    sys.exit(1 if FAILS else 0)
