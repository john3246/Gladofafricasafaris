const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const analytics = require('../../../services/analytics');
const { notfound, redirects, inquiries, bookings, tours } = require('../../../store/collections');
const { normalise } = require('../../../middleware/redirects');

const DAY = 86400000;

/** Most viewed items of one kind (tours, articles, destinations) from the page counters, with their titles. */
function top(allPages, prefix, titles, n = 8) {
  return allPages.filter((p) => p.name.startsWith(prefix) && p.name.length > prefix.length)
    .slice(0, n).map((p) => ({ ...p, title: titles.get(p.name.slice(prefix.length)) || p.name.slice(prefix.length).replace(/-/g, ' ') }));
}

/** Traffic analytics (own first-party counters), enquiries as conversions, and the "broken links" list used to create redirects. */
router.get('/analytics', asyncHandler(async (req, res) => {
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  const data = await analytics.summary(days); // flushes buffered counters first so the lists below are current
  const [missing, rules, enquiries, books, allTours] = await Promise.all([notfound.list(), redirects.list(), inquiries.list(), bookings.list(), tours.list()]);
  const handled = new Set(rules.map((r) => normalise(r.from)));
  const since = Date.now() - days * DAY;
  const inWindow = enquiries.filter((i) => new Date(i.createdAt).getTime() >= since);
  const titles = new Map(allTours.map((t) => [t.slug, t.title]));
  const byTour = {};
  inWindow.forEach((i) => { if (i.tourSlug) byTour[i.tourSlug] = (byTour[i.tourSlug] || 0) + 1; });
  const conversions = {
    enquiries: inWindow.length,
    bookings: books.filter((b) => new Date(b.createdAt || b.travelDate || 0).getTime() >= since && b.status !== 'cancelled').length,
    rate: data.visitors ? ((inWindow.length / data.visitors) * 100).toFixed(1) : '0.0',
    contactClicks: data.events.reduce((n, e) => n + e.count, 0),
    topTours: Object.entries(byTour).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([slug, count]) => ({ title: titles.get(slug) || slug, count })),
  };
  const byCountry = {};
  inWindow.forEach((i) => { const c = i.country || 'Not known'; byCountry[c] = (byCountry[c] || 0) + 1; });
  const countries = {
    visitors: data.countries.slice(0, 12),
    requests: Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count })),
    viewTotal: data.countries.reduce((n, c) => n + c.count, 0),
  };
  const content = { tours: top(data.allPages, '/tours/', titles), blog: top(data.allPages, '/blog/', new Map()), destinations: top(data.allPages, '/destinations/', new Map()) };
  res.render('admin/views/analytics', {
    active: 'analytics', pageTitle: 'Analytics', days, data, conversions, content, countries,
    broken: missing.filter((m) => !handled.has(normalise(m.path))).sort((a, b) => b.count - a.count).slice(0, 15),
  });
}));

/** Dismiss a broken-link entry (e.g. bot noise). */
router.post('/analytics/404/dismiss', asyncHandler(async (req, res) => {
  if (req.body.path) await notfound.remove(req.body.path);
  res.redirect('/admin/analytics#broken');
}));

module.exports = router;
