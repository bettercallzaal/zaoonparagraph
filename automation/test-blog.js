// Tests for the blog.thezao.com pages in api/. Offline by default, with a fake
// Paragraph API; LIVE=1 also renders a real edition from the public API.
//   node automation/test-blog.js
const path = require("path");
const post = require(path.join(__dirname, "..", "api", "post.js"));
const editions = require(path.join(__dirname, "..", "api", "editions.js"));
const b = require(path.join(__dirname, "..", "api", "_blog.js"));

let fails = 0, n = 0;
function check(name, got, want) {
  n++;
  if (got === want) console.log("PASS  " + name);
  else { fails++; console.log("FAIL  " + name + "\n      got:  " + JSON.stringify(got) + "\n      want: " + JSON.stringify(want)); }
}
function fakeRes() {
  return { headers: {}, statusCode: 0, body: "", setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(s) { this.body = s; } };
}
function fakeFetch(map) {
  return async (url) => {
    const hit = Object.keys(map).find((k) => url.includes(k));
    if (!hit) return { ok: false, status: 404, json: async () => ({}) };
    const v = map[hit];
    if (v === 500) return { ok: false, status: 500, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => v };
  };
}

const POST = {
  title: "Year of the ZABAL - Day 1 <x>",
  subtitle: "A subtitle",
  slug: "year-of-the-zabal-day-1",
  publishedAt: "1794274688937",
  imageUrl: "https://storage.googleapis.com/papyrus_images/a.png",
  publishOnline: true,
  staticHtml: '<p>zm</p><script>alert(1)</script><p onclick="x()">hi</p><a href="javascript:alert(1)">bad</a><iframe src="https://evil.example/x"></iframe><iframe src="https://www.youtube-nocookie.com/embed/abc"></iframe><link rel="stylesheet" href="https://x">',
};

(async () => {
  let r = fakeRes();
  await post({ url: "/api/post?slug=year-of-the-zabal-day-1" }, r, fakeFetch({ "/posts/slug/year-of-the-zabal-day-1": POST }));
  check("post renders 200", r.statusCode, 200);
  check("title escaped", r.body.includes("Day 1 &lt;x&gt;"), true);
  check("canonical on the blog host", r.body.includes('<link rel="canonical" href="https://blog.thezao.com/year-of-the-zabal-day-1">'), true);
  check("og image is the cover", r.body.includes('property="og:image" content="https://storage.googleapis.com/papyrus_images/a.png"'), true);
  check("no script survives", /<script>alert/i.test(r.body), false);
  check("no inline handler survives", /onclick=/i.test(r.body), false);
  check("no javascript: link survives", /javascript:/i.test(r.body), false);
  check("other iframe hosts dropped", r.body.includes("evil.example"), false);
  check("youtube-nocookie iframe kept", r.body.includes("youtube-nocookie.com/embed/abc"), true);
  check("body stylesheet link dropped", r.body.includes('href="https://x"'), false);
  check("subscribe goes to Paragraph", r.body.includes("https://paragraph.com/@thezao/subscribe"), true);
  check("cached at the edge", r.headers["cache-control"].includes("s-maxage=300"), true);

  r = fakeRes();
  await post({ url: "/api/post?slug=no-such-post" }, r, fakeFetch({}));
  check("unknown slug is 404", r.statusCode, 404);

  r = fakeRes();
  await post({ url: "/api/post?slug=..%2Fetc" }, r, fakeFetch({}));
  check("bad slug is 404 without a fetch", r.statusCode, 404);

  r = fakeRes();
  await post({ url: "/api/post?slug=email-only" }, r, fakeFetch({ "/posts/slug/email-only": Object.assign({}, POST, { publishOnline: false }) }));
  check("newsletter-only post is 404", r.statusCode, 404);

  r = fakeRes();
  await post({ url: "/api/post?slug=year-of-the-zabal-day-1" }, r, fakeFetch({ "/posts/slug/": 500 }));
  check("API down is 502, not cached", [r.statusCode, r.headers["cache-control"]].join(" "), "502 no-store");

  const LIST = { items: [POST, Object.assign({}, POST, { slug: "hidden", publishOnline: false })], pagination: { cursor: "abc123", hasMore: true } };
  r = fakeRes();
  await editions({ url: "/api/editions" }, r, fakeFetch({ "/posts?limit=30": LIST }));
  check("editions renders 200", r.statusCode, 200);
  check("editions links to the blog host", r.body.includes('href="https://blog.thezao.com/year-of-the-zabal-day-1"'), true);
  check("editions hides newsletter-only posts", r.body.includes("/hidden"), false);
  check("editions has an older link", r.body.includes("/editions?cursor=abc123"), true);

  r = fakeRes();
  await editions({ url: "/api/editions?cursor=%3Cx%3E" }, r, fakeFetch({}));
  check("bad cursor is 400", r.statusCode, 400);

  if (process.env.LIVE === "1") {
    r = fakeRes();
    await post({ url: "/api/post?slug=year-of-the-zabal-day-313" }, r);
    check("LIVE Day 313 renders 200", r.statusCode, 200);
    check("LIVE Day 313 carries its text", r.body.includes("minimum of 4"), true);
    r = fakeRes();
    await editions({ url: "/api/editions" }, r);
    check("LIVE editions lists Day 313", r.body.includes("year-of-the-zabal-day-313"), true);
  }

  console.log("\n" + (n - fails) + " of " + n + " passed");
  process.exit(fails ? 1 : 0);
})();
