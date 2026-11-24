/**
 * The "park facts" table and FAQ of each destination page. Fees change every year and differ by park, so the table says how
 * they are charged and that the current rate is in your quote; distances are approximate road distances from Arusha.
 * A destination edited in the CMS can carry its own `distance`, `parkFees` or `region` and these defaults step aside.
 */
const FEES = 'Charged per person for every 24 hours by the park authority and revised each year. The current rate is stated in your quote.';
const BY_FLIGHT = 'Reached by scheduled flight from Arusha, usually via Dar es Salaam; we arrange the transfers';

const FACTS = {
  'serengeti-national-park': { distance: 'About 335 km to Seronera (7 to 8 hours by road) or a short bush flight from Arusha', region: 'Serengeti' },
  'ngorongoro-crater': { distance: 'About 180 km (3.5 to 4 hours by road)', region: 'Ngorongoro', fees: 'Conservation-area fee per person per 24 hours, plus a vehicle fee for the crater descent. The current rates are stated in your quote.' },
  'tarangire-national-park': { distance: 'About 120 km (2 to 2.5 hours by road)', region: 'Tarangire' },
  'lake-manyara-national-park': { distance: 'About 125 km (2 to 2.5 hours by road)', region: 'Lake Manyara' },
  'arusha-national-park': { distance: 'About 30 km (under an hour by road)', region: 'Arusha' },
  'mkomazi-national-park': { distance: 'A day excursion or overnight from Arusha or Moshi, in the north-east', region: 'Arusha' },
  'kilimanjaro-national-park': { distance: 'About 2 hours by road to the main trailheads near Moshi', region: 'Kilimanjaro', fees: 'Climbers pay park, camping and rescue fees per person per day on the mountain. The current rates are stated in your quote.' },
  'mount-kilimanjaro': { distance: 'About 2 hours by road to the main trailheads near Moshi', region: 'Kilimanjaro', fees: 'Climbers pay park, camping and rescue fees per person per day on the mountain. The current rates are stated in your quote.' },
  'mount-meru': { distance: 'About 45 minutes by road to Momella gate', region: 'Arusha' },
  'mount-ol-donyo-lengai': { distance: 'Roughly a full day by road, near Lake Natron', region: 'Lake Natron' },
  'udzungwa-mountains-national-park': { distance: 'Southern Tanzania: reached by road or flight via Dar es Salaam', region: '' },
  'mikumi-national-park': { distance: 'Southern Tanzania: reached by road or flight via Dar es Salaam', region: '' },
  'nyerere-national-park': { distance: BY_FLIGHT, region: 'Selous Game Reserve' },
  'ruaha-national-park': { distance: BY_FLIGHT, region: 'Ruaha National Park' },
  'stone-town': { distance: 'Reached by flight to Zanzibar', region: '', fees: 'No park fee. Guided walking tours and entry to some historic sites are charged separately.' },
  'nungwi-beach': { distance: 'Reached by flight to Zanzibar, then about an hour by road', region: '', fees: 'No park fee. Beach resorts set their own rates.' },
  'mnemba-island': { distance: 'Reached by flight to Zanzibar, then a boat from the east coast', region: '', fees: 'A marine conservation fee is charged for snorkelling and boat tours. Current rates are stated in your quote.' },
  'chumbe-island': { distance: 'Reached by flight to Zanzibar, then a short boat tour from Stone Town', region: '', fees: 'A conservation fee applies per visitor. Current rates are stated in your quote.' },
  'chole-island': { distance: 'Reached by flight to Mafia Island, then by boat', region: '', fees: 'A marine park fee is charged per person. Current rates are stated in your quote.' },
  'mafia-island': { distance: BY_FLIGHT, region: '', fees: 'A marine park fee is charged per person. Current rates are stated in your quote.' },
};

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** Rows for the facts table. */
function table(d) {
  const f = FACTS[d.slug] || {};
  const rows = [
    ['Best time to visit', d.bestTime],
    ['Park fees', d.parkFees || f.fees || FEES],
    ['Wildlife highlights', (d.wildlife || []).slice(0, 8).join(', ')],
    ['Distance from Arusha', d.distance || f.distance],
  ].filter(([, v]) => clean(v));
  return rows;
}

/** Region of the accommodations page that belongs to this destination ('' when none). */
const regionOf = (d) => d.region || (FACTS[d.slug] || {}).region || '';

/** Questions and answers drawn from the table, shown on the page and sent as FAQ structured data. */
function faqs(d, tours = []) {
  const out = [];
  const f = FACTS[d.slug] || {};
  if (d.bestTime) out.push({ q: `When is the best time to visit ${d.name}?`, a: clean(d.bestTime) });
  const dist = d.distance || f.distance;
  if (dist) out.push({ q: `How far is ${d.name} from Arusha?`, a: `${clean(dist)}.` });
  if ((d.wildlife || []).length) out.push({ q: `What wildlife can I see in ${d.name}?`, a: `Highlights include ${d.wildlife.slice(0, 8).join(', ')}. What you see depends on the season and on the animals.` });
  out.push({ q: `How much are park fees for ${d.name}?`, a: clean(d.parkFees || f.fees || FEES) });
  if (tours.length) out.push({ q: `Which Glad Of Africa safaris include ${d.name}?`, a: `${tours.slice(0, 4).map((t) => t.title).join('; ')}${tours.length > 4 ? ` and ${tours.length - 4} more` : ''}. Every itinerary can be tailored to your dates and budget.` });
  return out;
}

module.exports = { table, regionOf, faqs };
