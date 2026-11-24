const { THEMES, DEFAULT_COUNT } = require('./blocks.types');
const { regions } = require('../../store/collections');
const { isLive } = require('../../store/publicRepository');
const toursService = require('../tours/tours.service');
const bestSellers = require('../tours/bestsellers');
const categoriesService = require('../tours/categories.service');
const destinationsService = require('../destinations/destinations.service');
const blogService = require('../blog/blog.service');
const faqService = require('../faq/faq.service');
const reviewsService = require('../reviews/reviews.service');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/** Escapes text but keeps <em>…</em> so editors can colour a word in headings. */
const headingHtml = (s) => esc(s).replace(/&lt;(\/?)em&gt;/g, '<$1em>');
const parts = (line) => String(line).split('|').map((p) => p.trim());

/** "Label | /link" lines -> buttons; the first is the main one, the rest are secondary. */
function buttons(lines, dark) {
  return (lines || []).map(parts).filter((p) => p[0] && p[1]).map((p, i) => ({
    label: p[0], href: p[1], cls: i === 0 ? (dark ? 'btn-gold' : 'btn-primary') : (dark ? 'btn-light' : 'btn-dark'),
  }));
}

async function pickTours(b) {
  const n = Number(b.count) || DEFAULT_COUNT.tours;
  if (b.tourSlugs && b.tourSlugs.length) return toursService.bySlugs(b.tourSlugs);
  if (b.category === 'best-selling') {
    const home = await bestSellers.list({ homeOnly: true });
    return (home.length ? home : await bestSellers.list()).slice(0, n);
  }
  if (b.category) {
    const data = await toursService.byCategory(b.category);
    return data ? data.tours.slice(0, n) : [];
  }
  return (await toursService.list()).slice(0, n);
}

async function pickDestinations(b) {
  const all = await destinationsService.list();
  if (b.destSlugs && b.destSlugs.length) return b.destSlugs.map((s) => all.find((d) => d.slug === s)).filter(Boolean);
  const pool = b.region ? all.filter((d) => d.circuit === b.region) : all;
  return pool.slice(0, Number(b.count) || DEFAULT_COUNT.destinations);
}

async function pickRegions(b) {
  const list = (await regions.list()).filter((r) => isLive(r) && r.showOnHome).sort((a, c) => (a.sort ?? 0) - (c.sort ?? 0));
  return Promise.all(list.slice(0, Number(b.count) || DEFAULT_COUNT.regions).map(async (r) => ({
    ...r,
    trips: await toursService.countForCircuit(r.slug),
    image: (await destinationsService.bySlug(r.photo))?.image || '',
  })));
}

const LOADERS = {
  finder: async () => ({ finder: await require('../showcase/finder').data() }),
  facts: async () => ({ facts: await require('../showcase/quickFacts').rows() }),
  tours: async (b) => ({ tours: await pickTours(b), categories: b.showCategories ? (await categoriesService.list()).filter((c) => c.showInMenu) : [] }),
  destinations: async (b) => ({ destinations: await pickDestinations(b) }),
  regions: async (b) => ({ regions: await pickRegions(b) }),
  blog: async (b) => ({ posts: await blogService.latest(Number(b.count) || DEFAULT_COUNT.blog) }),
  faq: async (b) => ({ faqs: await faqService.top(Number(b.count) || DEFAULT_COUNT.faq, b.faqGroup || '') }),
  reviews: async (b) => {
    const all = await reviewsService.list();
    return { reviews: Number(b.count) ? all.slice(0, Number(b.count)) : all };
  },
};

/** Turns stored section rows into render-ready objects (theme, buttons, safe heading and the data each type needs). */
async function resolve(rows) {
  const visible = (rows || []).filter((b) => b && b.type && !b.hidden);
  return Promise.all(visible.map(async (b) => {
    const t = THEMES[b.theme] || THEMES.white;
    const out = { ...b, t, headingHtml: headingHtml(b.heading), buttons: buttons(b.buttons, t.dark) };
    if (['tiles', 'features', 'whyus'].includes(b.type)) out.rows = (b.items || []).map(parts).filter((p) => p[0]);
    out.data = LOADERS[b.type] ? await LOADERS[b.type](b) : {};
    return out;
  }));
}

module.exports = { resolve };
