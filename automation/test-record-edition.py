#!/usr/bin/env python3
"""test-record-edition.py - the record writer and the socials --json output, with no network.

    python3 -I automation/test-record-edition.py
"""
import contextlib, importlib.util, io, json, os, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
FAILED = []

def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, filename))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod

def check(name, got, want):
    print(("ok    " if got == want else "WRONG ") + name)
    if got != want:
        print("  got:  %r\n  want: %r" % (got, want)); FAILED.append(name)

def run_main(mod, argv):
    """(exit code, stdout, stderr) of mod.main() under these arguments."""
    sys.argv, out, err, code = argv, io.StringIO(), io.StringIO(), 0
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        try:
            mod.main()
        except SystemExit as e:
            code = e.code or 0
    return code, out.getvalue(), err.getvalue()

rec = load("record", "record-edition.py")

# Eastern time, either side of the 2026 clock change on 1 Nov at 06:00 UTC.
check("EDT stays EDT", rec.eastern(1793479316957).strftime("%Y-%m-%dT%H:%M"), "2026-10-31T16:41")
check("EST after the change", rec.eastern(1793793600000).strftime("%Y-%m-%d %H"), "2026-11-04 07")

LIVE_MD = """# Year of the ZABAL - Day 304

The subtitle.

![Zaal avatar](https://example.com/a.png)

zm

year of the zabal day 304

The body.

- BetterCallZaal on behalf of the ZABAL Team

## Subscribe to The ZAO Newsletter

Thanks for subscribing.

Top  Latest

- [ October 30, 2026   Year of the ZABAL - Day 303  ](/@thezao/year-of-the-zabal-day-303)
"""
check("strips the header and the footer", rec.clean_body(LIVE_MD, "The subtitle."),
      "zm\n\nyear of the zabal day 304\n\nThe body.\n\n- BetterCallZaal on behalf of the ZABAL Team\n")

README = """# record

| File | Published | Day | Title | Post id |
|---|---|---|---|---|
| `2026-10-30-day-303.md` | 2026-10-30 | 303 | Year of the ZABAL - Day 303 | `Cc9VxTLyCifiWFU7yxah` |

| Day | Subtitle as published | Live URL |
|---|---|---|
| 303 | Old subtitle. | https://paragraph.com/@thezao/year-of-the-zabal-day-303 |

## Notes
"""
POST = {"id": "O92qHVhCVfCD92qSeM2I", "title": "Year of the ZABAL - Day 304", "slug": "year-of-the-zabal-day-304",
        "subtitle": "The subtitle.", "publishedAt": "1793479316957"}

with tempfile.TemporaryDirectory() as root:
    os.makedirs(os.path.join(root, "published")); os.makedirs(os.path.join(root, "automation"))
    readme = os.path.join(root, "published", "README.md")
    ids_file = os.path.join(root, "automation", "post-ids.json")
    with open(readme, "w", encoding="utf-8") as f: f.write(README)
    with open(ids_file, "w", encoding="utf-8") as f: f.write("{}\n")
    rec.ROOT = root
    rec.fetch = lambda url: LIVE_MD if url.endswith(".md") else json.dumps(POST)

    code, out, _ = run_main(rec, ["x", POST["id"], "--dry-run"])
    check("dry run exits 0", code, 0)
    check("dry run writes no file", os.listdir(os.path.join(root, "published")), ["README.md"])
    check("dry run leaves the ids alone", open(ids_file).read(), "{}\n")

    code, _, err = run_main(rec, ["x", POST["id"]])
    check("real run exits 0", code, 0)
    path = os.path.join(root, "published", "2026-10-31-day-304.md")
    record = open(path, encoding="utf-8").read()
    check("the record opens on the title", record.startswith("# Year of the ZABAL - Day 304\n\n<!-- Published 2026-10-31T16:41 ET"), True)
    check("the record ends on the body", record.endswith("ZABAL Team\n"), True)
    check("the id is tracked", json.load(open(ids_file))["published/2026-10-31-day-304.md"], POST["id"])
    after = open(readme, encoding="utf-8").read()
    check("row goes under the file table",
          "`Cc9VxTLyCifiWFU7yxah` |\n| `2026-10-31-day-304.md` | 2026-10-31 | 304 | Year of the ZABAL - Day 304 | `O92qHVhCVfCD92qSeM2I` |\n" in after, True)
    check("row goes under the subtitle table",
          "day-303 |\n| 304 | The subtitle. | https://paragraph.com/@thezao/year-of-the-zabal-day-304 |\n" in after, True)
    code, _, err = run_main(rec, ["x", POST["id"]])
    check("recording twice is refused", (code, "REFUSED" in err), (1, True))

    os.remove(path)
    with open(ids_file, "w", encoding="utf-8") as f: f.write("{}\n")
    rec.fetch = lambda url: json.dumps({"msg": "Post not found"})
    code, _, err = run_main(rec, ["x", POST["id"]])
    check("a post that is not live is refused", (code, "REFUSED" in err), (1, True))

# stage-socials.py --json: the blocks the dashboard shows.
stage = load("stage", "stage-socials.py")
with tempfile.TemporaryDirectory() as root:
    d = os.path.join(root, "drafts", "socials"); os.makedirs(d)
    chans = "\n".join("## %d. Channel\n\nZM. text.\n" % n for n in range(1, 7))
    open(os.path.join(d, "2026-01-01-day-999.socials.md"), "w").write("# t\n\n" + chans)
    for suf in (".linkedin.md", ".x-article.md"):
        open(os.path.join(d, "2026-01-01-day-999" + suf), "w").write("# t\n\n## Draft\n\nZM. text.\n")
    stage.ROOT = root
    stage.get_post = lambda pid: {"id": pid, "status": "published", "slug": "a-made-up-edition",
                                  "title": "Year of the ZABAL - Day 999", "markdown": "zm\n"}
    code, out, err = run_main(stage, ["x", "madeupid", "--json"])
    check("--json exits 0", code, 0)
    data = json.loads(out)
    check("--json carries the url", data["url"], "https://paragraph.com/@thezao/a-made-up-edition")
    check("--json carries every block", len(data["blocks"]), 9)

if FAILED:
    print("record edition self-test FAILED"); sys.exit(1)
print("record edition self-test passed")
