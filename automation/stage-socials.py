#!/usr/bin/env python3
"""stage-socials.py - the moment an edition publishes, turn the drafted socials into one
clipboard page with the real URL in them.

    python3 automation/stage-socials.py <post-id> [--dry-run | --json]

--json prints the checked blocks for the dashboard and writes no clipboard page.

Why this exists. The socials are written before the edition publishes, so they cannot carry
its URL, and a slot saying "PUT THE URL HERE" inside a block Zaal pastes ends up pasted
(2026-09-21, the Day 264 placeholder that reached a live preview). So the drafts carry no
slot at all, and this script is the other half: it reads the published post, derives the
URL from the slug Paragraph assigned, inserts it per channel, and refuses if the post is
not published yet. One command between "published" and "ready to post".

Exit 0 the page is written. Exit 1 the post is not ready or a rule did not apply.
Exit 2 the check could not run.
"""
import json, os, re, subprocess, sys, urllib.request, html, glob, importlib.util

API = "https://public.api.paragraph.com/api/v1/posts/"
PUB = "https://paragraph.com/@thezao/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIREFLY_CAP = 280

def die(msg, code=2):
    print(msg, file=sys.stderr); sys.exit(code)

def env_key():
    key = os.environ.get("PARAGRAPH_API_KEY")
    if key: return key
    # A worktree has no .env of its own. PARAGRAPH_ENV_FILE points at one, so no machine's
    # home directory has to sit in this public repo.
    extra = os.environ.get("PARAGRAPH_ENV_FILE")
    for p in [os.path.join(ROOT, ".env")] + ([os.path.expanduser(extra)] if extra else []):
        if os.path.isfile(p):
            for line in open(p):
                m = re.match(r'\s*(?:export\s+)?PARAGRAPH_API_KEY\s*=\s*"?([^"\s]+)"?', line)
                if m: return m.group(1)
    die("CANNOT RUN: no PARAGRAPH_API_KEY in the environment or in .env. From a worktree, set PARAGRAPH_ENV_FILE to a .env that has it.")

def get_post(pid):
    # A bare urllib User-Agent gets a 403 from this API where curl does not, so it is set
    # explicitly. Measured 2026-09-25: Python-urllib/3.x 403, this string 200.
    # includeContent=true returns the body, which the fact check needs. Without it
    # this API answers with the title and status only (measured 2026-11-01).
    req = urllib.request.Request(API + pid + "?includeContent=true", headers={
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

URL_RE = re.compile(r"https?://\S+")
TRAILING = ".,!?;:)]}'\""
# What counts as a link in a LinkedIn body. LinkedIn links a bare domain too, so a scheme is
# not required. Anything with a path counts; with no path, only common endings do, so a
# sentence that runs on after a full stop does not. A brand like Cal.com is refused as well.
ANY_LINK_RE = re.compile(
    r"(?:https?://|www\.)\S+"
    r"|\b[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}/\S*"
    r"|\b[\w-]+(?:\.[\w-]+)*\.(?:com|org|net|io|xyz|co|fm|app|ai|gg|me|tv)\b",
    re.I,
)

def x_length(body):
    """Length as X counts it: every link is 23, everything else is itself.

    Punctuation glued to the end of a link is not part of the link. "see https://a.b/c." is a
    23 character link and a full stop, so it counts 24, not 23. The first version of this
    matched the punctuation into the link and undercounted by one; a review of #98 built a post
    this scored 280 that X counts 281.
    """
    n, last = 0, 0
    for m in URL_RE.finditer(body):
        link = m.group(0).rstrip(TRAILING)
        if not link[link.index("://") + 3:]:
            continue                                    # "https://" and nothing after it is text
        n += len(body[last:m.start()]) + 23
        last = m.start() + len(link)
    return n + len(body[last:])

def firefly(body, url):
    """Put the edition URL in the Firefly post and measure it the way X does.

    If the draft carries the program link, the edition URL takes the place of the first one. If
    it does not, the edition URL goes on the end. Until 2026-09-27 a draft with no program link
    was refused, and every Firefly post written for Days 270 to 273 had none, so the script
    would have refused all four on the day they published.
    """
    prog = "https://zaostock.com/program"
    if prog in body:
        body = body.replace(prog, url, 1)
    else:
        body = body.rstrip() + "\n\n" + url
    return body, x_length(body)

def draft_block(md):
    m = re.search(r'^## Draft.*?\n(.*?)(?=^## |\Z)', md, re.S | re.M)
    return m.group(1).strip() if m else None

def main():
    if len(sys.argv) < 2: die("usage: stage-socials.py <post-id> [--dry-run | --json]")
    pid, dry = sys.argv[1], "--dry-run" in sys.argv[2:]
    p = get_post(pid)
    if not p.get("id"): die("REFUSED: no post %s. A deleted draft answers with nulls." % pid, 1)
    if p.get("status") != "published":
        die("REFUSED: post %s is status %r, not published. Nothing to link yet." % (pid, p.get("status")), 1)
    slug = (p.get("slug") or "").strip()
    if not slug: die("REFUSED: post %s is published but carries no slug, so no URL can be built." % pid, 1)
    url = PUB + slug
    title = p.get("title") or pid

    # The socials file is chosen by the DAY NUMBER in the post's own title, never by "newest".
    # On 2026-09-27 Day 271's socials were written while Day 270 was still unpublished; newest-wins
    # would have paired Day 270's URL with Day 271's copy.
    m = re.search(r"Day (\d{1,3})\b", title)
    if not m: die("REFUSED: no 'Day N' in the post title %r, so the socials cannot be matched" % title, 1)
    day = m.group(1)
    base = sorted(glob.glob(os.path.join(ROOT, "drafts/socials/*-day-%s.socials.md" % day)))
    if not base: die("REFUSED: no drafts/socials/*-day-%s.socials.md for this edition" % day, 1)
    if len(base) > 1: die("REFUSED: %d socials files for day %s, expected one: %s" % (len(base), day, base), 1)
    stem = base[0][: -len(".socials.md")]
    socials = sections(open(base[0]).read())
    if len(socials) != 6: die("REFUSED: expected 6 numbered channels, found %d" % len(socials), 1)

    blocks = []
    for n in sorted(socials):
        name, body = socials[n]
        if n == 1:
            body, on_x = firefly(body, url)
            if on_x > FIREFLY_CAP:
                die("REFUSED: Firefly is %d characters on X, over the %d cap" % (on_x, FIREFLY_CAP), 1)
            # Zaal, 2026-10-13: edition X posts go out from Paragraph only. So this one is
            # Farcaster only in Firefly, or the same post lands on X twice. The 280 cap above
            # stays on purpose: one wrong toggle in Firefly sends this text to X too, so it
            # has to still fit there. Lifting it is Zaal's call.
            name += " - FARCASTER ONLY in Firefly, %d characters raw, %d on X where every link counts as 23" % (len(body), on_x)
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
        if suffix == ".linkedin.md":
            # Zaal, 2026-10-29, option B: LinkedIn carries its links in the first comment,
            # never in the body.
            if ANY_LINK_RE.search(b):
                die("REFUSED: the LinkedIn draft has a link in its body. Links go in the first comment.", 1)
            blocks.append((label, b.rstrip()))
            blocks.append(("7b. LinkedIn first comment", url))
        else:
            blocks.append((label, b.rstrip() + "\n\n" + url))

    for name, body in blocks:
        if re.search(r'\[(FILL|CUT|CHECK|TODO)', body) or "—" in body:
            die("REFUSED: %s carries a slot or an em dash" % name, 1)

    # Every number, handle, quote and link in a social must be in the live edition.
    # On 2026-10-31 an agent-made X post misdated a quote; nothing caught it.
    edition_md = p.get("markdown") or ""
    if not edition_md.strip():
        die("CANNOT RUN: the API returned no body for %s, so the fact check cannot run" % pid)
    fspec = importlib.util.spec_from_file_location(
        "social_facts", os.path.join(os.path.dirname(os.path.abspath(__file__)), "check-social-facts.py"))
    social_facts = importlib.util.module_from_spec(fspec); fspec.loader.exec_module(social_facts)
    checked, missing = social_facts.check(title + "\n" + edition_md, blocks)
    if checked == 0:
        die("CANNOT RUN: the fact check found no facts in the socials, so it checked nothing")
    if missing:
        die("REFUSED: the fact check failed\n  " + "\n  ".join(missing), 1)

    if "--json" in sys.argv[2:]:
        print(json.dumps({"title": title, "url": url, "blocks": [{"name": n, "body": b} for n, b in blocks]}))
        return

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
