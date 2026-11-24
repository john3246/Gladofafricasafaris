const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const { inquiries } = require('../../../store/collections');
const audit = require('../lib/audit');
const usersService = require('../auth/users.service');
const mailer = require('../../../services/mailer');
const emailTemplates = require('../../../services/emailTemplates');
const { bookings } = require('../../../store/collections');
const { flash } = require('../lib/flash');

const STATUSES = [
  { value: 'new', label: 'New' }, { value: 'in-progress', label: 'In progress' }, { value: 'replied', label: 'Replied' },
  { value: 'booked', label: 'Booked' }, { value: 'closed', label: 'Closed' },
];
const newest = (a, b) => b.createdAt.localeCompare(a.createdAt);
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const render = (res, view, data) => res.render(`admin/views/inquiries/${view}`, { active: 'inquiries', STATUSES, ...data });

router.get('/', asyncHandler(async (req, res) => {
  const status = req.query.status || '';
  const q = String(req.query.q || '').toLowerCase().trim();
  const all = (await inquiries.list()).sort(newest);
  let items = status ? all.filter((i) => i.status === status) : all;
  if (q) items = items.filter((i) => JSON.stringify([i.name, i.email, i.phone, i.tour, i.message]).toLowerCase().includes(q));
  const counts = Object.fromEntries(STATUSES.map((s) => [s.value, all.filter((i) => i.status === s.value).length]));
  render(res, 'list', { pageTitle: 'Inquiries', items, status, q, counts, total: all.length });
}));

router.get('/export.csv', asyncHandler(async (req, res) => {
  const rows = (await inquiries.list()).sort(newest);
  const head = ['Date', 'Name', 'Email', 'Phone', 'Tour', 'Styles', 'Start date', 'End date', 'Flexible', 'Travel month', 'Adults', 'Children', 'Status', 'Message', 'Country', 'Language'];
  const body = rows.map((i) => [i.createdAt, i.name, i.email, i.phone, i.tour, (i.styles || [i.tier]).join(' / '), i.startDate, i.endDate, i.flexible ? 'yes' : '', i.travelMonth, i.adults || i.travellers, i.children || 0, i.status, i.message, i.country, i.lang].map(csv).join(','));
  res.type('text/csv').attachment('inquiries.csv').send([head.map(csv).join(','), ...body].join('\n'));
}));

router.get('/:id', asyncHandler(async (req, res, next) => {
  const item = await inquiries.get(req.params.id);
  if (!item) return next();
  const linked = (await bookings.list()).filter((b) => b.inquiryId === item.id);
  render(res, 'detail', { pageTitle: `Inquiry from ${item.name}`, item, team: await usersService.list(), mailOk: await mailer.configured(), linked, replies: await emailTemplates.repliesFor(item, req.user.name), ctx: await emailTemplates.contextFor(item) });
}));

router.post('/:id/status', asyncHandler(async (req, res, next) => {
  const item = await inquiries.get(req.params.id);
  if (!item || !STATUSES.some((s) => s.value === req.body.status)) return next();
  item.status = req.body.status;
  await inquiries.put(item);
  await audit.record(req, `status: ${item.status}`, 'inquiries', item.id, item.name);
  flash(req, 'success', 'Status updated.');
  res.redirect(`/admin/inquiries/${item.id}`);
}));

router.post('/:id/details', asyncHandler(async (req, res, next) => {
  const item = await inquiries.get(req.params.id);
  if (!item) return next();
  const value = Number(String(req.body.value || '').replace(/,/g, ''));
  item.value = Number.isFinite(value) && value > 0 ? value : undefined;
  item.assignee = String(req.body.assignee || '');
  await inquiries.put(item);
  await audit.record(req, 'updated details', 'inquiries', item.id, item.name);
  flash(req, 'success', 'Details saved.');
  res.redirect(`/admin/inquiries/${item.id}`);
}));

/** Reply to the guest by e-mail from the CMS (needs SMTP_URL); the message is kept as a note. */
router.post('/:id/reply', asyncHandler(async (req, res, next) => {
  const item = await inquiries.get(req.params.id);
  if (!item) return next();
  const subject = String(req.body.subject || '').trim().slice(0, 200);
  const text = String(req.body.body || '').trim().slice(0, 8000);
  if (!subject || !text) { flash(req, 'error', 'Add a subject and a message.'); return res.redirect(`/admin/inquiries/${item.id}`); }
  const sent = await mailer.sendMail({ to: item.email, subject, text });
  if (!sent.ok) { flash(req, 'error', sent.reason); return res.redirect(`/admin/inquiries/${item.id}`); }
  item.notes = [{ at: new Date().toISOString(), by: req.user.name, text: `Email sent: "${subject}"

${text}` }, ...(item.notes || [])];
  if (item.status === 'new' || item.status === 'in-progress') item.status = 'replied';
  await inquiries.put(item);
  await audit.record(req, 'emailed guest', 'inquiries', item.id, item.name);
  flash(req, 'success', `Email sent to ${item.email}.`);
  res.redirect(`/admin/inquiries/${item.id}`);
}));

router.post('/:id/note', asyncHandler(async (req, res, next) => {
  const item = await inquiries.get(req.params.id);
  const text = String(req.body.note || '').trim();
  if (!item) return next();
  if (text) {
    item.notes = [{ at: new Date().toISOString(), by: req.user.name, text: text.slice(0, 2000) }, ...(item.notes || [])];
    await inquiries.put(item);
    flash(req, 'success', 'Note added.');
  }
  res.redirect(`/admin/inquiries/${item.id}`);
}));

router.post('/:id/delete', asyncHandler(async (req, res) => {
  const item = await inquiries.get(req.params.id);
  if (item) {
    await inquiries.remove(item.id);
    await audit.record(req, 'deleted', 'inquiries', item.id, item.name);
    flash(req, 'success', 'Inquiry deleted.');
  }
  res.redirect('/admin/inquiries');
}));

module.exports = router;
