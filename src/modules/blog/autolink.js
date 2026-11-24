const destinationsService = require('../destinations/destinations.service');
const categoriesService = require('../tours/categories.service');

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isTag = (s) => /^<[^>]*>$/.test(s);

// Phrases that point at a page of the site, tried before destination names. Only used when the target exists.
const PHRASES = [
  ['Great Migration', '/tanzania-safaris/migration'], ['Mara River crossing', '/tanzania-safaris/migration'], ['calving season', '/tanzania-safaris/migration'],
  ['fly-in safari', '/tanzania-safaris/luxury'], ['luxury safari', '/tanzania-safaris/luxury'], ['budget safari', '/tanzania-safaris/budget'],
  ['joining group', '/tanzania-safaris/group'], ['group safari', '/tanzania-safaris/group'], ['day excursion', '/tanzania-safaris/day-trips'],
  ['Kilimanjaro climb', '/tanzania-safaris/trekking'], ['free quote', '/get-a-quote'], ['tailor-made', '/get-a-quote'],
];

/** Link targets for the site's own content: category pages, quote form and every destination (full and short name). */
async function rules() {
  const [dests, cats] = await Promise.all([destinationsService.list(), categoriesService.list()]);
  const known = new Set(['/get-a-quote', ...cats.map((c) => `/tanzania-safaris/${c.slug}`)]);
  const out = PHRASES.filter(([, href]) => known.has(href)).map(([term, href]) => ({ term, href }));
  // A category's own keyword (luxury, midrange, budget, migration, trekking...) links to its page.
  cats.filter((c) => ['level', 'tag'].includes(c.ruleType) && String(c.ruleValue).length > 4 && c.showInMenu)
    .forEach((c) => out.push({ term: c.ruleValue, href: `/tanzania-safaris/${c.slug}` }));
  const byLength = [];
  dests.forEach((d) => {
    const short = d.name.replace(/\s+(National Park|Crater|Island|Beach|Mountains National Park)$/i, '');
    byLength.push({ term: d.name, href: `/destinations/${d.slug}` });
    if (short !== d.name && short.length > 4) byLength.push({ term: short, href: `/destinations/${d.slug}` });
  });
  return [...out, ...byLength.sort((a, b) => b.term.length - a.term.length)].map((r) => ({ ...r, re: new RegExp(`\\b${escapeRe(r.term)}\\b`, 'i') }));
}

/**
 * Wraps the first mention of each term in a link to the matching page. Skips text that is already inside a link
 * or a heading, never links the same page twice and stops after `max` new links so the article still reads naturally.
 */
function apply(html, ruleList, { max = 10 } = {}) {
  if (!html) return html;
  const used = new Set([...html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)].map((m) => m[1]));
  let parts = html.split(/(<[^>]*>)/).filter((p) => p !== '');
  let added = 0;
  for (const rule of ruleList) {
    if (added >= max) break;
    if (used.has(rule.href)) continue;
    let inLink = 0;
    let inHead = 0;
    for (let i = 0; i < parts.length; i += 1) {
      const p = parts[i];
      if (isTag(p)) {
        if (/^<a[\s>]/i.test(p)) inLink += 1; else if (/^<\/a>/i.test(p)) inLink -= 1;
        else if (/^<h[1-6][\s>]/i.test(p)) inHead += 1; else if (/^<\/h[1-6]>/i.test(p)) inHead -= 1;
        continue;
      }
      if (inLink > 0 || inHead > 0) continue;
      const m = rule.re.exec(p);
      if (!m) continue;
      const linked = `${p.slice(0, m.index)}<a href="${rule.href}">${m[0]}</a>${p.slice(m.index + m[0].length)}`;
      parts = [...parts.slice(0, i), ...linked.split(/(<[^>]*>)/).filter((x) => x !== ''), ...parts.slice(i + 1)];
      used.add(rule.href);
      added += 1;
      break;
    }
  }
  return parts.join('');
}

module.exports = { rules, apply };
