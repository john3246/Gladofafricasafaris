const fs = require('fs');
const path = require('path');

/** The Italian, French and German FAQ answers (tr-faq.txt), paired with the English questions and answers they translate. */
const source = [...require('../data/faqs.json'), ...require('../data/calving.seo').faqs];
const rows = [];
for (const line of fs.readFileSync(path.join(__dirname, 'tr-faq.txt'), 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const [id, it, fr, de] = line.split('¦').map((s) => s.trim());
  const faq = source[parseInt(id, 10)];
  if (faq) rows.push([id.endsWith('Q') ? faq.q : faq.a, it, fr, de]);
}
module.exports = rows;
