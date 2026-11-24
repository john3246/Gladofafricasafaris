const destinations = require('../data/destinations');
const tours = require('../data/tours');

/**
 * Permanent (301) redirects from addresses the old WordPress site used, or that duplicated a page, to the one clean address:
 *   /eng, /eng/...                          -> the same page without the language prefix
 *   /tour_destination/<slug>[-2]            -> /destinations/<slug>
 *   /<destination-slug>[-2]                 -> /destinations/<slug>
 *   /destinations/<slug>-2                  -> /destinations/<slug>
 *   /product/<tour-slug>[-2]                -> /tours/<tour-slug>
 *   /tours/<tour-slug>-2                    -> /tours/<tour-slug>
 * Destination and tour names come from the site's own data, so nothing unrelated is ever redirected.
 */
const DEST = new Set(destinations.map((d) => d.slug));
const TOUR = new Set(tours.map((t) => t.slug));
const withoutSuffix = (s) => s.replace(/-\d+$/, '');
const destOf = (s) => (DEST.has(s) ? s : DEST.has(withoutSuffix(s)) ? withoutSuffix(s) : null);
const tourOf = (s) => (TOUR.has(s) ? s : TOUR.has(withoutSuffix(s)) ? withoutSuffix(s) : null);

function target(path) {
  const p = path.toLowerCase().replace(/\/+$/, '') || '/';
  let m;
  if (p === '/eng' || p.startsWith('/eng/')) return p.slice(4) || '/';
  if (p === '/tanzania-safaris/offers') return '/offers';
  m = p.match(/^\/tour_destination\/([a-z0-9-]+)$/);
  if (m) { const d = destOf(m[1]); return d ? `/destinations/${d}` : '/destinations'; }
  m = p.match(/^\/destinations\/([a-z0-9-]+)$/);
  if (m && !DEST.has(m[1])) { const d = destOf(m[1]); return d ? `/destinations/${d}` : null; }
  m = p.match(/^\/(product|tours)\/([a-z0-9-]+)$/);
  if (m && !(m[1] === 'tours' && TOUR.has(m[2]))) { const t = tourOf(m[2]); return t ? `/tours/${t}` : null; }
  m = p.match(/^\/([a-z0-9-]+)$/);
  if (m && destOf(m[1])) return `/destinations/${destOf(m[1])}`;
  return null;
}

module.exports = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const to = target(req.path);
  if (!to || to === req.path) return next();
  const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  return res.redirect(301, to + q);
};
module.exports.target = target;
