const { env, site } = require('../../config');
const { abs } = require('../meta');

/** TouristTrip + Offer. Only confirmed prices are marked up so structured data never misstates a price. */
module.exports = (tour) => ({
  '@context': 'https://schema.org',
  '@type': 'TouristTrip',
  name: tour.title,
  description: tour.summary,
  image: abs(tour.image || site.defaultOgImage),
  url: `${env.siteUrl}/tours/${tour.slug}`,
  touristType: `${tour.tier} safari travellers`,
  provider: { '@id': `${env.siteUrl}/#organization`, '@type': 'TravelAgency', name: site.name },
  itinerary: {
    '@type': 'ItemList',
    itemListElement: tour.itinerary.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d.title, description: d.text })),
  },
  ...(tour.priceConfirmed
    ? {
        offers: {
          '@type': 'Offer',
          price: tour.priceFrom,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `${env.siteUrl}/tours/${tour.slug}`,
        },
      }
    : {}),
});
