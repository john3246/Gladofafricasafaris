const categoriesService = require('../tours/categories.service');
const toursService = require('../tours/tours.service');

/** What each built-in category says when the team has not typed its own text (CMS > Tour Categories > Quick facts). */
const DEFAULT_MONTHS = {
  'day-trips': 'All year', group: 'All year (fixed departures)', migration: 'Calving Jan-Mar, Mara River Jul-Oct', 'calving-season': 'January to March',
  midrange: 'All year', budget: 'All year', luxury: 'All year', trekking: 'Jan-Mar and Jun-Oct', zanzibar: 'All year',
};
const DEFAULT_INCLUDES = {
  'day-trips': 'Guide, lunch, park fees and transport', group: 'Shared 4x4, guide, park fees and accommodation',
  migration: 'Private 4x4, guide, park fees and camps named in the itinerary', 'calving-season': 'Private 4x4, guide, park fees and Ndutu-area camps',
  midrange: 'Private 4x4, guide, park fees and lodges or camps', budget: 'Shared or private 4x4, guide, park fees and camping or budget lodges',
  luxury: 'Bush flights, boutique camps, guide and park fees', trekking: 'Mountain guides, permits and park fees', zanzibar: 'Beach stay, transfers and the safari part',
};
const money = (n) => `$${Number(n).toLocaleString('en-US')}`;

/** One row per safari category: duration and starting price come from the live tours, so they never go out of date. */
async function rows(currentSlug = '') {
  const out = [];
  for (const c of await categoriesService.list()) {
    if (c.ruleType === 'bestseller' || c.slug === 'signature') continue;
    const data = await toursService.byCategory(c.slug);
    const tours = ((data && data.tours) || []).filter((t) => Number(t.priceFrom) > 0);
    if (!tours.length) continue;
    const days = tours.map((t) => Number(t.days) || 1);
    const lo = Math.min(...days);
    const hi = Math.max(...days);
    out.push({
      slug: c.slug,
      name: c.name,
      count: tours.length,
      current: c.slug === currentSlug,
      duration: lo === hi ? `${lo} day${lo === 1 ? '' : 's'}` : `${lo}-${hi} days`,
      from: money(Math.min(...tours.map((t) => Number(t.priceFrom)))),
      months: c.bestMonths || DEFAULT_MONTHS[c.slug] || 'All year',
      includes: c.factsIncludes || DEFAULT_INCLUDES[c.slug] || 'See each itinerary',
    });
  }
  return out;
}

module.exports = { rows };
