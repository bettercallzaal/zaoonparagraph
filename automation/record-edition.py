#!/usr/bin/env python3
"""record-edition.py - put a live edition in the record: the job status.sh asks for.

    python3 automation/record-edition.py <post-id> [--dry-run]

Reads the post from the public API and its body from the live .md route, the same two
routes the backfill notes in published/README.md describe, then writes three things:
published/<date>-day-<n>.md, the id in automation/post-ids.json, and a row in both
tables of published/README.md. The date is the publish date in Eastern time.

It only reads from Paragraph. --dry-run prints what it would write and writes nothing.
Committing the result stays a separate step.

Exit 0 recorded (or dry run printed). Exit 1 refused. Exit 2 could not run.
"""
import datetime, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://public.api.paragraph.com/api/v1/posts/"
LIVE = "https://paragraph.com/@thezao/"
UA = "zaoonparagraph-record-edition/1.0"   # a bare urllib User-Agent gets a 403 here

def die(msg, code=2):
    print(msg, file=sys.stderr); sys.exit(code)

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        return urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
    except Exception as e:
        die("CANNOT RUN: could not read %s: %s" % (url, e))

def eastern(ms):
    """UTC milliseconds to Eastern time, by the US rule, since Windows Python has no tzdata."""
    utc = datetime.datetime.fromtimestamp(int(ms) / 1000, datetime.timezone.utc)
    def sunday(month, nth):
        first = datetime.datetime(utc.year, month, 1, tzinfo=datetime.timezone.utc)
        return first + datetime.timedelta(days=(6 - first.weekday()) % 7 + 7 * (nth - 1))
    start = sunday(3, 2) + datetime.timedelta(hours=7)     # 2 AM EST
    end = sunday(11, 1) + datetime.timedelta(hours=6)      # 2 AM EDT
    return utc - datetime.timedelta(hours=4 if start <= utc < end else 5)

def clean_body(md, subtitle):
    """The live route, less the title, subtitle, avatar, cover and related-posts lines."""
    lines = md.replace("\r\n", "\n").split("\n")
    i = 0
    while i < len(lines):                                   # everything up to the zm opener
        if re.fullmatch(r"\s*zm[.!]?\s*", lines[i], re.I):
            break
        i += 1
    if i == len(lines):                                     # an announcement has no opener
        i = 0
        while i < len(lines) and (not lines[i].strip() or lines[i].startswith("# ")
                                  or lines[i].startswith("![") or lines[i].strip() == subtitle.strip()):
            i += 1
    body = lines[i:]
    for k, line in enumerate(body):                         # the site's footer starts here
        if re.match(r"#+\s*Subscribe to ", line):
            body = body[:k]
            break
    j = len(body)
    while j > 0 and (not body[j - 1].strip() or re.match(r"- \[.*\]\(/@", body[j - 1])
                     or re.fullmatch(r"#+\s*(Top|Latest|Recommended|More).*", body[j - 1])
                     or body[j - 1].strip().lower() in ("top", "latest")):
        j -= 1
    return "\n".join(body[:j]).strip() + "\n"

def insert_after_last(text, pattern, row):
    hits = list(re.finditer(pattern, text, re.M))
    if not hits:
        return None
    at = hits[-1].end()
    return text[:at] + "\n" + row + text[at:]

def main():
    if len(sys.argv) < 2 or not re.fullmatch(r"[A-Za-z0-9_-]{6,64}", sys.argv[1]):
        die("usage: record-edition.py <post-id> [--dry-run]")
    pid, dry = sys.argv[1], "--dry-run" in sys.argv[2:]
    d = json.loads(fetch(API + pid))
    d = d.get("post", d)
    if not d.get("id"):
        die("REFUSED: post %s is not live, so there is nothing to record yet." % pid, 1)
    title, slug, subtitle = d.get("title") or "", d.get("slug") or "", d.get("subtitle") or ""
    if not slug or not d.get("publishedAt"):
        die("REFUSED: post %s has no slug or publish time." % pid, 1)
    when = eastern(d["publishedAt"])
    date = when.strftime("%Y-%m-%d")
    m = re.search(r"Day (\d{1,3})\b", title)
    day = m.group(1) if m else ""
    name = "%s-day-%s.md" % (date, day) if day else "%s-%s.md" % (date, slug)
    rel = "published/" + name
    path = os.path.join(ROOT, rel)
    map_file = os.path.join(ROOT, "automation", "post-ids.json")
    ids = json.load(open(map_file, encoding="utf-8"))
    if not dry:
        if os.path.exists(path):
            die("REFUSED: %s already exists." % rel, 1)
        if pid in ids.values():
            die("REFUSED: post %s is already tracked in automation/post-ids.json." % pid, 1)
    body = clean_body(fetch(LIVE + slug + ".md"), subtitle)
    if "-->" in subtitle:
        die("REFUSED: the subtitle would break the record header.", 1)
    now_ms = datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000
    header = ("<!-- Published %s ET (publishedAt from public.api.paragraph.com). Recorded %s from the "
              "dashboard. Paragraph post id %s, slug %s. Body from the live .md route, subtitle, byline, "
              "avatar, cover and related-posts lines stripped. Subtitle: %s -->"
              % (when.strftime("%Y-%m-%dT%H:%M"), eastern(now_ms).strftime("%Y-%m-%d"), pid, slug, subtitle))
    record = "# %s\n\n%s\n\n%s" % (title, header, body)
    row1 = "| `%s` | %s | %s | %s | `%s` |" % (name, date, day or "-", title, pid)
    row2 = "| %s | %s | %s%s |" % (day or "-", subtitle, LIVE, slug)

    if dry:
        print("DRY RUN, nothing written.")
        print("would write %s (%d words)" % (rel, len(body.split())))
        print("would add %s to automation/post-ids.json" % pid)
        print("would add to published/README.md:\n  %s\n  %s" % (row1, row2))
        print("--- record ---")
        print(record)
        return

    readme_path = os.path.join(ROOT, "published", "README.md")
    readme = open(readme_path, encoding="utf-8", newline="").read()
    crlf = "\r\n" in readme                                  # a Windows checkout
    readme = readme.replace("\r\n", "\n")
    # Both tables or neither: check before the first write.
    readme = insert_after_last(readme, r"^\| `[^`]+\.md` \|.*$", row1)
    readme = readme and insert_after_last(readme, r"^\| [\d-]+ \| .* \| https://paragraph\.com/.*\|$", row2)
    if not readme:
        die("CANNOT RUN: could not find the two tables in published/README.md.")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(record)
    ids[rel] = pid
    with open(map_file, "w", encoding="utf-8", newline="\n") as f:
        json.dump(ids, f, indent=2, sort_keys=True); f.write("\n")
    with open(readme_path, "w", encoding="utf-8", newline="") as f:
        f.write(readme.replace("\n", "\r\n") if crlf else readme)
    print("Recorded %s, post id %s." % (rel, pid))
    print("Commit and PR this on its own: it is a record of what went out.")

if __name__ == "__main__":
    main()
