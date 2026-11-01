"""Day 305 socials. The blocks carry no slot: both links are arguments, and nothing is
written until each answers 200. A slot in a paste block gets pasted (the Day 264 lesson).

    python3 -I day305_blocks.py <edition-url> <fractal-url>   prints page HTML on stdout
Exit 0 page printed, 1 refused, 2 check could not run.
"""
import html, re, subprocess, sys, urllib.parse

if len(sys.argv) != 3:
    print("usage: day305_blocks.py <edition-url> <fractal-url>", file=sys.stderr); sys.exit(2)
URL, FRACTAL = sys.argv[1], sys.argv[2]
DISCORD = "https://discord.thezao.com"
RSVP = "https://luma.com/yk6gei6f"
RSVP2 = "https://luma.com/76eims17"

if not URL.startswith("https://paragraph.com/@thezao/year-of-the-zabal-day-305"):
    print("REFUSED: edition URL is not a Day 305 paragraph.com/@thezao link: " + URL, file=sys.stderr); sys.exit(1)

def code(u):
    r = subprocess.run(["curl", "-sL", "-o", "/dev/null", "-w", "%{http_code}", "-m", "15", u], capture_output=True, text=True)
    return r.stdout.strip() or "000"

bad = [(u, c) for u in (URL, FRACTAL, DISCORD, RSVP, RSVP2) for c in [code(u)] if c != "200"]
if bad:
    print("REFUSED: not 200 yet: " + ", ".join("%s %s" % b for b in bad), file=sys.stderr); sys.exit(1)

firefly = f"""ZM

zao fractal 122 is monday at 6 pm eastern in the zao discord. free and anyone can come.

the only prep is one question: what did you do for the zao this week

{FRACTAL}

{URL}"""

xpost = f"""ZM

zao fractal 122 is monday at 6 pm eastern. free, in the zao discord.

bring one thing you did for the zao this week. your group ranks it together.

{URL}"""

x_article_title = "Fractal 122 is Monday. Here is all the prep."
x_article = f"""ZM

ZAO Fractal 122 is Monday, November 2 at 6 PM Eastern in The ZAO Discord. It is free and anyone can come.

Every Monday we meet, each of us shares what we did for The ZAO that week, and our group ranks it together. So the only prep is one question: what did you do for The ZAO this week? Write it down before you join, even if it feels small.

You do not have to be a musician to have something to share. Yesterday's edition was about Gigi, who does not play an instrument and judges WaveWarZ battles anyway.

If Monday does not work, Session 2 is Tuesday, November 3 at noon Eastern: [RSVP]({RSVP2})

US clocks went back, so 6 PM Eastern is now 23:00 UTC.

More on how the fractal works: [{FRACTAL}]({FRACTAL})

Today's edition: [Year of the ZABAL - Day 305]({URL})"""

linkedin = """ZM

Every Monday The ZAO, a community of independent artists, meets to share what each of us did for the community that week. Small groups rank the work together.

Fractal 122 is Monday, November 2 at 6 PM Eastern. It is free and anyone can come. The only prep is one question: what did you do for the community this week?

You do not have to be a musician to have something to share.

The newsletter, the RSVP and how the fractal works are linked in the first comment."""

linkedin_comment = f"""{URL}

RSVP: {RSVP}

How it works: {FRACTAL}"""

telegram_text = "ZM. fractal 122 is monday 6 pm eastern in the discord. bring one thing you did for the zao this week."
telegram_link = "https://t.me/share/url?" + urllib.parse.urlencode({"url": URL, "text": telegram_text}, quote_via=urllib.parse.quote)

discord = f"""ZM crew

fractal 122 is monday 6 pm eastern right here. write down one thing you did for the zao this week before you join, even if it feels small.

session 2 is tuesday at noon eastern if monday does not work: {RSVP2}

{FRACTAL}

{URL}"""

facebook = """ZM

Every Monday my music community meets online to share what each of us did that week, and small groups rank it together. This Monday is number 122, at 6 PM Eastern. It is free and anyone can come, musician or not."""
facebook_link = "https://www.facebook.com/sharer/sharer.php?" + urllib.parse.urlencode({"u": URL})

x_gc = f"""ZM

fractal 122 monday 6 pm eastern. clocks went back so it is 23:00 utc now for anyone outside the us

{URL}"""

fc_gc = f"""ZM

fractal 122 monday 6 pm eastern in the discord. bring your week

{FRACTAL}

{URL}"""

blocks = [
    ("1. Farcaster, in Firefly, FARCASTER ONLY", firefly, None),
    ("2. X post", xpost, None),
    ("3. X Article headline", x_article_title, None),
    ("4. X Article body", x_article, None),
    ("5. LinkedIn body, no link", linkedin, None),
    ("6. LinkedIn first comment", linkedin_comment, None),
    ("7. Telegram, tap the share link then pick the group", telegram_text + "\n\n" + URL, telegram_link),
    ("8. Discord, paste", discord, None),
    ("9. Facebook, tap the share link then paste this", facebook, facebook_link),
    ("10. X group chat, paste", x_gc, None),
    ("11. Farcaster /zao group chat, paste", fc_gc, None),
]

URL_RE = re.compile(r"https?://\S+")
def x_len(s):
    n, last = 0, 0
    for m in URL_RE.finditer(s):
        n += len(s[last:m.start()]) + 23; last = m.end()
    return n + len(s[last:])

errs = []
for name, body, _ in blocks:
    if "—" in body or "–" in body: errs.append(name + ": dash")
    if re.search(r"[\U0001F000-\U0001FAFF☀-➿]", body): errs.append(name + ": emoji")
    if "#" in body: errs.append(name + ": hashtag")
    if re.search(r"\[(FILL|TODO|CHECK|CUT|LINK)", body, re.I): errs.append(name + ": slot")
    if "[" in body and "X Article body" not in name: errs.append(name + ": bracket")
for name, body, _ in blocks[:2]:
    if x_len(body) > 280: errs.append("%s: %d on X" % (name, x_len(body)))
if URL_RE.search(linkedin): errs.append("LinkedIn body has a link")
for name, body, _ in blocks:
    if name[:2] in ("3.", "5.") or "Facebook" in name: continue
    if URL not in body: errs.append(name + ": no edition link")
if errs:
    print("REFUSED: " + "; ".join(errs), file=sys.stderr); sys.exit(1)

out = ['Day 305 socials for your read. Nothing here is scheduled, posted or put in Paragraph. Edition: <a href="%s">%s</a>' % (URL, URL),
       "Firefly %d on X, X post %d on X. The Facebook sharer link is UNVERIFIED: only the Share Dialog page was read." % (x_len(firefly), x_len(xpost))]
for name, body, link in blocks:
    out.append("\n<h2>%s</h2>" % html.escape(name))
    if link:
        out.append('<p><a href="%s">Open the share link</a></p>' % html.escape(link))
    out.append('<pre class="msg">%s</pre>' % html.escape(body))
sys.stdout.write("\n".join(out))
print("ok: firefly %d xpost %d" % (x_len(firefly), x_len(xpost)), file=sys.stderr)
