#!/usr/bin/env python3
"""check-scheduled.py - is a scheduled edition still what Zaal approved?

    python3 automation/check-scheduled.py approve <post-id> --at <unix-ms>
    python3 automation/check-scheduled.py check <post-id>

approve records a hash of the title, subtitle, body and cover, at the moment he approves.
check runs five minutes before the send and compares. It reads only: nothing here can
edit, cancel, schedule or publish a post. A changed post prints what to do and stops there.

Two failures this exists for. An open editor tab reset Day 302 to draft about 37 seconds
after an API schedule (29 Oct), so "scheduled" is read from the list and never assumed. The
in-app agent wrote social drafts into scheduled Day 300, which then published with them
(27 Oct), so the body is compared and not just its status.

The published schema for reading a post has no scheduledAt. If the API does not return the
send time, the check prints UNKNOWN for that line. It does not call the time confirmed.

Exit 0 all checks passed, 1 a check failed, 2 the check could not run.
State file: PARAGRAPH_T5_STATE, default automation/.t5-approved.json (gitignored).
"""
import datetime, hashlib, json, os, re, subprocess, sys, tempfile, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
API = os.environ.get("PARAGRAPH_API_BASE", "https://public.api.paragraph.com/api/v1").rstrip("/")
STATE = os.environ.get("PARAGRAPH_T5_STATE") or os.path.join(HERE, ".t5-approved.json")
UA = "zaoonparagraph-check-scheduled/1.0"   # a bare urllib User-Agent gets a 403 here
PLACEHOLDER = re.compile(r"\[(?:FILL|CUT|CHECK|TODO|LINK|TK)\b|\bTODO\b|\bTK\b|\bXXX\b|\{\{|lorem ipsum|<[A-Za-z_ ]*(?:here|name|link)>", re.I)
URL_RE = re.compile(r"https?://[^\s)\]>\"']+")


def cannot_run(msg):
    print("CANNOT RUN: " + msg, file=sys.stderr)
    sys.exit(2)


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
    cannot_run("no PARAGRAPH_API_KEY in the environment or .env. From a worktree, set PARAGRAPH_ENV_FILE.")


def api_get(path):
    req = urllib.request.Request(API + path, headers={"Authorization": "Bearer " + api_key(), "User-Agent": UA, "Accept": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req, timeout=30))
    except urllib.error.HTTPError as e:
        cannot_run("the API answered %d for %s" % (e.code, path))
    except (urllib.error.URLError, OSError, ValueError) as e:
        cannot_run("the API could not be read for %s: %s" % (path, e))


def fingerprint(post):
    parts = [post.get(k) or "" for k in ("title", "subtitle", "markdown", "imageUrl")]
    return hashlib.sha256("\0".join(parts).encode("utf-8")).hexdigest()


def read_post(pid):
    post = api_get("/posts/%s?includeContent=true" % pid)
    post = post.get("post", post)
    if not (post.get("markdown") or "").strip():
        cannot_run("the API returned no body for %s" % pid)
    return post


def load_state():
    if not os.path.isfile(STATE):
        return {}
    try:
        return json.load(open(STATE))
    except ValueError:
        cannot_run("the state file is not valid JSON: " + STATE)


def placeholders(post):
    text = "\n".join(post.get(k) or "" for k in ("title", "subtitle", "markdown"))
    return sorted({m.group(0) for m in PLACEHOLDER.finditer(text)})


def link_code(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        return urllib.request.urlopen(req, timeout=20).status
    except urllib.error.HTTPError as e:
        return e.code
    except (urllib.error.URLError, OSError):
        return 0


def dead_links(post):
    urls = sorted({u.rstrip(".,!?;:") for u in URL_RE.findall(post.get("markdown") or "")})
    dead = []
    for url in urls:
        code = link_code(url)
        if code != 200:
            code = link_code(url)  # once more: a slow answer is not a dead link
        if code != 200:
            dead.append("%s %s" % (code, url))
    return len(urls), dead


def voice_gate(post):
    """The real gate, on the post as the API returns it. The API writes the sign-off as an
    escaped hyphen, which the gate would not read as the signature."""
    body = re.sub(r"(?m)^\\- ", "- ", post.get("markdown") or "")
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
        f.write("# %s\n\n%s\n" % (post.get("title") or "", body))
    try:
        r = subprocess.run(["bash", os.path.join(HERE, "check-voice.sh"), "--daily", f.name], capture_output=True, text=True)
    finally:
        os.unlink(f.name)
    return r.returncode, [l for l in r.stdout.splitlines() if l.startswith("FAIL")]


def in_scheduled_list(pid):
    data = api_get("/posts?status=scheduled&limit=100")
    if "items" not in data:
        cannot_run("the scheduled list came back without items")
    for item in data["items"]:
        if item.get("id") == pid:
            return True, item
    return False, None


def stamp(ms):
    return datetime.datetime.fromtimestamp(int(ms) / 1000, datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def approve(pid, at):
    post = read_post(pid)
    found = placeholders(post)
    if found:
        print("REFUSED: not recorded, the post carries placeholder text: %s" % ", ".join(found))
        return 1
    state = load_state()
    state[pid] = {"fingerprint": fingerprint(post), "title": post.get("title"), "at": at}
    with open(STATE, "w") as f:
        json.dump(state, f, indent=2, sort_keys=True)
        f.write("\n")
    print("Recorded approval of %s, %s, for %s." % (pid, post.get("title"), stamp(at)))
    return 0


def check(pid):
    approved = load_state().get(pid)
    if not approved:
        cannot_run("no approval on record for %s, so there is nothing to compare against" % pid)
    post = read_post(pid)
    fails = []

    def line(ok, text):
        print("%s  %s" % ("PASS" if ok else "FAIL", text))
        if not ok:
            fails.append(text)

    print("%s, %s" % (pid, post.get("title")))
    listed, item = in_scheduled_list(pid)
    line(listed, "listed as scheduled (status field reads %s)" % post.get("status"))
    line(fingerprint(post) == approved["fingerprint"], "title, subtitle, body and cover match his approval")
    found = placeholders(post)
    line(not found, "no placeholder text" + (": " + ", ".join(found) if found else ""))
    code, voice_fails = voice_gate(post)
    line(code == 0, "voice gate" + (": " + "; ".join(voice_fails) if voice_fails else ""))
    count, dead = dead_links(post)
    if count == 0:
        print("UNKNOWN  links: the body has none, so none were checked")
    else:
        line(not dead, "%d link(s) answer 200" % count + (": dead " + ", ".join(dead) if dead else ""))

    when = (item or {}).get("scheduledAt") or post.get("scheduledAt")
    if when:
        line(int(when) == int(approved["at"]), "send time %s, approved for %s" % (stamp(when), stamp(approved["at"])))
    else:
        print("UNKNOWN  send time: the API did not return one, so %s is not confirmed" % stamp(approved["at"]))

    if fails:
        print("\nFAILED: %d check(s). This script changed nothing. To stop the send: PUT scheduledAt null on this post." % len(fails))
        return 1
    print("\nAll checks passed.")
    return 0


def main():
    args = sys.argv[1:]
    if len(args) == 4 and args[0] == "approve" and args[2] == "--at" and args[3].isdigit():
        return approve(args[1], int(args[3]))
    if len(args) == 2 and args[0] == "check":
        return check(args[1])
    cannot_run("usage: check-scheduled.py approve <post-id> --at <unix-ms> | check <post-id>")


if __name__ == "__main__":
    sys.exit(main())
