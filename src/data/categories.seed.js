/**
 * Tour categories (CMS > Tour Categories). Each is a public landing page /tanzania-safaris/<slug>.
 * A category picks its tours by a rule: tours of a level, tours carrying a tag, or tours whose title contains text.
 */
const cat = (sort, slug, name, rule, o) => ({ slug, name, sort, showInMenu: true, ...rule, ...o });

module.exports = [
  { slug: 'offers', name: 'Special offers', sort: -2, showInMenu: false, hidden: true, system: true, ruleType: 'offer', ruleValue: '', h1: 'Tanzania safari offers: calving season and holiday packages', metaTitle: 'Tanzania Safari Offers: Calving Season & Holidays', metaDescription: 'Calving season safaris and safari-and-beach holiday packages with local guides. See every current offer and ask for a free quote.', intro: 'Calving season safaris and safari-and-beach holidays, picked by our team.' },
  { ...require('./calving.seo').category, showInMenu: false },
  cat(-1, 'best-selling', 'Best-selling Safaris', { ruleType: 'bestseller', ruleValue: '', system: true }, {
    h1: 'Our best-selling Tanzania safaris',
    metaTitle: 'Best-Selling Tanzania Safaris | Most Booked Itineraries | Glad Of Africa',
    metaDescription: 'The Tanzania safaris our guests book most: Serengeti, Great Migration, Ngorongoro Crater and Kilimanjaro itineraries, with clear prices and expert local guides.',
    intro: 'The journeys our guests love and book most, from classic Serengeti game drives to Great Migration and Kilimanjaro. Every itinerary can be tailored to your dates and budget.',
  }),
  cat(0, 'luxury', 'Exclusive Fly-In Safaris', { ruleType: 'level', ruleValue: 'luxury' }, {
    h1: 'Luxury & exclusive fly-in safaris in Tanzania',
    metaTitle: 'Luxury Fly-In Safari Tanzania | Serengeti Camps | Glad Of Africa',
    metaDescription: 'Tailor-made luxury and fly-in Tanzania safaris: boutique camps, bush flights and expert guides in the Serengeti and Ngorongoro Crater.',
    intro: 'Skip the long drives. Scheduled bush flights land you beside boutique camps in the Serengeti so more of your time is spent on game drives.',
  }),
  cat(1, 'group', 'Joining Group Safaris', { ruleType: 'tag', ruleValue: 'group', showFacts: true }, {
    h1: 'Joining group safaris',
    metaTitle: 'Joining Group Safaris Tanzania | Shared Tours | Glad Of Africa',
    metaDescription: 'Join a small-group safari in Tanzania: Big Five, Great Migration and Serengeti departures shared with other travellers at a lower price.',
    intro: 'Share the vehicle and the cost. Small groups, fixed departures and the same expert guides as our private safaris.',
  }),
  cat(2, 'migration', 'Migration Safaris', { ruleType: 'tag', ruleValue: 'migration' }, {
    h1: 'Great Migration safaris in Tanzania',
    metaTitle: 'Great Migration Safari Tanzania | Mara River & Calving | Glad Of Africa',
    metaDescription: 'Great Migration safaris in the Serengeti: Mara River crossings (Jul-Oct) and Ndutu calving season (Jan-Mar). Group and private options.',
    intro: 'Time your safari to the herds. Choose northern Serengeti Mara River crossings or southern Ndutu calving season while our guides track the wildebeest daily.',
  }),
  cat(3, 'midrange', 'Midrange Safaris', { ruleType: 'level', ruleValue: 'midrange', excludeTag: 'trekking' }, {
    menuLabel: 'Midrange Lodge Safaris',
    h1: 'Midrange lodge & tented camp safaris',
    metaTitle: 'Midrange Safari Tanzania | Lodge & Camp Tours | Glad Of Africa',
    metaDescription: 'Comfortable midrange Tanzania safaris with lodges, private 4x4 and expert guides across the northern circuit. Real prices, free quote.',
    intro: 'The sweet spot of comfort and value: quality lodges and tented camps, a private 4x4 with a local guide and an itinerary shaped around you.',
  }),
  cat(4, 'budget', 'Budget Safaris', { ruleType: 'tag', ruleValue: 'budget' }, {
    h1: 'Budget safaris in Tanzania',
    metaTitle: 'Budget Safari Tanzania | Group & Camping Tours | Glad Of Africa',
    metaDescription: 'Affordable Tanzania safaris to the Serengeti and Ngorongoro. Joining groups, camping and short tours with expert local guides.',
    intro: 'See the same Serengeti wildlife for less. Joining-group and short safaris keep costs low without cutting corners on guides, vehicles or safety.',
  }),
  cat(5, 'trekking', 'Hiking & Trekking', { ruleType: 'tag', ruleValue: 'trekking' }, {
    h1: 'Kilimanjaro, Meru & Ol Donyo Lengai treks',
    metaTitle: 'Kilimanjaro Climbing Tours & Mount Meru Treks | Glad Of Africa',
    metaDescription: 'Climb Kilimanjaro, Mount Meru or Ol Donyo Lengai with experienced local guides, and add a safari to the safari.',
    intro: "Summit Africa's highest peak with a locally owned team, or wind through the Crater Highlands. Every trek can be paired with a safari.",
  }),
  cat(6, 'day-trips', 'Day Excursions', { ruleType: 'tag', ruleValue: 'day-trips', showFacts: true }, {
    h1: 'Day excursions from Arusha',
    metaTitle: 'Day Excursions from Arusha | Tarangire & Manyara | Glad Of Africa',
    metaDescription: 'Full-day excursions from Arusha to Tarangire, Lake Manyara, Ngorongoro Crater and Kilimanjaro National Park with guide, lunch and park fees.',
    intro: 'Short on time? Join a day excursion from Arusha and see elephants, baobabs and more in a single day.',
  }),
  cat(7, 'signature', 'Signature Journeys', { ruleType: 'tag', ruleValue: 'signature' }, {
    showInMenu: false,
    h1: 'Signature Tanzania safaris',
    metaTitle: 'Signature Tanzania Safaris | Glad Of Africa',
    metaDescription: 'Our most-loved Tanzania itineraries, crafted for unforgettable moments.',
    intro: 'Exceptional itineraries, handpicked by our team.',
  }),
  cat(8, 'zanzibar', 'Zanzibar Beach Holidays', { ruleType: 'text', ruleValue: 'zanzibar' }, {
    showInMenu: false,
    h1: 'Zanzibar beach holidays',
    metaTitle: 'Zanzibar Beach Holidays & Safari Extensions | Glad Of Africa',
    metaDescription: 'End your safari on the Indian Ocean: Zanzibar beach holidays and safari-and-beach combinations.',
    intro: 'Spice farms, Stone Town and quiet beaches on Zanzibar.',
  }),
];
