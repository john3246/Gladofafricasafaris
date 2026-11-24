/**
 * The client's latest itinerary documents (content/packages/*.txt).
 *  - update: true  -> overwrite an existing live-site tour (keeps its title, tags, tier, badge)
 *  - update: false -> create a new tour using `title`, `tier`, `tags`, `style`
 * Photos come from public/images/gallery (see processPhotos.js).
 */
const g = (n) => `/images/gallery/${n}.webp`;

module.exports = [
  {
    file: '12-day-ultimate-tanzania-trip.txt', slug: '12-day-ultimate-tanzania-trip', update: false,
    title: '12-Day Ultimate Tanzania Trip', tier: 'midrange', tags: ['migration'], style: 'Private',
    image: g('glad-9840'), gallery: [g('glad-9841'), g('glad-9873'), g('glad-9865'), g('cheetah')],
    destinations: ['arusha-national-park', 'tarangire-national-park', 'serengeti-national-park', 'ngorongoro-crater', 'mount-kilimanjaro'],
  },
  {
    file: '7-day-midrange-northern-serengeti-migration.txt', slug: '7-day-midrange-northern-serengeti-wildebeest-migration', update: false,
    title: '7-Day Mid-Range Northern Serengeti Wildebeest Migration', tier: 'midrange', tags: ['migration'], style: 'Private',
    image: g('glad-9873'), gallery: [g('glad-9885'), g('glad-9887'), g('glad-9899'), g('glad-9993')],
  },
  {
    file: '8-day-private-midrange-mara-river-crossing.txt', slug: '8-day-private-midrange-serengeti-mara-river-crossing', update: false,
    title: '8-Day Private Mid-Range Serengeti Mara River Crossing', tier: 'midrange', tags: ['migration'], style: 'Private',
    image: g('glad-9865'), gallery: [g('glad-9889'), g('glad-9900'), g('glad-9994'), g('glad-9995')],
  },
  {
    file: '8-day-private-mara-river-crossing-experience.txt', slug: '8-day-private-mara-river-crossing-experience', update: false,
    title: '8-Day Private Mara River Crossing Experience', tier: 'midrange', tags: ['migration'], style: 'Private',
    image: g('glad-9903'), gallery: [g('glad-9901'), g('glad-9940'), g('glad-9993'), g('cheetah')],
  },
  { file: '7-day-february-calving-season-safari.txt', slug: '7-day-february-calving-season-safari', update: true, addGallery: [g('cheetah'), g('glad-9885')] },
  { file: '8-day-great-migration-moments.txt', slug: '8-day-great-migration-moments', update: true, addGallery: [g('glad-9887'), g('glad-9899')] },
  { file: '8-day-calving-season-safari.txt', slug: '8-days-experience-calving-season-in-tanzania', update: true, addGallery: [g('glad-9888'), g('cheetah')] },
  { file: '8-day-fly-out-mara-river-to-zanzibar.txt', slug: '8-days-fly-out-from-mara-river-crossing-experience-to-zanzibar', update: true, addGallery: [g('glad-9940'), g('glad-9995')] },
];
