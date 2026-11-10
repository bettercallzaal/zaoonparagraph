// blog.thezao.com/{slug} -> one Web Article, rendered from Paragraph's public API.
// vercel.json rewrites /:slug on the blog host to /api/post?slug=:slug.
const b = require("./_blog.js");

module.exports = async function handler(req, res, fetchImpl) {
  const url = new URL(req.url, "http://x");
  const slug = String(url.searchParams.get("slug") || "").toLowerCase();
  if (!b.SLUG.test(slug)) return b.send(res, 404, b.notFound(), "public, s-maxage=60");
  let post;
  try {
    post = await b.getPost(slug, fetchImpl);
  } catch (e) {
    return b.send(res, 502, b.notFound("Try again", "Paragraph did not answer. Reload in a minute."), "no-store");
  }
  if (!post || post.publishOnline === false || !post.staticHtml) {
    return b.send(res, 404, b.notFound(), "public, s-maxage=60");
  }
  return b.send(res, 200, b.postPage(post, slug));
};
