#!/usr/bin/env bash
# analytics.sh - read what the newsletter actually did, from Paragraph's own
# analytics warehouse rather than from the in-app dashboard.
#
#   bash automation/analytics.sh            # the weekly read
#   bash automation/analytics.sh --sql "SELECT ..."   # one ad-hoc query
#
# WHY THIS EXISTS. For weeks this lane repeated "0.00% CTR across 366 editions"
# from the in-app Newsletter tab. On 2026-09-24 the warehouse behind that tab
# reported 351 clicks across 28 posts, the most recent that morning. The number
# we had been planning around did not survive its first contact with the data.
#
# It also did not vindicate the email. Per edition, 419 sends, 17 to 25 percent
# opened, and ZERO TO TWO unique clickers. Both facts matter and only the query
# gives you both: the rate was wrong, and the channel is still thin.
#
# The endpoint takes `sql`, not `query`. A `query` key returns
# 400 Validation error - sql: Required.

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# The worktree has no .env of its own; the main checkout holds it, gitignored.
for ENVF in "$REPO_ROOT/.env" "$HOME/Desktop/repos/zaoonparagraph/.env"; do
  [ -f "$ENVF" ] && { set -a; . "$ENVF"; set +a; break; }
done
: "${PARAGRAPH_API_KEY:?PARAGRAPH_API_KEY not set - it lives in .env, gitignored}"

API="https://public.api.paragraph.com/api/v1/analytics/query"

q() {  # q "<sql>" -> rows as json
  curl -s -m 45 -X POST -H "Authorization: Bearer $PARAGRAPH_API_KEY" \
    -H "Content-Type: application/json" \
    --data "$(python3 -c 'import json,sys; print(json.dumps({"sql": sys.argv[1]}))' "$1")" \
    "$API"
}

if [ "${1:-}" = "--sql" ]; then
  [ -n "${2:-}" ] || { echo "usage: analytics.sh --sql \"SELECT ...\"" >&2; exit 2; }
  q "$2" | python3 -m json.tool
  exit 0
fi

echo "=== newsletter, last 30 days ==="
q "SELECT COUNT(*) AS sends, COUNT(*) FILTER (WHERE open_count>0) AS openers, COUNT(*) FILTER (WHERE click_count_total>0) AS clickers, SUM(click_count_total) AS clicks, COUNT(DISTINCT post_id) AS editions FROM newsletter_metrics WHERE sent_at > now() - interval '30 days'" \
| python3 -c '
import json,sys
r=json.load(sys.stdin)["rows"][0]
s,o,c,ed=int(r["sends"]),int(r["openers"]),int(r["clickers"]),int(r["editions"])
print("  %d editions, %d sends" % (ed,s))
print("  %d opened  (%.1f%% of sends)" % (o, o/s*100) if s else "  UNKNOWN: zero sends")
print("  %d unique clickers, %s clicks total" % (c, r["clicks"]))
print("  clickers per edition: %.1f" % (c/ed) if ed else "  clickers per edition: UNKNOWN")
'

echo
echo "=== per edition, last 21 days ==="
q "SELECT p.title, COUNT(*) AS sends, COUNT(*) FILTER (WHERE m.open_count>0) AS openers, COUNT(*) FILTER (WHERE m.click_count_total>0) AS clickers FROM newsletter_metrics m JOIN posts p ON p.id=m.post_id WHERE m.sent_at > now() - interval '21 days' GROUP BY p.title ORDER BY MAX(m.sent_at) DESC" \
| python3 -c '
import json,sys
for r in json.load(sys.stdin).get("rows",[]):
    s,o,c=int(r["sends"]),int(r["openers"]),int(r["clickers"])
    print("  %-46s %d sent  %d opened (%4.1f%%)  %d clickers" % (r["title"][:44], s, o, o/s*100 if s else 0, c))
'

echo
echo "=== most clicked links, all time ==="
q "SELECT url, SUM(click_count) AS c FROM newsletter_link_clicks GROUP BY url ORDER BY c DESC LIMIT 8" \
| python3 -c '
import json,sys,urllib.parse as u
for r in json.load(sys.stdin).get("rows",[]):
    p=u.urlparse(r["url"])
    print("  %4s  %s%s" % (r["c"], p.netloc, p.path[:60]))
'

echo
echo "=== traffic by source, all time ==="
q "SELECT COALESCE(utm_source,'none (direct or organic)') AS src, SUM(page_views) AS views, SUM(total_clicks) AS clicks, SUM(signups) AS signups FROM campaign_attribution_summary GROUP BY 1 ORDER BY views DESC LIMIT 6" \
| python3 -c '
import json,sys
for r in json.load(sys.stdin).get("rows",[]):
    print("  %-28s views %7s  clicks %5s  signups %4s" % (r["src"], r["views"], r["clicks"], r["signups"]))
'

echo
echo "Tables: newsletter_metrics, newsletter_link_clicks, campaign_attribution_summary,"
echo "campaign_events, post_views_daily, detailed_post_metrics, post_email_attribution, posts."
echo "Full schema: GET /api/v1/analytics/schema"
