const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const collections = require('../../../store/collections');
const { audit, revisions } = collections;
const log = require('../lib/audit');
const { flash } = require('../lib/flash');
const { withWhere } = require('../live/live.service');

const RESTORABLE = ['tours', 'destinations', 'posts', 'faqs', 'reviews'];

router.get('/audit', asyncHandler(async (req, res) => {
  const who = req.query.user || '';
  const entries = withWhere((await audit.list()).filter((e) => !who || e.user === who).slice(0, 300));
  const users = [...new Set((await audit.list()).map((e) => e.user))];

  // Deleted items: latest snapshot of any document whose original no longer exists.
  const deleted = [];
  const seen = new Set();
  for (const r of await revisions.list()) {
    const id = `${r.collection}:${r.key}`;
    if (seen.has(id) || !RESTORABLE.includes(r.collection)) continue;
    seen.add(id);
    if (!(await collections[r.collection].get(r.key))) deleted.push(r);
  }
  res.render('admin/views/audit', { active: 'audit', pageTitle: 'Revisions / Audit Log', entries, users, who, deleted });
}));

/** The table rows only, refreshed by the page every few seconds. */
router.get('/audit/rows', asyncHandler(async (req, res) => {
  const who = req.query.user || '';
  res.render('admin/views/partials/audit-rows', { layout: false, entries: withWhere((await audit.list()).filter((e) => !who || e.user === who).slice(0, 300)) });
}));

router.post('/audit/restore/:rev', asyncHandler(async (req, res, next) => {
  const rev = (await revisions.list()).find((r) => r.id === req.params.rev);
  if (!rev || !RESTORABLE.includes(rev.collection)) return next();
  const col = collections[rev.collection];
  if (await col.get(rev.key)) {
    flash(req, 'error', 'An item with that address already exists.');
  } else {
    await col.put({ ...rev.data, draft: true });
    await log.record(req, 'restored', rev.collection, rev.key, 'Restored deleted item (as draft)');
    flash(req, 'success', 'Item restored as a draft. Review it and publish when ready.');
  }
  res.redirect('/admin/audit');
}));

module.exports = router;
