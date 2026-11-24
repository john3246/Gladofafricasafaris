/**
 * Refuses form posts that come from another website (cross-site request forgery) on the public forms.
 * Browsers say where a request came from in two ways, and we use both:
 *  1. Fetch Metadata (`Sec-Fetch-Site`): set by the browser itself and impossible for a web page to fake. A normal
 *     form on this site arrives as "same-origin" even when the Origin header is the string "null"
 *     (which browsers send when a site's Referrer-Policy is "no-referrer").
 *  2. For older browsers without it: the Origin / Referer host must be this site's host.
 * Requests with no information at all (scripts, curl) are allowed: they carry no browser cookies to abuse.
 */
module.exports = function sameSite(req, res, next) {
  if (req.method !== 'POST') return next();
  const fetchSite = req.get('sec-fetch-site');
  if (fetchSite) return fetchSite === 'same-origin' || fetchSite === 'none' ? next() : deny(res);
  const from = req.get('origin') || req.get('referer');
  if (!from) return next();
  try {
    if (new URL(from).host === req.get('host')) return next();
  } catch (_) { /* "null" or a malformed header: not this site */ }
  return deny(res);
};

const deny = (res) => res.status(403).type('text/plain').send('Forbidden: this form must be sent from the website itself.');
