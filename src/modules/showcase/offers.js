const toursService = require('../tours/tours.service');

/** Safaris that carry a special offer label, grouped by that label (CMS > Tours > Special offer label). */
async function groups() {
  const offered = (await toursService.list()).filter((t) => String(t.offerLabel || '').trim());
  const by = new Map();
  offered.forEach((t) => by.set(t.offerLabel.trim(), [...(by.get(t.offerLabel.trim()) || []), t]));
  return [...by.entries()]
    .map(([label, tours]) => ({ label, tours: tours.sort((a, b) => a.priceFrom - b.priceFrom), note: (tours.find((t) => t.offerNote) || {}).offerNote || '' }))
    .sort((a, b) => b.tours.length - a.tours.length);
}

const { faqs } = require('../../store/collections');

/** The Offers page questions: FAQs of the group "Offers" (CMS > FAQs). */
async function questions() {
  return (await faqs.list()).filter((f) => f.group === 'Offers' && f.draft !== true).sort((x, y) => (x.sort ?? 0) - (y.sort ?? 0)).map((f) => ({ q: f.q, a: f.a }));
}

module.exports = { groups, questions };
