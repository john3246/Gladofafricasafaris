const router = require('express').Router();
const multer = require('multer');
const asyncHandler = require('../../../utils/asyncHandler');
const collections = require('../../../store/collections');
const audit = require('../lib/audit');
const { flash } = require('../lib/flash');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 } });
/** Everything that is content or operations data. Users and sessions are deliberately never exported. */
const EXPORTABLE = ['tours', 'destinations', 'posts', 'faqs', 'reviews', 'pages', 'settings', 'redirects', 'bookings', 'inquiries', 'subscribers', 'media', 'categories', 'regions', 'customfields'];

router.get('/backup', asyncHandler(async (req, res) => {
  const counts = {};
  for (const n of EXPORTABLE) counts[n] = await collections[n].count();
  res.render('admin/views/backup', { active: 'backup', pageTitle: 'Backup & Restore', counts, EXPORTABLE });
}));

router.get('/backup/export.json', asyncHandler(async (req, res) => {
  const out = { app: 'glad-of-africa-cms', version: 1, exportedAt: new Date().toISOString(), collections: {} };
  for (const n of EXPORTABLE) out.collections[n] = await collections[n].list();
  await audit.record(req, 'exported backup', 'system', 'backup', `${EXPORTABLE.length} collections`);
  res.type('application/json').attachment(`glad-backup-${new Date().toISOString().slice(0, 10)}.json`).send(JSON.stringify(out));
}));

router.post('/backup/import', upload.single('file'), asyncHandler(async (req, res) => {
  let data;
  try { data = JSON.parse(req.file.buffer.toString('utf8')); } catch (_) { data = null; }
  if (!data || data.app !== 'glad-of-africa-cms' || typeof data.collections !== 'object') {
    flash(req, 'error', 'That file is not a Glad Of Africa backup.');
    return res.redirect('/admin/backup');
  }
  const only = [].concat(req.body.only || []).filter((n) => EXPORTABLE.includes(n));
  let n = 0;
  for (const name of only.length ? only : EXPORTABLE) {
    const col = collections[name];
    for (const doc of data.collections[name] || []) {
      if (doc && doc[col.keyField] !== undefined) { await col.put(doc); n += 1; }
    }
  }
  await audit.record(req, 'imported backup', 'system', 'backup', `${n} records`);
  flash(req, 'success', `Backup restored: ${n} records merged (existing items with the same address were overwritten).`);
  res.redirect('/admin/backup');
}));

module.exports = router;
