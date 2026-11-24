const repo = require('./tours.repository');
const destinationsRepo = require('../destinations/destinations.repository');
const categoriesService = require('./categories.service');

const list = () => repo.findAll();
const bySlug = (slug) => repo.findBySlug(slug);

async function byCategory(slug) {
  const cat = await categoriesService.bySlug(slug);
  if (!cat) return null;
  const picked = (await list()).filter(categoriesService.matcher(cat));
  if (cat.ruleType === 'bestseller') picked.sort((a, b) => (a.bestSellerOrder ?? 9999) - (b.bestSellerOrder ?? 9999));
  return { category: cat, tours: picked };
}

const signature = async (limit = 5) => (await list()).filter((t) => t.tags.includes('signature')).slice(0, limit);

const byTag = async (tag, limit = 3) => (await list()).filter((t) => t.tags.includes(tag)).slice(0, limit);

const bySlugs = async (slugs) => {
  const all = await list();
  return slugs.map((s) => all.find((t) => t.slug === s)).filter(Boolean);
};

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

module.exports = { list, bySlug, byCategory, signature, byTag, bySlugs, countForCircuit, related, forDestination };
