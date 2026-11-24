const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const store = require('../../../i18n/store');
const config = require('../../../i18n/config');
const worker = require('../../../i18n/worker');
const audit = require('../lib/audit');
const { flash } = require('../lib/flash');
const { requireAdmin } = require('../auth/auth.middleware');

const PAGE = 20;
const NAMES = { it: 'Italian', fr: 'French', de: 'German', zh: 'Chinese' };

/** What the translator would send, and roughly what it costs on each model (about 3.5 characters per token; output is a little longer than input). */
function estimate() {
  const rows = [];
  let chars = 0;
  for (const l of store.LANGS) store.missingFor(l).forEach((r) => { chars += r.en.length; });
  const tokens = chars / 3.5;
  for (const m of config.MODELS) rows.push({ label: m.label, usd: (tokens * m.in + tokens * 1.25 * m.out) / 1e6 });
  return { chars, rows };
}

router.get('/translations', asyncHandler(async (req, res) => {
  const lang = store.LANGS.includes(req.query.lang) ? req.query.lang : 'it';
  const filter = ['missing', 'done', 'ai', 'human', 'all'].includes(req.query.filter) ? req.query.filter : 'missing';
  const q = String(req.query.q || '').toLowerCase().trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  let rows = store.list();
  rows = rows.filter((r) => (filter === 'all' || (filter === 'missing' && !r[lang]) || (filter === 'done' && r[lang]) || (filter === 'ai' && r[`by_${lang}`] === 'ai') || (filter === 'human' && r[`by_${lang}`] === 'human'))
    && (!q || r.en.toLowerCase().includes(q) || String(r[lang] || '').toLowerCase().includes(q)));
  rows.sort((a, b) => b.en.length - a.en.length);
  const stats = store.stats();
  res.render('admin/views/translations', {
    active: 'translations', pageTitle: 'Translations', lang, filter, q, page, pages: Math.max(1, Math.ceil(rows.length / PAGE)), total: rows.length,
    rows: rows.slice((page - 1) * PAGE, page * PAGE), stats, cfg: await config.summary(), job: worker.status(), est: estimate(), models: config.MODELS, names: NAMES,
    coverage: stats.pages.filter((p) => p.lang === lang).sort((a, b) => a.share - b.share).slice(0, 40),
  });
}));

router.get('/translations/job', asyncHandler(async (req, res) => {
  res.render('admin/views/partials/translation-job', { layout: false, job: worker.status() });
}));

router.post('/translations/settings', requireAdmin, asyncHandler(async (req, res) => {
  await config.save({ apiKey: req.body.apiKey, clearKey: req.body.clearKey === '1', model: req.body.model, auto: req.body.auto === '1', dailyCap: req.body.dailyCap });
  await audit.record(req, 'updated', 'translations', 'settings', 'Translator settings');
  flash(req, 'success', 'Translator settings saved.');
  res.redirect('/admin/translations');
}));

router.post('/translations/scan', requireAdmin, asyncHandler(async (req, res) => {
  flash(req, worker.start('scan') ? 'success' : 'error', worker.status().running ? 'Reading every page of the site to find new text. This takes a minute or two.' : 'A translation job is already running.');
  res.redirect('/admin/translations');
}));

router.post('/translations/run', requireAdmin, asyncHandler(async (req, res) => {
  if (!(await config.get())) { flash(req, 'error', 'Add your Claude API key first (box below).'); return res.redirect('/admin/translations'); }
  const lang = store.LANGS.includes(req.body.lang) ? [req.body.lang] : store.LANGS;
  const ok = worker.start(req.body.scan === '1' ? 'all' : 'translate', { langs: lang });
  await audit.record(req, 'started', 'translations', 'run', `Translating ${lang.join(', ')}`);
  flash(req, ok ? 'success' : 'error', ok ? 'Translation started. You can leave this page: it keeps running.' : 'A translation job is already running.');
  res.redirect('/admin/translations');
}));

router.post('/translations/save', asyncHandler(async (req, res) => {
  const lang = store.LANGS.includes(req.body.lang) ? req.body.lang : 'it';
  const items = [];
  for (const [key, text] of Object.entries(req.body.t || {})) {
    const row = store.list().find((r) => r.key === key);
    if (row && String(text).trim() !== String(row[lang] || '').trim()) items.push({ en: row.en, lang, text: String(text), by: 'human', kind: row.kind });
  }
  const n = await store.save(items);
  if (n) await audit.record(req, 'updated', 'translations', lang, `${n} ${NAMES[lang]} translations edited`);
  flash(req, 'success', n ? `${n} translation${n === 1 ? '' : 's'} saved.` : 'Nothing changed.');
  res.redirect(`/admin/translations?lang=${lang}&filter=${encodeURIComponent(req.body.filter || 'missing')}&page=${Number(req.body.page) || 1}`);
}));

module.exports = router;
