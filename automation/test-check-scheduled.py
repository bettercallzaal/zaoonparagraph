#!/usr/bin/env python3
"""test-check-scheduled.py - the real script, in a child process, against a local stand-in API.

Each case changes one thing the check must notice. Exit 0 all pass, 1 any fail.
"""
import json, os, subprocess, sys, tempfile, threading
from http.server import BaseHTTPRequestHandler, HTTPServer

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "check-scheduled.py")
PID = "madeupid"
AT = 1793961000000
FAILS = []
CALLS = []
WORLD = {}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, data=b"{}"):
        self.send_response(code)
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        CALLS.append(("GET", self.path))
        if self.path.startswith("/link/"):
            return self.send(200 if self.path == "/link/good" else 404)
        if WORLD.get("down"):
            return self.send(500)
        if self.path.startswith("/posts?status=scheduled"):
            items = [dict(id=PID, **({"scheduledAt": WORLD["list_at"]} if WORLD.get("list_at") else {}))] if WORLD["listed"] else []
            return self.send(200, json.dumps({"items": items}).encode())
        if self.path.startswith("/posts/"):
            return self.send(200, json.dumps(WORLD["post"]).encode())
        self.send(404)

    def do_PUT(self):
        CALLS.append(("PUT", self.path))
        self.send(500)

    do_POST = do_PATCH = do_DELETE = do_PUT


server = HTTPServer(("127.0.0.1", 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % server.server_port
BODY = ("zm\n\nyear of the zabal day 310\n\n" + "word " * 60 + "\n\nJoin: [%s/link/good](%s/link/good)\n\n\\- BetterCallZaal on behalf of the ZABAL Team\n") % (BASE, BASE)


def fresh():
    WORLD.clear()
    WORLD.update(listed=True, post={"id": PID, "title": "Year of the ZABAL - Day 310", "subtitle": "the news", "markdown": BODY, "imageUrl": "https://example.com/c.png", "status": "draft"})


def run(*args, state):
    env = dict(os.environ, PARAGRAPH_API_BASE=BASE, PARAGRAPH_API_KEY="testkey", PARAGRAPH_T5_STATE=state)
    return subprocess.run([sys.executable, SCRIPT, *args], capture_output=True, text=True, env=env)


def expect(label, result, code, text=None):
    ok = result.returncode == code and (text is None or text in result.stdout + result.stderr)
    print("%s  %s: exit %d" % ("PASS" if ok else "FAIL", label, result.returncode))
    if not ok:
        FAILS.append(label)
        print(result.stdout + result.stderr)


def case(label, change, code, text, state):
    fresh()
    expect("approve for: " + label, run("approve", PID, "--at", str(AT), state=state), 0)
    change()
    expect(label, run("check", PID, state=state), code, text)


def setter(key, value):
    return lambda: WORLD["post"].__setitem__(key, value)


with tempfile.TemporaryDirectory() as tmp:
    state = os.path.join(tmp, "state.json")
    fresh()
    expect("no approval on record cannot run", run("check", PID, state=state), 2, "no approval")
    case("an unchanged scheduled post passes, send time UNKNOWN", lambda: None, 0, "UNKNOWN  send time", state)
    case("dropped to draft fails, the Day 302 case", lambda: WORLD.update(listed=False), 1, "FAIL  listed", state)
    case("a changed body fails, the Day 300 case", setter("markdown", BODY + "\nX Article Draft\n"), 1, "FAIL  title, subtitle", state)
    case("a changed title fails", setter("title", "Another title"), 1, "FAIL  title, subtitle", state)
    case("a changed subtitle fails", setter("subtitle", "other"), 1, "FAIL  title, subtitle", state)
    case("a removed cover fails", setter("imageUrl", None), 1, "FAIL  title, subtitle", state)
    case("placeholder text fails", setter("markdown", BODY + "\n[FILL his line]\n"), 1, "FAIL  no placeholder", state)
    case("a dead link fails", setter("markdown", BODY + "\n%s/link/dead\n" % BASE), 1, "/link/dead", state)
    case("an exclamation mark fails the voice gate", setter("markdown", BODY + "\nhello!\n"), 1, "FAIL  voice gate", state)
    case("the right send time passes", lambda: WORLD.update(list_at=AT), 0, "PASS  send time", state)
    case("a wrong send time fails", lambda: WORLD.update(list_at=AT + 60000), 1, "FAIL  send time", state)
    case("an API failure cannot run, it does not pass", lambda: WORLD.update(down=True), 2, "CANNOT RUN", state)

    fresh()
    WORLD["post"]["markdown"] = BODY + "\n[TODO]\n"
    expect("approve refuses a placeholder", run("approve", PID, "--at", str(AT), state=state), 1, "REFUSED")
    fresh()
    expect("bad usage cannot run", run("check", state=state), 2, "usage")

    writes = [c for c in CALLS if c[0] != "GET"]
    print("%s  the script made no write call: %d" % ("PASS" if not writes else "FAIL", len(writes)))
    if not writes and not any(c[0] == "GET" for c in CALLS):
        FAILS.append("no calls at all, so the write count proves nothing")
    if writes:
        FAILS.append("write calls")

server.shutdown()
print("\n%d failed: %s" % (len(FAILS), FAILS) if FAILS else "\nall passed")
sys.exit(1 if FAILS else 0)
