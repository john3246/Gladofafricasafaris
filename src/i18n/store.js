const crypto = require('crypto');
const { translations, i18nstatus } = require('../store/collections');
const logger = require('../utils/logger');

/**
 * Every English sentence the site has shown in another language, with its Italian, French and German version.
 * Rows live in the database (CMS > Translations). The dictionary reads this overlay first, so a translation typed in the
 * CMS or produced by the translator wins over the built-in wording. Rows without a language are "waiting for translation".
 */
const LANGS = ['it', 'fr', 'de', 'zh'];
const rows = new Map(); // key -> row
const overlay = { it: new Map(), fr: new Map(), de: new Map(), zh: new Map() }; // English text -> translation
const status = new Map(); // "it/offers" -> { complete, share }
const pendingMiss = new Map(); // English text -> kind, waiting to be written
let loaded = false;
let timer = null;

const keyOf = (en) => crypto.createHash('sha1').update(en).digest('hex').slice(0, 20);

function index(row) {
  rows.set(row.key, row);
  for (const l of LANGS) if (row[l]) overlay[l].set(row.en, row[l]); else overlay[l].delete(row.en);
}

async function load() {
  if (loaded) return;
  loaded = true;
  for (const r of await translations.list()) index(r);
  for (const s of await i18nstatus.list()) status.set(s.key, s);
}

/** The translation of an English text from the database, or undefined. */
const get = (lang, en) => (overlay[lang] ? overlay[lang].get(en) : undefined);

/** Remember that a page needed this English text translated (written to the database a moment later). */
function noteMiss(en, kind = 'text') {
  if (!loaded || en.length < 2 || en.length > 6000) return;
  const key = keyOf(en);
  if (rows.has(key) || pendingMiss.has(en)) return;
  if (pendingMiss.size < 3000) pendingMiss.set(en, kind);
  if (!timer) { timer = setTimeout(flushMisses, 4000); timer.unref(); }
}

async function flushMisses() {
  timer = null;
  const batch = [...pendingMiss.entries()];
  pendingMiss.clear();
  for (const [en, kind] of batch) {
    const key = keyOf(en);
    if (rows.has(key)) continue;
    const row = { key, en, kind, createdAt: new Date().toISOString(), sort: -Date.now() };
    index(row);
    try { await translations.put(row); } catch (e) { logger.warn(`translation row not saved: ${e.message}`); }
  }
}

/** Saves translations: [{ en, lang, text, by }] (by: 'ai' or 'human'). */
async function save(items) {
  let n = 0;
  for (const it of items) {
    if (!LANGS.includes(it.lang) || !it.en || typeof it.text !== 'string') continue;
    const key = keyOf(it.en);
    const row = { ...(rows.get(key) || { key, en: it.en, kind: it.kind || 'text', createdAt: new Date().toISOString(), sort: -Date.now() }) };
    if (it.text.trim()) { row[it.lang] = it.text.trim(); row[`by_${it.lang}`] = it.by || 'human'; row.updatedAt = new Date().toISOString(); } else { delete row[it.lang]; delete row[`by_${it.lang}`]; }
    index(row);
    await translations.put(row);
    n += 1;
  }
  return n;
}

/** Records how much of a language version of a page was translated (used for hreflang tags and the sitemap). */
function setStatus(lang, path, share, complete) {
  const key = `${lang}${path === '/' ? '' : path}`;
  const cur = status.get(key);
  if (cur && cur.complete === complete && Math.abs(cur.share - share) < 0.02) return;
  const row = { key, lang, path, share: Math.round(share * 100) / 100, complete, at: new Date().toISOString() };
  status.set(key, row);
  i18nstatus.put(row).catch(() => {});
}
const isComplete = (lang, path) => {
  const s = status.get(`${lang}${path === '/' ? '' : path}`);
  return Boolean(s && s.complete);
};

/** Numbers for the CMS: how many sentences exist and how many are still missing per language. */
function stats() {
  const all = [...rows.values()];
  const out = { total: all.length, pending: pendingMiss.size };
  for (const l of LANGS) out[l] = { done: all.filter((r) => r[l]).length, missing: all.filter((r) => !r[l]).length, human: all.filter((r) => r[`by_${l}`] === 'human').length };
  out.pages = [...status.values()];
  return out;
}

const list = () => [...rows.values()];
const missingFor = (lang) => [...rows.values()].filter((r) => !r[lang]);

module.exports = { load, get, noteMiss, flushMisses, save, setStatus, isComplete, stats, list, missingFor, keyOf, LANGS };
