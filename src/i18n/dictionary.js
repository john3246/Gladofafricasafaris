const { STRINGS, PATTERNS } = require('./strings');
const { PAGES } = require('./pages');
const GENERATED = require('./strings.generated');
const store = require('./store');
const INSURANCE = require('./insurance.rows');
const FAQ = require('./faq.rows');

const IDX = { it: 1, fr: 2, de: 3 };
const exact = { es: new Map(), it: new Map(), fr: new Map(), de: new Map(), zh: new Map() };
const norm = (s) => s.replace(/\s+/g, ' ').trim();

for (const row of [...GENERATED, ...STRINGS, ...PAGES, ...INSURANCE, ...FAQ]) {
  const en = norm(row[0]);
  for (const lang of Object.keys(IDX)) if (row[IDX[lang]]) exact[lang].set(en, row[IDX[lang]]);
}

const ES = require('./strings.es');
for (const row of ES.ROWS) exact.es.set(norm(row[0]), row[1]);
for (const row of require('./strings.zh').ROWS) exact.zh.set(norm(row[0]), row[1]);

const patterns = PATTERNS.map((row) => ({ re: new RegExp(`^${row[0]}$`), to: { es: ES.PATTERNS[row[0]], it: row[1], fr: row[2], de: row[3], zh: row[4] } }));

/**
 * The translation of a piece of English text, or null when there is none.
 * Patterns: $1 is the matched text as it is, {1} is the matched text translated (recursively).
 */
function translate(core, lang) {
  if (!exact[lang]) return null;
  const own = store.get(lang, core);
  if (own) return own;
  const hit = exact[lang].get(core);
  if (hit) return hit;
  for (const p of patterns) {
    const m = core.match(p.re);
    if (m && p.to[lang]) {
      return p.to[lang]
        .replace(/\{(\d)\}/g, (x, i) => translate(m[Number(i)] || '', lang) || m[Number(i)] || '')
        .replace(/\$(\d)/g, (x, i) => m[Number(i)] || '');
    }
  }
  return null;
}

module.exports = { translate, stats: () => ({ es: exact.es.size, it: exact.it.size, fr: exact.fr.size, de: exact.de.size, zh: exact.zh.size, patterns: patterns.length }) };
