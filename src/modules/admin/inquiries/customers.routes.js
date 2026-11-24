const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const { inquiries } = require('../../../store/collections');

/** Customers = unique e-mail addresses that have sent a quote request. */
router.get('/', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim();
  const map = new Map();
  for (const i of await inquiries.list()) {
    const k = i.email.toLowerCase();
    const c = map.get(k) || { email: i.email, name: i.name, phone: i.phone, count: 0, last: '', booked: 0, ids: [] };
    c.count += 1;
    c.booked += i.status === 'booked' ? 1 : 0;
    c.ids.push(i.id);
    if (i.createdAt > c.last) Object.assign(c, { last: i.createdAt, name: i.name, phone: i.phone || c.phone });
    map.set(k, c);
  }
  let customers = [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
  if (q) customers = customers.filter((c) => JSON.stringify([c.name, c.email, c.phone]).toLowerCase().includes(q));
  res.render('admin/views/inquiries/customers', { active: 'customers', pageTitle: 'Customers', customers, q });
}));

module.exports = router;
