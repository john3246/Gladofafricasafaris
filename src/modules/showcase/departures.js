const { departures } = require('../../store/collections');
const { isLive } = require('../../store/publicRepository');
const toursService = require('../tours/tours.service');

/** Upcoming published group departures (CMS > Group departures), soonest first, with the safari's title and price. */
async function upcoming() {
  const today = new Date().toISOString().slice(0, 10);
  const all = await toursService.list();
  const out = [];
  for (const d of (await departures.list()).filter(isLive)) {
    if (!d.date || d.date < today) continue;
    const tour = all.find((t) => t.slug === d.tourSlug);
    if (!tour) continue;
    const spots = d.spotsOpen === '' || d.spotsOpen === undefined || d.spotsOpen === null ? null : Number(d.spotsOpen);
    out.push({
      date: d.date, slug: tour.slug, title: tour.title, days: tour.days,
      max: Number(d.maxGroup) || null, spots, full: spots === 0,
      price: Number(d.price) > 0 ? Number(d.price) : Number(tour.priceFrom) || 0,
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

module.exports = { upcoming };
