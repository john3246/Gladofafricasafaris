/** Questions shown on the Offers page. They are FAQs in the CMS (group "Offers"); this is the first set. */
const FAQS = [
  { q: 'What are your Tanzania safari offers?', a: 'They are the safaris our team recommends for a particular season or kind of tour, such as the calving season in the southern Serengeti or a safari followed by beach days in Zanzibar. Prices are shown per person, and a lower price is shown only when there is a real saving.' },
  { q: 'When is the best time for a calving season safari?', a: 'Births usually peak in February, starting in late January and continuing into March. The camps around Ndutu are small and fill up early, so book ahead for your dates.' },
  { q: 'Can I change an offer to fit my dates?', a: 'Yes. Every itinerary can be tailored to your dates, group size and budget. Send a request and we reply with a clear price.' },
  { q: 'Is travel insurance included?', a: 'No. Travel insurance with medical cover and evacuation is mandatory for every guest and is arranged by you. Read our travel insurance requirements for what it must cover.' },
];

module.exports = FAQS.map((f, i) => ({ slug: `faq-offers-${i + 1}`, group: 'Offers', q: f.q, a: f.a, sort: 300 + i }));
