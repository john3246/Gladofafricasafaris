const { nights, route } = require('../../utils/format');

/** The questions shown on a tour page (and sent to Google as FAQ data), so the two always match. */
module.exports = (tour) => [
  { q: `How much does the ${tour.title} cost?`, a: tour.priceConfirmed === false ? 'Request a free quote for your exact dates and group size.' : `The ${tour.title} starts from USD ${Number(tour.priceFrom).toLocaleString('en-US')} per person. Request a free quote for your exact dates and group size.` },
  { q: `How long is the ${tour.title}?`, a: `It is ${nights(tour.days)}${(tour.destinations || []).length ? ' and covers ' + route(tour.destinations) : ''}.` },
  { q: 'Can this safari be tailored?', a: 'Yes. Every itinerary can be adjusted for your dates, pace, accommodation level and budget by our Arusha team.' },
];
