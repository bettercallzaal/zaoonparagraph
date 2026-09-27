#!/usr/bin/env python3
"""test-stage-socials.py - the Firefly rule, run against every socials file in the repo.

    python3 automation/test-stage-socials.py

No network and no post id. It feeds each drafts/socials/*-day-NNN.socials.md through the same
functions stage-socials.py uses, with a stand-in URL as long as a real one, and fails if any
Firefly post would be refused or would run over the cap on X. Exit 0 all pass, 1 any fail,
2 nothing to test.
"""
import glob, importlib.util, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("stage", os.path.join(HERE, "stage-socials.py"))
stage = importlib.util.module_from_spec(spec); spec.loader.exec_module(stage)

URL = stage.PUB + "year-of-the-zabal-day-000-a-slug-about-as-long-as-the-real-ones-are"

def main():
    # controls first: the function must swap when the link is there and append when it is not
    b, n = stage.firefly("see https://zaostock.com/program now", URL)
    assert b == "see %s now" % URL and n == len("see  now") + 23, "control: swap"
    b, n = stage.firefly("no link here", URL)
    assert b.endswith("\n\n" + URL) and n == len("no link here") + 2 + 23, "control: append"
    b, n = stage.firefly("x" * 300, URL)
    assert n > stage.FIREFLY_CAP, "control: an over-long post must measure over the cap"

    files = sorted(glob.glob(os.path.join(stage.ROOT, "drafts/socials/*-day-*.socials.md")))
    if not files:
        print("UNKNOWN: no socials files found"); sys.exit(2)
    bad = 0
    for f in files:
        secs = stage.sections(open(f).read())
        name = os.path.basename(f)
        if 1 not in secs:
            print("SKIP  %s: no channel 1, an older layout" % name); continue
        body, on_x = stage.firefly(secs[1][1], URL)
        ok = on_x <= stage.FIREFLY_CAP and URL in body
        bad += 0 if ok else 1
        print("%s  %s: %d on X" % ("PASS" if ok else "FAIL", name, on_x))
    print("%d of %d files checked, %d failed" % (len(files), len(files), bad))
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
