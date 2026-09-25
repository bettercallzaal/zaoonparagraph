#!/usr/bin/env python3
"""stage-socials.py - the moment an edition publishes, turn the drafted socials into one
clipboard page with the real URL in them.

    python3 automation/stage-socials.py <post-id> [--dry-run]

Why this exists. The socials are written before the edition publishes, so they cannot carry
its URL, and a slot saying "PUT THE URL HERE" inside a block Zaal pastes ends up pasted
(2026-09-21, the Day 264 placeholder that reached a live preview). So the drafts carry no
slot at all, and this script is the other half: it reads the published post, derives the
URL from the slug Paragraph assigned, inserts it per channel, and refuses if the post is
not published yet. One command between "published" and "ready to post".

Exit 0 the page is written. Exit 1 the post is not ready or a rule did not apply.
Exit 2 the check could not run.
"""
import json, os, re, subprocess, sys, urllib.request, html, glob

API = "https://public.api.paragraph.com/api/v1/posts/"
PUB = "https://paragraph.com/@thezao/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIREFLY_CAP = 280

def die(msg, code=2):
    print(msg, file=sys.stderr); sys.exit(code)

def env_key():
    key = os.environ.get("PARAGRAPH_API_KEY")
    if key: return key
    for p in (os.path.join(ROOT, ".env"), os.path.expanduser("~/Desktop/repos/zaoonparagraph/.env")):
        if os.path.isfile(p):
            for line in open(p):
                m = re.match(r'\s*(?:export\s+)?PARAGRAPH_API_KEY\s*=\s*"?([^"\s]+)"?', line)
                if m: return m.group(1)
    die("CANNOT RUN: no PARAGRAPH_API_KEY in the environment or in .env")

def get_post(pid):
    # A bare urllib User-Agent gets a 403 from this API where curl does not, so it is set
    # explicitly. Measured 2026-09-25: Python-urllib/3.x 403, this string 200.
    req = urllib.request.Request(API + pid, headers={
        "Authorization": "Bearer " + env_key(),
        "User-Agent": "zaoonparagraph-stage-socials/1.0",
        "Accept": "application/json",
    })
    try:
        body = urllib.request.urlopen(req, timeout=30).read().decode()
    except Exception as e:
        die("CANNOT RUN: the API call failed: %s" % e)
    d = json.loads(body)
    return d.get("post", d)

def sections(md):
    """## heading -> body, for the socials file."""
    out = {}
    for m in re.finditer(r'^## (\d+)\.\s*(.+?)\n(.*?)(?=^## |\Z)', md, re.S | re.M):
        body = re.sub(r'<!--.*?-->', '', m.group(3), flags=re.S).strip()
        out[int(m.group(1))] = (m.group(2).strip(), body)
    return out

def draft_block(md):
    m = re.search(r'^## Draft.*?\n(.*?)(?=^## |\Z)', md, re.S | re.M)
    return m.group(1).strip() if m else None

def main():
    if len(sys.argv) < 2: die("usage: stage-socials.py <post-id> [--dry-run]")
    pid, dry = sys.argv[1], "--dry-run" in sys.argv[2:]
    p = get_post(pid)
    if not p.get("id"): die("REFUSED: no post %s. A deleted draft answers with nulls." % pid, 1)
    if p.get("status") != "published":
        die("REFUSED: post %s is status %r, not published. Nothing to link yet." % (pid, p.get("status")), 1)
    slug = (p.get("slug") or "").strip()
    if not slug: die("REFUSED: post %s is published but carries no slug, so no URL can be built." % pid, 1)
    url = PUB + slug
    title = p.get("title") or pid

    base = sorted(glob.glob(os.path.join(ROOT, "drafts/socials/*.socials.md")))
    if not base: die("CANNOT RUN: no drafts/socials/*.socials.md found")
    stem = base[-1][: -len(".socials.md")]
    socials = sections(open(base[-1]).read())
    if len(socials) != 6: die("REFUSED: expected 6 numbered channels, found %d" % len(socials), 1)

    blocks = []
    for n in sorted(socials):
        name, body = socials[n]
        if n == 1:                                      # Firefly: swap the link, do not add one
            body = body.replace("https://zaostock.com/program", url)
            if url not in body: die("REFUSED: Firefly had no program link to swap", 1)
            if len(body) > FIREFLY_CAP:
                name += " - %d characters raw, over the %d cap; a link counts as 23 on X, so this is %d there" % (
                    len(body), FIREFLY_CAP, len(body) - len(url) + 23)
            else:
                name += " - %d characters" % len(body)
        elif n == 2:                                    # X group chat: no link by design
            pass
        else:                                           # the rest end on the edition link
            body = body.rstrip() + "\n\n" + url
        blocks.append((name, body))

    for suffix, label in ((".linkedin.md", "7. LinkedIn"), (".x-article.md", "8. X Article")):
        path = stem + suffix
        if not os.path.isfile(path): die("CANNOT RUN: missing %s" % path)
        b = draft_block(open(path).read())
        if not b: die("REFUSED: no '## Draft' block in %s" % path, 1)
        blocks.append((label, b.rstrip() + "\n\n" + url))

    for name, body in blocks:
        if re.search(r'\[(FILL|CUT|CHECK|TODO)', body) or "—" in body:
            die("REFUSED: %s carries a slot or an em dash" % name, 1)

    if dry:
        for name, body in blocks:
            print("%-72s %4d chars  link=%s" % (name, len(body), url in body))
        print("\nURL: " + url)
        return

    out = ["Post these in this order. %s is live at %s" % (html.escape(title), url),
           "", "Zaal posts each one. Nothing here has been sent."]
    for name, body in blocks:
        out.append("\n<h2>%s</h2>" % html.escape(name))
        out.append('<pre class="msg">%s</pre>' % html.escape(body))
    emit = os.path.expanduser("~/.claude/skills/clipboard/bin/clipboard-emit.sh")
    if not os.access(emit, os.X_OK): die("CANNOT RUN: clipboard-emit.sh is not executable")
    subprocess.run(["bash", emit, "Socials ready: " + title[:40], os.path.basename(stem) + "-socials-live"],
                   input="\n".join(out).encode(), check=True)

if __name__ == "__main__":
    main()
