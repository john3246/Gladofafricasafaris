const toursService = require('../tours/tours.service');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The next 12 months as buttons for guests who do not have exact dates yet. */
function monthOptions() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    return { value: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`, short: MONTHS[d.getUTCMonth()].slice(0, 3), year: d.getUTCFullYear() };
  });
}

/** Finds a tour from a slug, or (older links) from its exact title. */
async function resolveTour(ref) {
  const key = String(ref || '').trim();
  if (!key) return null;
  const bySlug = await toursService.bySlug(key);
  if (bySlug) return bySlug;
  const lower = key.toLowerCase();
  return (await toursService.list()).find((t) => t.title.toLowerCase() === lower) || null;
}

/** Everything the quote form needs besides the guest's own values: the tours, the month buttons and today's date. */
async function formContext() {
  const tours = await toursService.list();
  return {
    tourOptions: tours.map((t) => ({ slug: t.slug, title: t.title, days: t.days })).sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true })),
    monthOptions: monthOptions(),
    today: new Date().toISOString().slice(0, 10),
  };
}

module.exports = { formContext, resolveTour, monthOptions };
