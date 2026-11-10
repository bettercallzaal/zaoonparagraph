#!/usr/bin/env python3
"""build-socials.py - one edition's socials from the live edition, checked, as a sheet.

    python3 automation/build-socials.py <post-id> <spec.json>                  sheet HTML on stdout
    python3 automation/build-socials.py <post-id> <spec.json> --json           checked blocks as JSON
    python3 automation/build-socials.py <post-id> <spec.json> --write-drafts   also puts the X post,
                                                                               X Article and LinkedIn
                                                                               into Content as drafts

The spec is one JSON file per edition, drafts/socials/<date>-day-<n>.json, with the text of
each channel. The only token it may carry is {edition}, which becomes the live URL built from
the slug Paragraph assigned. A token left in a block refuses the whole run, so no slot can
reach a paste block (the Day 264 lesson). Day 304 and Day 305 were each built by a one-off
script; this replaces those.

Checks, every one of which refuses the run:
  the post is published and the Day number in its title is the spec's day
  every block is present, non-empty, and carries no slot, dash, emoji, hashtag or retired name
  the X post fits 280 on X, where each link counts 23
  the LinkedIn body has no link (Zaal, 29 Oct: links go in the first comment)
  every block that should carry the edition link does
  every number, handle, quote and link is in the live edition (check-social-facts.py)
  every link answers 200

--write-drafts writes to Paragraph, so it runs only on Zaal's word, once per edition. It makes
the edition's bucket, refuses if the bucket already holds content (Day 304 had three agent
drafts in its bucket; a second set would double them; the edition itself, a bucket member
since 3 Nov 2026, does not count), creates three drafts with
POST /v1/content, which only drafts, and reads each back. It never sends, schedules or
publishes, and never updates a draft: an update erases a LinkedIn first comment (31 Oct).
Paragraph only since 3 Nov 2026 (Zaal): the X post, X Article and LinkedIn are Paragraph drafts that
Zaal publishes in Content, and the LinkedIn first comment is the one thing he pastes. There are no
Firefly, Telegram, Discord, Facebook or group-chat paste blocks. An older spec that still carries
those keys runs; they are ignored and never checked or shown.

Exit 0 done. Exit 1 refused. Exit 2 could not run.
"""
import html, importlib.util, json, os, re, sys, urllib.error, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
API = os.environ.get("PARAGRAPH_API_BASE", "https://public.api.paragraph.com/api/v1").rstrip("/")
PUB = os.environ.get("PARAGRAPH_PUB_BASE", "https://paragraph.com/@thezao/")
UA = "zaoonparagraph-build-socials/1.0"   # a bare urllib User-Agent gets a 403 from this API

# key, label, carries the edition link
BLOCKS = [
    ("x_post", "1. X post (Paragraph draft)", True),
    ("x_article_title", "2. X Article headline (Paragraph draft)", False),
    ("x_article", "3. X Article body (Paragraph draft)", True),
    ("linkedin", "4. LinkedIn body, no link (Paragraph draft)", False),
    ("linkedin_comment", "5. LinkedIn first comment, paste after you publish", True),
]
X_CAP = 280
RETIRED = re.compile(r"(?i:magnetiq|songjam|acadia rising|artizen)|\bSANG\b")   # SANG in capitals only: "sang" is a word
SLOT = re.compile(r"\[(?:FILL|CUT|CHECK|TODO|LINK|TK)\b|\{[^}]*\}|\bTODO\b|\bXXX\b", re.I)
DASH = re.compile("[–—]")
EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿️]")
URL_RE = re.compile(r"https?://[^\s)\]>\"']+")
TRAILING = ".,!?;:)]}'\""


def die(msg, code=1):
    print(msg, file=sys.stderr)
    sys.exit(code)


def load(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, file))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def api_key():
    key = os.environ.get("PARAGRAPH_API_KEY")
    if key:
        return key
    extra = os.environ.get("PARAGRAPH_ENV_FILE")
    for path in [os.path.join(ROOT, ".env")] + ([os.path.expanduser(extra)] if extra else []):
        if os.path.isfile(path):
            for line in open(path):
                m = re.match(r'\s*(?:export\s+)?PARAGRAPH_API_KEY\s*=\s*"?([^"\s]+)"?', line)
                if m:
                    return m.group(1)
    die("CANNOT RUN: no PARAGRAPH_API_KEY in the environment or .env. From a worktree, set PARAGRAPH_ENV_FILE.", 2)


def call(method, path, data=None):
    headers = {"Authorization": "Bearer " + api_key(), "User-Agent": UA, "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(API + path, data=json.dumps(data).encode() if data is not None else None,
                                 headers=headers, method=method)
    try:
        return json.load(urllib.request.urlopen(req, timeout=40))
    except urllib.error.HTTPError as e:
        die("CANNOT RUN: %s %s answered %d: %s" % (method, path, e.code, e.read().decode("utf-8", "replace")[:300]), 2)
    except (urllib.error.URLError, OSError, ValueError) as e:
        die("CANNOT RUN: %s %s failed: %s" % (method, path, e), 2)


def link_code(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        return urllib.request.urlopen(req, timeout=20).status
    except urllib.error.HTTPError as e:
        return e.code
    except (urllib.error.URLError, OSError):
        return 0


def x_length(text):
    n, last = 0, 0
    for m in URL_RE.finditer(text):
        link = m.group(0).rstrip(TRAILING)
        n += len(text[last:m.start()]) + 23
        last = m.start() + len(link)
    return n + len(text[last:])


def build(pid, spec_path):
    try:
        spec = json.load(open(spec_path))
    except (OSError, ValueError) as e:
        die("CANNOT RUN: the spec %s could not be read: %s" % (spec_path, e), 2)
    post = call("GET", "/posts/%s?includeContent=true" % pid)
    post = post.get("post", post)
    if not post.get("id"):
        die("REFUSED: no post %s" % pid)
    if post.get("status") != "published":
        die("REFUSED: post %s is %r, not published, so there is no edition link yet" % (pid, post.get("status")))
    slug = (post.get("slug") or "").strip()
    if not slug:
        die("REFUSED: post %s carries no slug, so no URL can be built" % pid)
    url = PUB + slug
    title = post.get("title") or ""
    m = re.search(r"Day (\d{1,3})\b", title)
    if not m or int(m.group(1)) != int(spec.get("day", -1)):
        die("REFUSED: the post title %r is not Day %s, the spec's day" % (title, spec.get("day")))
    body_md = post.get("markdown") or ""
    if not body_md.strip():
        die("CANNOT RUN: the API returned no body, so the fact check cannot run", 2)

    texts, errs = {}, []
    for key, label, needs_link in BLOCKS:
        raw = spec.get("blocks", {}).get(key)
        if not isinstance(raw, str) or not raw.strip():
            errs.append("%s: missing" % label)
            continue
        text = raw.replace("{edition}", url).strip()
        texts[key] = text
        for rx, what in ((SLOT, "slot"), (DASH, "dash"), (EMOJI, "emoji"), (RETIRED, "retired name")):
            hit = rx.search(text)
            if hit:
                errs.append("%s: %s %r" % (label, what, hit.group(0)))
        if re.search(r"(?<![\w/])#\w", text):
            errs.append("%s: hashtag" % label)
        if needs_link and url not in text:
            errs.append("%s: no edition link" % label)
    if errs:
        die("REFUSED:\n  " + "\n  ".join(errs))

    if x_length(texts["x_post"]) > X_CAP:
        errs.append("x_post is %d on X, over %d" % (x_length(texts["x_post"]), X_CAP))
    if load("stage_socials", "stage-socials.py").ANY_LINK_RE.search(texts["linkedin"]):
        errs.append("the LinkedIn body has a link. Links go in the first comment.")
    if "\n" in texts["x_article_title"]:
        errs.append("the X Article headline is more than one line")

    pairs = [(label, texts[key]) for key, label, _ in BLOCKS]
    # The edition's own URL is a fact of the edition even though its body does not carry it.
    checked, missing = load("social_facts", "check-social-facts.py").check(title + "\n" + body_md + "\n" + url, pairs)
    if checked == 0:
        die("CANNOT RUN: the fact check found no facts, so it checked nothing", 2)
    errs += ["not in the edition: " + x for x in missing]

    links = sorted({u.rstrip(TRAILING) for t in texts.values() for u in URL_RE.findall(t)})
    for link in links:
        code = link_code(link)
        if code != 200:
            code = link_code(link)   # once more: a slow answer is not a dead link
        if code != 200:
            errs.append("link %s answered %s" % (link, code))
    if errs:
        die("REFUSED:\n  " + "\n  ".join(errs))

    return {"pid": pid, "title": title, "url": url, "day": int(m.group(1)), "texts": texts,
            "facts": checked, "links": len(links)}


def sheet(r):
    t = r["texts"]
    out = ["<p>%s socials for your read. Nothing here is sent, scheduled or posted. Edition: <a href=\"%s\">%s</a></p>"
           % (html.escape(r["title"]), html.escape(r["url"]), html.escape(r["url"])),
           "<p>Checked: %d facts found in the live edition, %d links answer 200. X post %d on X.</p>"
           % (r["facts"], r["links"], x_length(t["x_post"]))]
    for key, label, _ in BLOCKS:
        out.append("<h2>%s</h2>" % html.escape(label))
        out.append('<pre class="msg">%s</pre>' % html.escape(t[key]))
    return "\n".join(out) + "\n"


def write_drafts(r):
    bucket = call("POST", "/posts/%s/bucket" % r["pid"], {})
    bid = bucket.get("id") or bucket.get("bucketId") or (bucket.get("bucket") or {}).get("id")
    if not bid:
        die("CANNOT RUN: the bucket call returned no id", 2)
    members = call("GET", "/buckets/%s" % bid).get("members")
    if members is None:
        die("CANNOT RUN: the bucket read carried no members list, so a double cannot be ruled out", 2)
    # Since 3 Nov 2026 the edition itself is a member of its own bucket, so it does not count.
    members = [m for m in members if not (m.get("kind") == "post" and m.get("id") == r["pid"])]
    if members:
        die("REFUSED: bucket %s already holds %d item(s). Nothing written. Read them in Content first." % (bid, len(members)))
    t, day = r["texts"], r["day"]
    pieces = [
        ("tweet", "Day %d X post" % day, {"text": t["x_post"]}),
        ("x_article", "Day %d X Article" % day, {"title": t["x_article_title"], "body": t["x_article"], "canonicalUrl": r["url"]}),
        ("linkedin", "Day %d LinkedIn" % day, {"text": t["linkedin"]}),
    ]
    bad = 0
    for kind, title, body in pieces:
        made = call("POST", "/content", {"kind": kind, "title": title, "body": body, "bucketId": bid})
        cid = made.get("id") or (made.get("content") or {}).get("id")
        if not cid:
            die("CANNOT RUN: creating the %s draft returned no id; stopped before the rest" % kind, 2)
        got = call("GET", "/content/%s" % cid)
        got = got.get("content", got)
        same = all((got.get("body") or {}).get(k) == v for k, v in body.items())
        ok = same and got.get("bucketId") == bid and got.get("status") in ("draft", None) and not got.get("scheduledAt")
        bad += not ok
        print("%s  %s draft %s: status %s, body matches %s, scheduled %s"
              % ("PASS" if ok else "FAIL", kind, cid, got.get("status"), same, got.get("scheduledAt")))
    print("bucket %s. Nothing was sent. Publish each in Content, then paste the LinkedIn first comment." % bid)
    return 1 if bad else 0


def main():
    args = sys.argv[1:]
    flags = [a for a in args if a.startswith("--")]
    pos = [a for a in args if not a.startswith("--")]
    if len(pos) != 2 or len(flags) > 1 or (flags and flags[0] not in ("--json", "--write-drafts")):
        die("usage: build-socials.py <post-id> <spec.json> [--json | --write-drafts]", 2)
    r = build(*pos)
    if flags == ["--json"]:
        print(json.dumps(r, indent=2))
        return 0
    if flags == ["--write-drafts"]:
        return write_drafts(r)
    sys.stdout.write(sheet(r))
    return 0


if __name__ == "__main__":
    sys.exit(main())
