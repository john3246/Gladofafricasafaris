const { env, site } = require('../../config');
const { abs } = require('../meta');

/** TouristDestination for a national park, crater, mountain or island page. */
module.exports = (d) => ({
  '@context': 'https://schema.org',
  '@type': 'TouristDestination',
  name: d.name,
  description: d.summary || d.description,
  url: `${env.siteUrl}/destinations/${d.slug}`,
  image: abs(d.image || site.defaultOgImage),
  containedInPlace: { '@type': 'Country', name: 'Tanzania' },
  touristType: ['Safari travellers', 'Wildlife photographers', 'Families'],
});
