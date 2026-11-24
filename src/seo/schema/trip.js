const { env, site } = require('../../config');
const { abs } = require('../meta');
const dayDetails = require('../../modules/tours/dayDetails');

/**
 * TouristTrip + Product with an AggregateOffer and a day-by-day itinerary (one TouristAttraction stop per day).
 * Only confirmed prices are marked up, so structured data never misstates a price.
 */
module.exports = (tour, days) => {
  const stops = days || dayDetails.build(tour.itinerary || [], [], []);
  const url = `${env.siteUrl}/tours/${tour.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': ['TouristTrip', 'Product'],
    name: tour.title,
    description: tour.summary,
    image: abs(tour.image || site.defaultOgImage),
    url,
    sku: tour.slug,
    brand: { '@type': 'Brand', name: site.name },
    inLanguage: 'en',
    ...(tour.days ? { duration: `P${tour.days}D` } : {}),
    touristType: `${tour.tier} safari travellers`,
    provider: { '@type': 'TravelAgency', '@id': `${env.siteUrl}/#organization`, name: site.name },
    itinerary: {
      '@type': 'ItemList',
      itemListElement: stops.map((d, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'TouristAttraction', name: d.destination || d.title, description: `Day ${d.day}: ${d.title}`, ...(d.hub ? { url: `${env.siteUrl}/destinations/${d.hub}` } : {}) },
      })),
    },
    ...(tour.priceConfirmed
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: tour.priceFrom,
            highPrice: tour.priceWas && tour.priceWas > tour.priceFrom ? tour.priceWas : tour.priceFrom,
            offerCount: 1,
            availability: 'https://schema.org/InStock',
            url,
            seller: { '@id': `${env.siteUrl}/#organization` },
          },
        }
      : {}),
  };
};
