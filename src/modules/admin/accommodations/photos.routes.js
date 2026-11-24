const router = require('express').Router();
const multer = require('multer');
const asyncHandler = require('../../../utils/asyncHandler');
const { accommodations } = require('../../../store/collections');
const media = require('../media/media.service');
const audit = require('../lib/audit');
const { flash } = require('../lib/flash');
const { keyOf } = require('../../showcase/accommodations');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 40 } });
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** "Kitela Lodge 2.JPG" -> { base: 'kitela-lodge' }: the place a file name points at (a trailing number means "another photo of it"). */
const baseOf = (file) => slugify(file.replace(/\.[a-z0-9]+$/i, '').replace(/[\s_-]*\(?\d{1,2}\)?$/, ''));

/** Finds the accommodation a file belongs to: same web address, same name, or the only place whose name matches. */
function matcher(docs) {
  const bySlug = new Map(docs.map((d) => [d.slug, d]));
  const byKey = new Map();
  docs.forEach((d) => { byKey.set(keyOf(d.name), d); (d.aliases || []).forEach((k) => byKey.set(k, d)); });
  return (file) => {
    const base = baseOf(file);
    return bySlug.get(base) || byKey.get(keyOf(base.replace(/-/g, ' '))) || null;
  };
}

router.get('/accommodation-photos', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim();
  const only = req.query.only === 'missing' ? 'missing' : '';
  const all = (await accommodations.list()).sort((a, b) => (a.region || '').localeCompare(b.region || '') || a.name.localeCompare(b.name));
  const own = (d) => Boolean(d.image || d.imageUrl);
  const items = all.filter((d) => (!q || `${d.name} ${d.region}`.toLowerCase().includes(q)) && (!only || !own(d)));
  res.render('admin/views/accommodation-photos', {
    active: 'accommodation-photos', pageTitle: 'Accommodation photos', items: items.slice(0, 200), q, only,
    counts: { total: all.length, own: all.filter(own).length },
  });
}));

/** Bulk upload: every file is matched to a place by its name (kitela-lodge.jpg, kitela-lodge-2.jpg ...). */
router.post('/accommodation-photos/bulk', upload.array('files', 40), asyncHandler(async (req, res) => {
  const docs = await accommodations.list();
  const find = matcher(docs);
  const added = new Map();
  const unmatched = [];
  const errors = [];
  for (const f of (req.files || []).sort((a, b) => a.originalname.localeCompare(b.originalname, undefined, { numeric: true }))) {
    const place = find(f.originalname);
    if (!place) { unmatched.push(f.originalname); continue; }
    try {
      const rec = await media.saveUpload(f, req.user);
      const cur = added.get(place.slug) || (await accommodations.get(place.slug));
      const next = cur.image ? { ...cur, gallery: [...(cur.gallery || []), rec.url] } : { ...cur, image: rec.url };
      await accommodations.put(next);
      added.set(place.slug, next);
    } catch (e) { errors.push(e.message); }
  }
  if (added.size) await audit.record(req, 'updated', 'accommodations', 'photos', `Photos added to ${added.size} place(s)`);
  if (added.size) flash(req, 'success', `Photos added to ${added.size} place${added.size === 1 ? '' : 's'}. The website is updated.`);
  if (unmatched.length) flash(req, 'error', `No place found for: ${unmatched.slice(0, 8).join(', ')}${unmatched.length > 8 ? '...' : ''}. Name the file after the place (kitela-lodge.jpg) or use the Upload button on its row.`);
  if (errors.length) flash(req, 'error', errors.join(' '));
  res.redirect('/admin/accommodation-photos');
}));

/** One row: upload a photo, paste a photo link, or go back to the area photo. */
router.post('/accommodation-photos/:slug', upload.single('file'), asyncHandler(async (req, res) => {
  const doc = await accommodations.get(req.params.slug);
  if (!doc) { flash(req, 'error', 'Place not found.'); return res.redirect('/admin/accommodation-photos'); }
  let next = { ...doc };
  if (req.file) next = { ...next, image: (await media.saveUpload(req.file, req.user)).url, imageUrl: '' };
  else if (req.body.action === 'clear') next = { ...next, image: '', imageUrl: '' };
  else if (/^https:\/\/\S+$/.test(String(req.body.imageUrl || '').trim())) next = { ...next, image: '', imageUrl: req.body.imageUrl.trim() };
  else { flash(req, 'error', 'Choose a photo, or paste a link that starts with https://'); return res.redirect('/admin/accommodation-photos'); }
  await accommodations.put(next);
  await audit.record(req, 'updated', 'accommodations', doc.slug, doc.name);
  flash(req, 'success', `${doc.name}: photo updated.`);
  res.redirect(`/admin/accommodation-photos#p-${doc.slug}`);
}));

module.exports = router;
