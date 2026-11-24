const { categories } = require('../../store/collections');
const { isLive } = require('../../store/publicRepository');

const norm = (v) => String(v || '').trim().toLowerCase();

/** Does a tour belong to a category? Rule types: level, tag, text (title contains), all. */
function matcher(cat) {
  const value = norm(cat.ruleValue);
  const excluded = norm(cat.excludeTag);
  return (t) => {
    const tags = (t.tags || []).map(norm);
    if (excluded && tags.includes(excluded)) return false;
    switch (cat.ruleType) {
      case 'level': return norm(t.tier) === value;
      case 'tag': return tags.includes(value);
      case 'text': return norm(t.title).includes(value);
      case 'bestseller': return t.bestSeller === true;
      case 'offer': return Boolean(String(t.offerLabel || '').trim());
      default: return true;
    }
  };
}

/** Published categories in the order set in the CMS. */
async function list() {
  return (await categories.list()).filter(isLive).filter((c) => c.hidden !== true).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

async function bySlug(slug) {
  const cat = await categories.get(slug);
  return isLive(cat) ? cat : null;
}

/** Adds any built-in category that is missing (e.g. "Best-selling" on a database created before it existed). */
async function ensureSystemCategories() {
  for (const c of require('../../data/categories.seed').filter((x) => x.system)) {
    if (!(await categories.get(c.slug))) await categories.put({ ...c });
  }
}

module.exports = { list, bySlug, matcher, ensureSystemCategories };
