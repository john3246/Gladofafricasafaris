/**
 * Lists the English words on the pages (text and attributes), most common first, with whatever is still missing from the
 * dictionary per language. Run against a throwaway server:  TEST_PORT=3079 node scripts/i18n-collect.js [--missing it]
 */
const fs = require('fs');
const dict = require('../src/i18n/dictionary');
const { transform } = require('../src/i18n/transform');

const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
const PAGES = (process.env.PAGES ? process.env.PAGES.split(',') : ['/', '/offers', '/tanzania-safaris', '/tanzania-safaris/budget', '/tours/6-days-ndutu-safari', '/tours/8-days-private-camping-tarangire-serengeti-ngorongoro-crater', '/destinations', '/destinations/tarangire-national-park', '/get-a-quote', '/contact-us', '/about-us', '/blog', '/faqs', '/accommodations', '/reviews', '/experiences', '/terms-and-conditions', '/nothing-here']);
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&rarr;': '→', '&middot;': '·', '&nbsp;': ' ', '&larr;': '←', '&bull;': '•' };
const dec = (s) => s.replace(/&[#a-z0-9]+;/gi, (m) => ENT[m] || m);

(async () => {
  const counts = new Map();
  for (const p of PAGES) {
    const html = await (await fetch(B + p)).text();
    const seen = new Set();
    transform(html, 'it', { path: p, onMiss: (core) => { if (/[A-Za-z]/.test(core) && !seen.has(core)) { seen.add(core); counts.set(core, [...(counts.get(core) || []), p]); } } });
  }
  const lang = (process.argv.find((a, i) => process.argv[i - 1] === '--missing') || '').trim();
  const rows = [...counts.entries()].map(([t, ps]) => ({ t, n: ps.length, pages: ps }));
  const missing = lang ? rows.filter((r) => dict.translate(r.t, lang) === null) : rows;
  missing.sort((a, b) => b.n - a.n || a.t.localeCompare(b.t));
  fs.writeFileSync('var/i18n-strings.json', JSON.stringify(missing, null, 1));
  console.log(`${rows.length} distinct texts; ${lang ? missing.length + ' missing in ' + lang : 'all listed'}; saved to var/i18n-strings.json`);
  const onMany = missing.filter((r) => r.n >= 3);
  console.log(`${onMany.length} appear on 3 or more pages`);
})();
