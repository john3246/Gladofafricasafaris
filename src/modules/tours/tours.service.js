const repo = require('./tours.repository');
const destinationsRepo = require('../destinations/destinations.repository');
const { categories } = require('./tours.categories');

const list = () => repo.findAll();
const bySlug = (slug) => repo.findBySlug(slug);

async function byCategory(slug) {
  const cat = categories[slug];
  if (!cat) return null;
  return { category: { slug, ...cat }, tours: (await list()).filter(cat.filter) };
}

const signature = async (limit = 5) => (await list()).filter((t) => t.tags.includes('signature')).slice(0, limit);

const byTag = async (tag, limit = 3) => (await list()).filter((t) => t.tags.includes(tag)).slice(0, limit);

const bySlugs = async (slugs) => {
  const all = await list();
  return slugs.map((s) => all.find((t) => t.slug === s)).filter(Boolean);
};

const zanzibar = async (limit = 3) => (await list()).filter((t) => /zanzibar/i.test(t.title)).slice(0, limit);

/** Tours that include at least one destination of the given circuit (northern/southern/zanzibar...). */
async function countForCircuit(circuit) {
  const [tours, dests] = await Promise.all([list(), destinationsRepo.findAll()]);
  const slugs = dests.filter((d) => d.circuit === circuit).map((d) => d.slug);
  if (circuit === 'zanzibar') return tours.filter((t) => /zanzibar/i.test(t.title)).length;
  return tours.filter((t) => t.destinations.some((s) => slugs.includes(s))).length;
}

async function related(tour, limit = 4) {
  const all = await list();
  const shared = (t) => t.tags.filter((x) => tour.tags.includes(x)).length;
  return all.filter((t) => t.slug !== tour.slug).sort((a, b) => shared(b) - shared(a)).slice(0, limit);
}

const forDestination = async (destSlug) => (await list()).filter((t) => t.destinations.includes(destSlug));

module.exports = { list, bySlug, byCategory, signature, byTag, bySlugs, zanzibar, countForCircuit, related, forDestination };
