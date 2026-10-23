/** SEO: one URL per page. Redirects trailing slashes and uppercase paths with a 301. */
const STATIC_PREFIX = /^\/(images|css|js|icons)\//;

module.exports = (req, res, next) => {
  const { path } = req;
  if (STATIC_PREFIX.test(path)) return next();
  const clean = path.length > 1 ? path.replace(/\/+$/, '').toLowerCase() : path;
  if (clean !== path) return res.redirect(301, clean + req.url.slice(path.length));
  next();
};
