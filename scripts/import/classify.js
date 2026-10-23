/**
 * Maps the live site's category listing pages to this site's tour categories and price tiers.
 * Listing pages on the live site -> tag used by /tanzania-safaris/:category filters.
 */
const LISTINGS = {
  luxury: 'exclusive-fly-in-safaris',
  group: 'joining-group-safaris',
  migration: 'migration-safaris',
  budget: 'budget-safaris',
  trekking: 'hiking-trekking',
  'day-trips': 'day-trip-experience',
};

/** Prices shown as struck-through "was" prices on the live home page. */
const WAS_PRICES = {
  '6-day-tanzania-big-five-big-cat-group-safari': 1200,
  '7-days-wildebeest-migration-group-safari': 1400,
  '8-day-northern-serengeti-mara-river-crossing-safari': 3000,
};

const DEST_KEYWORDS = {
  'serengeti-national-park': /serengeti|ndutu|mara river/i,
  'ngorongoro-crater': /ngorongoro/i,
  'tarangire-national-park': /tarangire/i,
  'lake-manyara-national-park': /manyara/i,
  'arusha-national-park': /arusha national park/i,
  'mount-kilimanjaro': /kilimanjaro|machame|marangu|lemosho/i,
  'mount-meru': /\bmeru\b/i,
  'mount-ol-donyo-lengai': /lengai/i,
};

/**
 * These three are the live site's "featured" widget and appear on every listing page,
 * so listing membership says nothing about them. Tags follow the live home page instead.
 */
const TAG_OVERRIDES = {
  '6-day-tanzania-big-five-big-cat-group-safari': ['group', 'migration', 'budget'],
  '7-days-wildebeest-migration-group-safari': ['group', 'migration', 'budget'],
  '8-day-northern-serengeti-mara-river-crossing-safari': ['migration'],
};

function classify(tour, listingTags) {
  const tags = TAG_OVERRIDES[tour.slug] || listingTags;
  const tier = /mid-?range/i.test(tour.title) ? 'midrange' : tags.includes('luxury') ? 'luxury' : tags.some((t) => ['budget', 'group', 'day-trips'].includes(t)) ? 'budget' : 'midrange';
  const days = Number((tour.title.match(/(\d+)\s*-?\s*Days?/i) || [])[1]) || tour.itinerary.length || 1;
  const haystack = `${tour.title} ${tour.description.join(' ')}`;
  const destinations = Object.keys(DEST_KEYWORDS).filter((k) => DEST_KEYWORDS[k].test(haystack));
  const style = tags.includes('group') ? 'Joining group' : tags.includes('luxury') ? 'Private fly-in' : tags.includes('trekking') ? 'Trek' : tags.includes('day-trips') ? 'Day trip' : 'Private';
  return { tier, days, destinations, style, tags, priceWas: WAS_PRICES[tour.slug] || null };
}

module.exports = { LISTINGS, classify };
