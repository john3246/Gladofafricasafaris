const { env } = require('../config');
const { events } = require('../store');
const logger = require('../utils/logger');
const store = require('./store');
const config = require('./config');
const { translateBatch } = require('./translator');

/**
 * Finds the English sentences that still need translating (by visiting every page of the site in Italian) and has them
 * translated. Runs when an editor presses the buttons in CMS > Translations, and by itself (when automatic translation is on
 * and an API key is set) after content changes, so new work is translated from the day it is published.
 */
const job = { running: false, step: '', lang: '', done: 0, total: 0, rejected: 0, error: '', startedAt: '', finishedAt: '', cost: 0 };
let dirty = true; // the site is scanned once after every start
let usedToday = { date: '', segments: 0 };

const IGNORE = new Set(['translations', 'i18nstatus', 'audit', 'pageviews', 'notfound', 'secrets', 'revisions', 'inquiries', 'authtokens', 'users', 'media', 'subscribers', 'bookings']);
events.on('change', (name) => { if (!IGNORE.has(name)) dirty = true; });

const origin = () => `http://127.0.0.1:${env.port}`;

/** Visits every public page in Italian so that every English sentence without a translation is recorded. */
async function scan(extra = []) {
  const { buildSitemapEntries } = require('../modules/seo/seo.service');
  const paths = [...new Set([...(await buildSitemapEntries()).map((e) => e.loc), ...extra, '/nothing-here', '/blog?page=2'])];
  let i = 0;
  const visit = async () => {
    while (i < paths.length) {
      const p = paths[i++];
      job.done += 1;
      try { await (await fetch(`${origin()}/it${p === '/' ? '' : p}`, { headers: { 'user-agent': 'GladTranslateScan/1.0', 'x-forwarded-for': '127.0.0.1' } })).text(); } catch (_) { /* the page is skipped */ }
    }
  };
  job.step = 'Reading every page'; job.total = paths.length; job.done = 0;
  await Promise.all([visit(), visit(), visit(), visit()]);
  await store.flushMisses();
  return paths.length;
}

const dayKey = () => new Date().toISOString().slice(0, 10);

/** Translates up to `limit` waiting sentences per language. Returns how many were translated. */
async function translateMissing({ langs = store.LANGS, limit = 100000 } = {}) {
  const cfg = await config.get();
  if (!cfg) throw new Error('No API key yet. Add your Claude API key in CMS > Translations.');
  if (usedToday.date !== dayKey()) usedToday = { date: dayKey(), segments: 0 };
  let total = 0;
  for (const lang of langs) {
    const todo = store.missingFor(lang).slice(0, limit);
    job.step = 'Translating'; job.lang = lang; job.total += todo.length;
    for (let i = 0; i < todo.length; ) {
      if (usedToday.segments >= cfg.dailyCap) { job.error = `The daily limit of ${cfg.dailyCap} sentences was reached. It continues tomorrow, or raise the limit.`; return total; }
      let size = 0; const batch = [];
      while (i < todo.length && batch.length < 40 && size < 9000) { batch.push(todo[i]); size += todo[i].en.length; i += 1; }
      const items = batch.map((r, n) => ({ id: String(n), kind: r.kind, text: r.en }));
      const { translations, rejected, usage } = await translateBatch(items, lang, cfg);
      const saved = Object.entries(translations).map(([id, text]) => ({ en: batch[Number(id)].en, lang, text, by: 'ai', kind: batch[Number(id)].kind }));
      await store.save(saved);
      total += saved.length; job.done += batch.length; job.rejected += rejected.length;
      usedToday.segments += batch.length;
      if (usage) job.cost += ((usage.input_tokens || 0) * (config.MODELS.find((m) => m.id === cfg.model) || { in: 4 }).in + (usage.output_tokens || 0) * (config.MODELS.find((m) => m.id === cfg.model) || { out: 20 }).out) / 1e6;
    }
  }
  return total;
}

/** Runs a job (scan and/or translate) in the background; only one at a time. */
function start(kind, opts = {}) {
  if (job.running) return false;
  Object.assign(job, { running: true, step: 'Starting', lang: '', done: 0, total: 0, rejected: 0, error: '', startedAt: new Date().toISOString(), finishedAt: '', cost: 0, kind });
  (async () => {
    try {
      if (kind === 'scan' || kind === 'all') await scan();
      if (kind === 'translate' || kind === 'all') await translateMissing(opts);
      dirty = false;
      job.step = 'Done';
    } catch (e) {
      job.error = e.message; job.step = 'Stopped'; logger.warn(`translation job: ${e.message}`);
    } finally {
      job.running = false; job.finishedAt = new Date().toISOString();
    }
  })();
  return true;
}

/** Every 20 minutes: when content changed (or sentences are waiting) and automatic translation is on, scan and translate. */
function startAuto() {
  const t = setInterval(async () => {
    try {
      const cfg = await config.get();
      if (!cfg || !cfg.auto || job.running) return;
      const waiting = store.LANGS.reduce((n, l) => n + store.stats()[l].missing, 0);
      if (!dirty && !waiting) return;
      start('all', { limit: 800 });
    } catch (e) { logger.warn(`automatic translation: ${e.message}`); }
  }, 20 * 60 * 1000);
  t.unref();
}

const status = () => ({ ...job, usedToday: usedToday.segments });
const markDirty = () => { dirty = true; };

module.exports = { scan, translateMissing, start, startAuto, status, markDirty };
