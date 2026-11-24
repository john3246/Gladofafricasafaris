const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const c = require('../../../store/collections');

/** Global admin search across tours, destinations, posts, FAQs and inquiries. */
router.get('/search', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const match = (o) => JSON.stringify(o).toLowerCase().includes(q);
  const results = [];
  if (q.length >= 2) {
    const add = async (type, col, title, sub, href) => {
      (await col.list()).filter(match).slice(0, 8).forEach((d) => results.push({ type, title: title(d), sub: sub(d), href: href(d) }));
    };
    await add('Tour', c.tours, (d) => d.title, (d) => `$${d.priceFrom} · ${d.days} days`, (d) => `/admin/tours/${d.slug}/edit`);
    await add('Destination', c.destinations, (d) => d.name, (d) => d.tagline, (d) => `/admin/destinations/${d.slug}/edit`);
    await add('Blog post', c.posts, (d) => d.title, (d) => d.published, (d) => `/admin/blog/${d.slug}/edit`);
    await add('FAQ', c.faqs, (d) => d.q, (d) => d.group, (d) => `/admin/faqs/${d.slug}/edit`);
    await add('Inquiry', c.inquiries, (d) => d.name, (d) => `${d.email} · ${d.tour || ''}`, (d) => `/admin/inquiries/${d.id}`);
  }
  res.render('admin/views/search', { active: '', pageTitle: 'Search', q: req.query.q || '', results });
}));

/** JSON results for the Ctrl+K command palette. */
router.get('/search/json', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const out = [];
  if (q.length >= 2) {
    const match = (o) => JSON.stringify(o).toLowerCase().includes(q);
    const add = async (type, col, title, href) => (await col.list()).filter(match).slice(0, 5).forEach((d) => out.push({ type, title: title(d), href: href(d) }));
    await add('Tour', c.tours, (d) => d.title, (d) => `/admin/tours/${d.slug}/edit`);
    await add('Destination', c.destinations, (d) => d.name, (d) => `/admin/destinations/${d.slug}/edit`);
    await add('Blog', c.posts, (d) => d.title, (d) => `/admin/blog/${d.slug}/edit`);
    await add('Inquiry', c.inquiries, (d) => d.name, (d) => `/admin/inquiries/${d.id}`);
    await add('Booking', c.bookings, (d) => `${d.ref} ${d.customerName}`, (d) => `/admin/bookings/${d.ref}/edit`);
  }
  res.json(out.slice(0, 12));
}));

module.exports = router;
