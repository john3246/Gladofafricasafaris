const { tours, pages, categories, posts } = require('../../store/collections');

/**
 * One-time (Nov 2026): spelling fix in the 6-day Ndutu safari (the address stays the same, so no link is lost), the prices-at-a-glance
 * table on the group and day-trip pages, and the safari price finder on the home page and the Ndutu cost article.
 * Anything an editor already changed is left alone.
 */
async function geo() {
  let n = 0;
  const t = await tours.get('6-days-ndutu-safari');
  if (t) {
    const fixed = { ...t };
    for (const k of ['title', 'metaTitle', 'metaDescription', 'summary', 'description']) if (typeof t[k] === 'string') fixed[k] = t[k].replace(/calviry/gi, (m) => (m[0] === 'C' ? 'Calving' : 'calving'));
    if (JSON.stringify(fixed) !== JSON.stringify(t)) { await tours.put(fixed); n += 1; }
  }
  for (const slug of ['group', 'day-trips']) {
    const c = await categories.get(slug);
    if (c && c.showFacts === undefined) { await categories.put({ ...c, showFacts: true }); n += 1; }
  }
  const home = await pages.get('home');
  if (home && !(home.blocks || []).some((b) => b.type === 'finder')) {
    const blocks = [...(home.blocks || [])];
    const at = blocks.findIndex((b) => b.category === 'offers');
    blocks.splice(at >= 0 ? at + 1 : Math.min(2, blocks.length), 0, { type: 'finder', theme: 'sand' });
    await pages.put({ ...home, blocks });
    n += 1;
  }
  const post = await posts.get('ndutu-calving-safari-cost-and-itinerary');
  if (post && post.finder === undefined) { await posts.put({ ...post, finder: true }); n += 1; }
  return `${n} search and finder items updated`;
}

/** One-time: puts the tourism licence number (it stays the same when the licence is renewed) in Site Settings, unless the team already typed a line. */
async function licence() {
  const { settings } = require('../../store/collections');
  const cur = (await settings.get('site')) || { key: 'site' };
  if (String(cur.licenseInfo || '').trim()) return 'licence line already set';
  await settings.put({ ...cur, key: 'site', licenseInfo: 'Tourism Agent licence no. 031400, Ministry of Natural Resources and Tourism' });
  return 'licence line added';
}



/** One-time: applies the house wording (no "trip") to the text already stored in the database. Guest reviews are never touched. */
async function wording() {
  const c = require('../../store/collections');
  const { rewriteDeep } = require('../../utils/wording');
  let n = 0;
  for (const name of ['tours', 'categories', 'posts', 'faqs', 'pages', 'destinations', 'policies', 'accommodations', 'regions', 'settings', 'emailtemplates']) {
    if (!c[name]) continue;
    for (const doc of await c[name].list()) {
      const next = rewriteDeep(doc);
      if (JSON.stringify(next) !== JSON.stringify(doc)) { await c[name].put(next); n += 1; }
    }
  }
  return `${n} stored documents reworded`;
}
module.exports = { geo, licence, wording };
