const toursService = require('../tours/tours.service');
const { site } = require('../../config');

/** The four kinds of safari the price finder offers, and the category each one reads its safaris from. */
const TYPES = [
  { value: 'day-trips', label: 'Day excursion from Arusha' },
  { value: 'group', label: 'Joining group safari' },
  { value: 'midrange', label: 'Midrange lodge safari' },
  { value: 'luxury', label: 'Luxury fly-in safari' },
];

/** Compact tour list for the browser: only real, priced safaris, so every estimate is a published price. */
async function data() {
  const byId = new Map();
  for (const type of TYPES) {
    const found = await toursService.byCategory(type.value);
    for (const t of (found && found.tours) || []) {
      if (!(Number(t.priceFrom) > 0)) continue;
      const row = byId.get(t.slug) || { s: t.slug, t: t.title, d: Number(t.days) || 1, p: Number(t.priceFrom), y: [], c: (t.tags || []).includes('calving'), m: (t.tags || []).includes('migration') };
      row.y.push(type.value);
      byId.set(t.slug, row);
    }
  }
  return { types: TYPES, tours: [...byId.values()], phone: String(site.phoneRaw || '').replace(/[^\d]/g, '') };
}

module.exports = { data, TYPES };
