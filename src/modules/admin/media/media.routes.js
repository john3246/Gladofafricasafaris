const router = require('express').Router();
const multer = require('multer');
const asyncHandler = require('../../../utils/asyncHandler');
const service = require('./media.service');
const audit = require('../lib/audit');
const { flash } = require('../lib/flash');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 12 } });

router.get('/', asyncHandler(async (req, res) => {
  const tab = req.query.tab === 'site' ? 'site' : 'uploads';
  const q = String(req.query.q || '').toLowerCase().trim();
  let items = tab === 'site' ? service.siteImages() : await service.uploads();
  if (q) items = items.filter((i) => (i.name + i.url).toLowerCase().includes(q));
  res.render('admin/views/media/library', { active: 'media', pageTitle: 'Media Library', tab, q, items: items.slice(0, 300), total: items.length });
}));

/** JSON for the image picker used on every form. */
router.get('/json', asyncHandler(async (req, res) => {
  res.json({ uploads: await service.uploads(), site: service.siteImages() });
}));

router.post('/upload', upload.array('files', 12), asyncHandler(async (req, res) => {
  const files = req.files || [];
  const saved = [];
  const errors = [];
  for (const f of files) {
    try { saved.push(await service.saveUpload(f, req.user)); } catch (e) { errors.push(e.message); }
  }
  if (saved.length) await audit.record(req, 'uploaded', 'media', saved[0].id, `${saved.length} image(s)`);
  if (req.get('x-requested-with') === 'fetch') return res.json({ saved, errors });
  if (saved.length) flash(req, 'success', `${saved.length} image(s) uploaded.`);
  if (errors.length) flash(req, 'error', errors.join(' '));
  res.redirect('/admin/media');
}));

router.post('/:id/delete', asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  await audit.record(req, 'deleted', 'media', req.params.id, req.params.id);
  flash(req, 'success', 'Image deleted. Pages that still use it will show a placeholder.');
  res.redirect('/admin/media');
}));

module.exports = router;
