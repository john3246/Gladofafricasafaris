const { tours, categories } = require('../../../store/collections');

const uniq = (list) => [...new Set(list.filter(Boolean))];

/**
 * Levels and tags already used by tours or referenced by category rules. The tour editor offers these as
 * choices but never limits the editor to them: anything new typed in becomes a choice next time.
 */
async function tourVocabulary() {
  const [allTours, cats] = await Promise.all([tours.list(), categories.list()]);
  const levels = uniq([...allTours.map((t) => t.tier), ...cats.filter((c) => c.ruleType === 'level').map((c) => c.ruleValue)]).sort();
  const tagLabel = new Map(cats.filter((c) => c.ruleType === 'tag').map((c) => [c.ruleValue, c.name]));
  const tags = uniq([...allTours.flatMap((t) => t.tags || []), ...tagLabel.keys()]).sort()
    .map((value) => ({ value, label: tagLabel.has(value) ? `${tagLabel.get(value)} (${value})` : value }));
  return { levels, tags, ruleValues: uniq([...levels, ...tags.map((t) => t.value)]) };
}

module.exports = { tourVocabulary };
