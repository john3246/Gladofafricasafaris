const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const analytics = require('../../../services/analytics');
const { tours, inquiries } = require('../../../store/collections');

const DAY = 86400000;
const top = (o, n = 3) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));

/** CMS > Offers: the safaris that carry an offer label, with how much interest each gets and from which countries. */
router.get('/offers', asyncHandler(async (req, res) => {
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  const all = req.query.all === '1';
  const [data, list, requests] = await Promise.all([analytics.summary(days), tours.list(), inquiries.list()]);
  const since = Date.now() - days * DAY;
  const views = {}; const viewCountries = {};
  for (const { name, count } of data.tourCountries) {
    const [slug, country] = name.split('|');
    views[slug] = (views[slug] || 0) + count;
    (viewCountries[slug] = viewCountries[slug] || {})[country] = ((viewCountries[slug] || {})[country] || 0) + count;
  }
  const asks = {}; const askCountries = {};
  requests.filter((r) => new Date(r.createdAt).getTime() >= since && r.tourSlug).forEach((r) => {
    asks[r.tourSlug] = (asks[r.tourSlug] || 0) + 1;
    (askCountries[r.tourSlug] = askCountries[r.tourSlug] || {})[r.country || 'Not known'] = ((askCountries[r.tourSlug] || {})[r.country || 'Not known'] || 0) + 1;
  });
  const rows = list.filter((t) => all || String(t.offerLabel || '').trim())
    .map((t) => ({ slug: t.slug, title: t.title, label: t.offerLabel || '', price: t.priceFrom, days: t.days, views: views[t.slug] || 0, asks: asks[t.slug] || 0, viewCountries: top(viewCountries[t.slug] || {}), askCountries: top(askCountries[t.slug] || {}) }))
    .sort((a, b) => (b.label ? 1 : 0) - (a.label ? 1 : 0) || b.asks - a.asks || b.views - a.views);
  res.render('admin/views/offers', { active: 'offers', pageTitle: 'Offers', days, all, rows, offerCount: list.filter((t) => String(t.offerLabel || '').trim()).length });
}));

module.exports = router;
