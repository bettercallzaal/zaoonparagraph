#!/usr/bin/env python3
"""test-build-socials.py - the real script, in a child process, against a local stand-in API.

Each case changes one thing the build must notice. Exit 0 all pass, 1 any fail.
"""
import copy, json, os, subprocess, sys, tempfile, threading
from http.server import BaseHTTPRequestHandler, HTTPServer

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build-socials.py")
PID, BID = "madeupid", "bucket1"
FAILS, CALLS, WORLD = [], [], {}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, obj=None):
        self.send_response(code)
        self.end_headers()
        self.wfile.write(json.dumps(obj if obj is not None else {}).encode())

    def do_GET(self):
        CALLS.append(("GET", self.path))
        if self.path in ("/link/good", "/@thezao/year-of-the-zabal-day-306"):
            return self.send(200)
        if self.path.startswith("/link/"):
            return self.send(404)
        if self.path.startswith("/posts/%s" % PID):
            return self.send(200, WORLD["post"])
        if self.path == "/buckets/" + BID:
            return self.send(200, {"members": WORLD["members"]})
        if self.path.startswith("/content/"):
            return self.send(200, WORLD["content"][self.path.split("/")[-1]])
        self.send(404)

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        data = json.loads(self.rfile.read(n) or b"{}")
        CALLS.append(("POST", self.path))
        if self.path == "/posts/%s/bucket" % PID:
            return self.send(200, {"id": BID})
        if self.path == "/content":
            cid = "c%d" % len(WORLD["content"])
            WORLD["content"][cid] = dict(data, id=cid, status="draft")
            return self.send(200, {"id": cid})
        self.send(404)

    def do_PUT(self):
        CALLS.append(("PUT", self.path))
        self.send(500)

    do_PATCH = do_DELETE = do_PUT


server = HTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % server.server_port
GOOD = BASE + "/link/good"
EDITION = BASE + "/@thezao/year-of-the-zabal-day-306"
BODY = ("zm\n\nyear of the zabal day 306\n\n6 PM Eastern tonight is ZAO Fractal 122. Who's joining?\n\n"
        "Join here: [%s](%s)\n\n\\- BetterCallZaal on behalf of the ZABAL Team\n") % (GOOD, GOOD)
SPEC = {"day": 306, "blocks": {
    "x_post": "ZM\n\nzao fractal 122 is tonight at 6 pm eastern\n\n{edition}",
    "x_article_title": "Fractal 122 is tonight",
    "x_article": "ZM\n\nZAO Fractal 122 is tonight at 6 PM Eastern.\n\nJoin here: [%s](%s)\n\nToday's edition: [Day 306]({edition})" % (GOOD, GOOD),
    "linkedin": "ZM\n\nFractal 122 is tonight at 6 PM Eastern. The links are in the first comment.",
    "linkedin_comment": "{edition}\n\nJoin here: %s" % GOOD,
}}


def fresh():
    WORLD.clear()
    WORLD.update(members=[], content={}, post={"id": PID, "title": "Year of the ZABAL - Day 306", "status": "published",
                                              "slug": "year-of-the-zabal-day-306", "markdown": BODY})


def run(spec, *flags):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(spec, f)
    try:
        env = dict(os.environ, PARAGRAPH_API_BASE=BASE, PARAGRAPH_PUB_BASE=BASE + "/@thezao/", PARAGRAPH_API_KEY="testkey")
        return subprocess.run([sys.executable, SCRIPT, PID, f.name, *flags], capture_output=True, text=True, env=env)
    finally:
        os.unlink(f.name)


def expect(label, result, code, text=None):
    ok = result.returncode == code and (text is None or text in result.stdout + result.stderr)
    print("%s  %s: exit %d" % ("PASS" if ok else "FAIL", label, result.returncode))
    if not ok:
        FAILS.append(label)
        print(result.stdout + result.stderr)


def with_block(key, text):
    s = copy.deepcopy(SPEC)
    s["blocks"][key] = text
    return s


fresh()
r = run(SPEC)
expect("a good spec builds the sheet", r, 0, "5. LinkedIn first comment")
expect("the sheet carries the live edition link, not the token", r, 0, EDITION)
if "{edition}" in r.stdout:
    FAILS.append("token left in the sheet")
if any(w in r.stdout for w in ("Telegram", "Firefly", "Discord", "Facebook", "group chat")):
    FAILS.append("a paste channel is still in the sheet"); print("FAIL  the sheet has no paste channels")
else:
    print("PASS  the sheet has no paste channels")
old = copy.deepcopy(SPEC); old["blocks"]["telegram"] = "ZM [FILL]"; fresh()
expect("an old spec with paste keys still runs, and they are ignored", run(old), 0)

fresh()
WORLD["post"]["status"] = "draft"
expect("a draft edition is refused", run(SPEC), 1, "not published")
fresh()
WORLD["post"]["title"] = "Year of the ZABAL - Day 305"
expect("a spec for another day is refused", run(SPEC), 1, "not Day 306")
fresh()
s = copy.deepcopy(SPEC)
del s["blocks"]["linkedin_comment"]
expect("a missing block is refused", run(s), 1, "5. LinkedIn first comment, paste after you publish: missing")
expect("a token other than {edition} is refused", run(with_block("x_post", "ZM {link}\n\n{edition}")), 1, "slot")
expect("a slot is refused", run(with_block("x_post", "ZM [FILL line]\n\n{edition}")), 1, "slot")
expect("an em dash is refused", run(with_block("x_post", "ZM — fractal 122\n\n{edition}")), 1, "dash")
expect("an emoji is refused", run(with_block("x_post", "ZM fractal 122 \U0001F525\n\n{edition}")), 1, "emoji")
expect("a hashtag is refused", run(with_block("x_post", "ZM #fractal 122\n\n{edition}")), 1, "hashtag")
expect("a retired name is refused", run(with_block("x_post", "ZM fractal 122 with Artizen\n\n{edition}")), 1, "retired name")
expect("'sang' as a word passes the retired check", run(with_block("linkedin", "ZM\n\nWe sang tonight at 6 PM Eastern, number 122.")), 0)
expect("a block missing the edition link is refused", run(with_block("linkedin_comment", "ZM fractal 122")), 1, "no edition link")
expect("an X post over 280 is refused", run(with_block("x_post", "ZM " + "a" * 270 + "\n\n{edition}")), 1, "over 280")
expect("a link in the LinkedIn body is refused", run(with_block("linkedin", "ZM fractal 122 at thezao.com")), 1, "first comment")
expect("a number not in the edition is refused", run(with_block("x_post", "ZM fractal 123\n\n{edition}")), 1, "not in the edition")
dead = BASE + "/link/dead"
fresh()
WORLD["post"]["markdown"] = BODY + "\n" + dead + "\n"
expect("a dead link is refused", run(with_block("linkedin_comment", "ZM fractal 122 %s\n\n{edition}" % dead)), 1, "answered 404")

fresh()
before = len([c for c in CALLS if c[0] != "GET"])
run(SPEC)
run(SPEC, "--json")
expect("--json prints the checked blocks", run(SPEC, "--json"), 0, '"x_post"')
if len([c for c in CALLS if c[0] != "GET"]) != before:
    FAILS.append("the sheet or --json made a write call")
print("%s  the sheet and --json make no write call" % ("PASS" if "the sheet or --json made a write call" not in FAILS else "FAIL"))

fresh()
r = run(SPEC, "--write-drafts")
expect("--write-drafts makes three drafts and reads each back", r, 0, "PASS  linkedin draft")
kinds = sorted(c["kind"] for c in WORLD["content"].values())
print("%s  three drafts, one of each kind: %s" % ("PASS" if kinds == ["linkedin", "tweet", "x_article"] else "FAIL", kinds))
if kinds != ["linkedin", "tweet", "x_article"]:
    FAILS.append("draft kinds")
if any(c.get("bucketId") != BID for c in WORLD["content"].values()):
    FAILS.append("a draft outside the bucket")

fresh()
WORLD["members"] = [{"kind": "tweet"}]
r = run(SPEC, "--write-drafts")
expect("--write-drafts refuses a bucket that already holds content", r, 1, "already holds 1")
if WORLD["content"]:
    FAILS.append("wrote into a full bucket")

# Since 3 Nov 2026 Paragraph puts the edition itself in its own bucket, as kind "post".
fresh()
WORLD["members"] = [{"kind": "post", "id": PID}]
r = run(SPEC, "--write-drafts")
expect("--write-drafts writes when the bucket holds only the edition itself", r, 0, "PASS  linkedin draft")

fresh()
WORLD["members"] = [{"kind": "post", "id": PID}, {"kind": "tweet"}]
r = run(SPEC, "--write-drafts")
expect("--write-drafts still refuses the edition plus a social", r, 1, "already holds 1")
if WORLD["content"]:
    FAILS.append("wrote beside an existing social")

fresh()
WORLD["members"] = [{"kind": "post", "id": "someotherpost"}]
r = run(SPEC, "--write-drafts")
expect("--write-drafts refuses a bucket holding a different post", r, 1, "already holds 1")

expect("bad usage cannot run", run(SPEC, "--publish"), 2, "usage")
if any(c[0] in ("PUT", "PATCH", "DELETE") for c in CALLS):
    FAILS.append("an update or delete call")
print("%s  no update, publish or delete call was ever made" % ("PASS" if "an update or delete call" not in FAILS else "FAIL"))

server.shutdown()
print("\n%d failed: %s" % (len(FAILS), FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
