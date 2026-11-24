/**
 * 301 redirects from the old WordPress addresses to the new site, so existing Google rankings carry over.
 * Editable in CMS > Redirects & 404s.
 */
const tours = require('./tours');
const destinations = require('./destinations');

const rows = [];
const add = (from, to, note = 'Old WordPress address') =>
  rows.push({ id: `redirect-${rows.length + 1}`, from, to, code: 301, enabled: true, hits: 0, note, sort: rows.length });

// Old product pages -> tour pages (WordPress sometimes added "-2" to duplicates).
tours.forEach((t) => add(`/product/${t.slug}`, `/tours/${t.slug}`));
['6-day-tanzania-big-five-big-cat-group-safari', '7-days-wildebeest-migration-group-safari'].forEach((s) => add(`/product/${s}-2`, `/tours/${s}`));

// Old destination pages.
const OLD_DEST_PATHS = { 'lake-manyara-national-park': 'lake-manyara-national-park-2', 'mount-meru': 'mount-meru-2' };
destinations.forEach((d) => add(`/${OLD_DEST_PATHS[d.slug] || d.slug}`, `/destinations/${d.slug}`));

// Category and info pages.
[
  ['/exclusive-fly-in-safaris', '/tanzania-safaris/luxury'],
  ['/joining-group-safaris', '/tanzania-safaris/group'],
  ['/migration-safaris', '/tanzania-safaris/migration'],
  ['/budget-safaris', '/tanzania-safaris/budget'],
  ['/hiking-trekking', '/tanzania-safaris/trekking'],
  ['/day-trip-experience', '/tanzania-safaris/day-trips'],
  ['/tanzania-safari-destinations', '/destinations'],
  ['/about-us-2', '/about-us'],
  ['/contact', '/contact-us'],
  ['/faq', '/faqs'],
  ['/terms-and-conditions-2', '/terms-and-conditions'],
  ['/privacy-policy-2', '/privacy-policy'],
  ['/great-migration-safari', '/blog/great-migration-safari'],
  ['/7-day-ndutu-calving-season-safari-tanzania-itinerary-costs', '/blog/7-day-ndutu-calving-season-safari-tanzania-itinerary-costs'],
  ['/serengeti-big-cats-the-tree-climbing-cats-experience', '/blog/serengeti-big-cats-the-tree-climbing-cats-experience'],
].forEach(([from, to]) => add(from, to));

module.exports = rows;
