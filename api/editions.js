// blog.thezao.com/editions -> the home and archive, newest first, 30 a page.
// Paragraph sends its home and archive readers to the Website address, which is this page.
const b = require("./_blog.js");

module.exports = async function handler(req, res, fetchImpl) {
  const url = new URL(req.url, "http://x");
  const cursor = url.searchParams.get("cursor");
  if (cursor && !/^[A-Za-z0-9_-]{1,100}$/.test(cursor)) return b.send(res, 400, b.notFound(), "no-store");
  let data;
  try {
    data = await b.listPosts(cursor, fetchImpl);
  } catch (e) {
    return b.send(res, 502, b.notFound("Try again", "Paragraph did not answer. Reload in a minute."), "no-store");
  }
  return b.send(res, 200, b.listPage(data || {}));
};
