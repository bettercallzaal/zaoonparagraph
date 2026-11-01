#!/usr/bin/env python3
"""check-social-facts.py - every fact in a social must be in its edition.

    python3 automation/check-social-facts.py <edition.md> <socials.txt> [more.txt ...]

Why. On 2026-10-31 an agent-made X post misdated a quote, and the checks that existed
covered length, slots and dashes only. A social is short and gets read more than the
edition, so a wrong number there is the one people see.

What counts as a fact, pulled from each social:
  numbers       any run of digits, so 122, 6, 23:00 (as 23 and 00), 2025
  handles       @name
  quotes        text inside double quotes, 4 characters or more
  links         any http(s) link, compared without a trailing slash
Each must appear in the edition, case-insensitively. A number can also match the
edition's Day number in its title. Links in ALLOWED_LINKS are allowed everywhere: the
edition's own URL is not in its body, and share links wrap it.

It cannot judge a paraphrase. "some artists changed their songs" passes even if the
edition said something else. It catches the invented number, the wrong date, the
wrong handle and the misquote, which are the failures seen so far.

Exit 0 every fact found. Exit 1 at least one is not in the edition. Exit 2 could not run.
"""
import re, sys

LINK = r"https?://[^\s\]\[()<>\"']+"

ALLOWED_LINKS = ("https://paragraph.com/@thezao/", "https://t.me/share/url", "https://www.facebook.com/sharer/")

def norm(s):
    return re.sub(r"\s+", " ", s.replace("’", "'").replace("“", '"').replace("”", '"')).lower()

def facts(text):
    text = text.replace("“", '"').replace("”", '"')
    links = [l.rstrip(".,!?;:)]}'\"") for l in re.findall(LINK, text)]
    bare = re.sub(LINK, " ", text)
    out = [("link", l) for l in links]
    out += [("handle", h) for h in re.findall(r"(?<![\w.])@[A-Za-z0-9_]{2,}", bare)]
    out += [("quote", q) for q in re.findall(r'"([^"\n]{4,})"', bare)]
    out += [("number", n) for n in re.findall(r"\d+", bare)]
    return out

def check(edition, socials):
    """(facts checked, list of 'where: kind value is not in the edition').

    socials is a list of (label, text). stage-socials.py calls this directly."""
    # Paragraph's API body escapes markdown, so @gigi_gw_ arrives as @gigi\_gw\_.
    # Measured 2026-11-01 on Day 304; the repo record had no escapes, so only a live
    # read caught it.
    edition = re.sub(r"\\([\\`*_{}\[\]()#+.!-])", r"\1", edition)
    ed = norm(edition)
    ed_numbers = set(re.findall(r"\d+", edition))
    ed_links = {l.rstrip(".,!?;:)]}'\"").rstrip("/") for l in re.findall(LINK, edition)}
    missing, total = [], 0
    for label, text in socials:
        for kind, value in facts(text):
            total += 1
            if kind == "link":
                ok = value.rstrip("/") in ed_links or value.startswith(ALLOWED_LINKS)
            elif kind == "number":
                ok = value in ed_numbers
            elif kind == "handle":
                ok = re.search(re.escape(value.lower()) + r"(?![a-z0-9_])", ed) is not None
            else:
                ok = norm(value) in ed
            if not ok:
                missing.append("%s: %s %r is not in the edition" % (label, kind, value))
    return total, missing

def main():
    if len(sys.argv) < 3:
        print(__doc__.split("\n\n")[1], file=sys.stderr); sys.exit(2)
    try:
        edition = open(sys.argv[1], encoding="utf-8").read()
        socials = [(p, open(p, encoding="utf-8").read()) for p in sys.argv[2:]]
    except OSError as e:
        print("CANNOT RUN: %s" % e, file=sys.stderr); sys.exit(2)
    if not edition.strip():
        print("CANNOT RUN: the edition file is empty", file=sys.stderr); sys.exit(2)
    total, missing = check(edition, socials)
    if total == 0:
        print("UNKNOWN: no facts found in the socials, so nothing was checked", file=sys.stderr); sys.exit(2)
    for m in missing:
        print("REFUSED " + m, file=sys.stderr)
    print("%d facts checked, %d not in the edition" % (total, len(missing)))
    sys.exit(1 if missing else 0)

if __name__ == "__main__":
    main()
