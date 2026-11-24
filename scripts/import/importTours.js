const fs = require('fs');
const path = require('path');
const { BASE, getHtml } = require('./http');
const { parseProduct } = require('./parseProduct');
const { LISTINGS, classify } = require('./classify');
const { saveWebp } = require('./images');
const { text } = require('./html');
const { shortSummary } = require('./text');

const OUT = path.join(__dirname, '..', '..', 'src', 'data', 'tours');
const productLinks = (html) => [...new Set([...html.matchAll(/href="(https:\/\/gladofafricasafari\.com\/product\/[^"]+)"/g)].map((m) => m[1]))];

/** slug -> {url, tags[]} gathered from every listing page. */
async function collect() {
  const map = new Map();
  const add = (url, tag) => {
    const slug = url.split('/product/')[1].replace(/\/$/, '').replace(/-2$/, '');
    const e = map.get(slug) || { url, tags: [] };
    if (tag && !e.tags.includes(tag)) e.tags.push(tag);
    map.set(slug, e);
  };
  productLinks(await getHtml(`${BASE}/tanzania-safaris/`)).forEach((u) => add(u));
  for (const [tag, page] of Object.entries(LISTINGS)) {
    const links = productLinks(await getHtml(`${BASE}/${page}/`));
    // The day-trip page also shows featured safaris; keep only real day trips there.
    links.filter((u) => tag !== 'day-trips' || /day-trip/.test(u)).forEach((u) => add(u, tag));
  }
  // Home-page "Signature Journeys" products are unlisted on category pages: read them from the home page script.
  const home = await getHtml(`${BASE}/`);
  // The first five cards are the Signature Journeys carousel; later arrays are other sections that only carry badges.
  const cards = [...home.matchAll(/badge:'([^']*)',name:'[^']*',price:'[^']*',duration:'[^']*',link:'([^']+)'/g)];
  cards.forEach((m, i) => {
    add(m[2], i < 5 ? 'signature' : undefined);
    map.get(m[2].split('/product/')[1].replace(/\/$/, '').replace(/-2$/, '')).badge = m[1];
  });
  return map;
}

async function importTours() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.readdirSync(OUT).filter((f) => f.endsWith('.json')).forEach((f) => fs.unlinkSync(path.join(OUT, f)));
  const catalog = await collect();
  console.log(`tours: ${catalog.size} found`);

  for (const [slug, { url, tags, badge }] of catalog) {
    const p = parseProduct(await getHtml(url), url);
    const meta = classify(p, tags);
    const [main, ...rest] = p.images;
    const image = main ? await saveWebp(main, `images/tours/${slug}`, 1400) : null;
    const gallery = [];
    for (const [i, g] of rest.slice(0, 4).entries()) {
      const saved = await saveWebp(g, `images/tours/${slug}-${i + 2}`, 1200);
      if (saved) gallery.push(saved);
    }
    const summary = shortSummary(p.description[0] || '');
    const tour = {
      ...p, ...meta, image, gallery, summary, badge: badge || '',
      priceConfirmed: true,
      metaTitle: `${text(p.title)} | Glad Of Africa`,
      metaDescription: (p.description[0] || summary).slice(0, 155),
    };
    delete tour.images;
    fs.writeFileSync(path.join(OUT, `${slug}.json`), `${JSON.stringify(tour, null, 1)}\n`);
    console.log(`  ${slug} [${meta.tier}] ${tags.join(',')} $${p.priceFrom} days:${p.itinerary.length}`);
  }
}

module.exports = { importTours };
