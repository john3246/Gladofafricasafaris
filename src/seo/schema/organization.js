const { site, env } = require('../../config');

/** TravelAgency + Organization: powers the Google knowledge panel and local results for "safari operator Arusha". */
module.exports = () => ({
  '@context': 'https://schema.org',
  '@type': ['TravelAgency', 'Organization'],
  '@id': `${env.siteUrl}/#organization`,
  name: site.name,
  alternateName: site.shortName,
  url: env.siteUrl,
  logo: `${env.siteUrl}${site.logo}`,
  image: `${env.siteUrl}${site.defaultOgImage}`,
  description: 'Locally owned Tanzania tour operator in Arusha offering luxury, midrange and budget northern circuit safaris, Great Migration safaris and Kilimanjaro treks.',
  telephone: site.phone,
  email: site.email,
  ...(site.facts && site.facts.priceRange ? { priceRange: site.facts.priceRange } : {}),
  ...(site.facts && site.facts.payments ? { paymentAccepted: site.facts.payments } : {}),
  currenciesAccepted: 'USD',
  ...(site.facts && /\b\d{5,8}\b/.test(site.facts.licence || '') ? { identifier: { '@type': 'PropertyValue', name: 'Tourism licence number', value: site.facts.licence.match(/\b\d{5,8}\b/)[0] } } : {}),
  ...(site.facts && site.facts.memberOf ? { memberOf: { '@type': 'Organization', name: site.facts.memberOf } } : {}),
  ...(site.facts && Number(site.facts.ratingValue) > 0 && Number(site.facts.ratingCount) > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: site.facts.ratingValue, reviewCount: site.facts.ratingCount, bestRating: '5', worstRating: '1' } } : {}),
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
  },
  geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
  areaServed: ['Tanzania', 'Serengeti National Park', 'Ngorongoro Conservation Area', 'Mount Kilimanjaro', 'Zanzibar'],
  knowsAbout: ['Tanzania safaris', 'Great Migration', 'Kilimanjaro treks', 'Ngorongoro Crater', 'Zanzibar'],
  contactPoint: { '@type': 'ContactPoint', telephone: site.phone, email: site.email, contactType: 'customer service', availableLanguage: ['English'] },
  sameAs: [...new Set([...site.social.map((s) => s.url), ...((site.facts && site.facts.profiles) || [])])],
});
