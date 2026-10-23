const { site, env } = require('../../config');

/** TravelAgency + LocalBusiness: powers the Google knowledge panel and local SEO for "safari operator Arusha". */
module.exports = () => ({
  '@context': 'https://schema.org',
  '@type': ['TravelAgency', 'LocalBusiness'],
  '@id': `${env.siteUrl}/#organization`,
  name: site.name,
  url: env.siteUrl,
  logo: `${env.siteUrl}${site.logo}`,
  image: `${env.siteUrl}${site.defaultOgImage}`,
  description: 'Locally owned Tanzania tour operator in Arusha offering luxury, midrange and budget northern circuit safaris, Great Migration safaris and Kilimanjaro treks.',
  telephone: site.phoneRaw,
  email: site.email,
  priceRange: '$$-$$$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
  },
  geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
  areaServed: 'Tanzania',
  sameAs: site.social.map((s) => s.url),
});
