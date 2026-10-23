/**
 * Category landing pages. Each targets a distinct commercial search:
 * "luxury safari Tanzania", "budget safari Tanzania", "Great Migration safari", "Kilimanjaro climb", etc.
 * Filters use the tags assigned by the live-site importer (scripts/import/classify.js).
 */
const hasTag = (t, tag) => t.tags.includes(tag);

const categories = {
  luxury: {
    name: 'Exclusive Fly-In Safaris',
    h1: 'Luxury & exclusive fly-in safaris in Tanzania',
    filter: (t) => t.tier === 'luxury',
    metaTitle: 'Luxury Fly-In Safari Tanzania | Serengeti Camps | Glad Of Africa',
    metaDescription: 'Tailor-made luxury and fly-in Tanzania safaris: boutique camps, bush flights and expert guides in the Serengeti and Ngorongoro Crater.',
    intro: 'Skip the long drives. Scheduled bush flights land you beside boutique camps in the Serengeti so more of your time is spent on game drives.',
  },
  midrange: {
    name: 'Midrange Safaris',
    h1: 'Midrange lodge & tented camp safaris',
    filter: (t) => t.tier === 'midrange' && !hasTag(t, 'trekking'),
    metaTitle: 'Midrange Safari Tanzania | Lodge & Camp Tours | Glad Of Africa',
    metaDescription: 'Comfortable midrange Tanzania safaris with lodges, private 4x4 and expert guides across the northern circuit. Real prices, free quote.',
    intro: 'The sweet spot of comfort and value: quality lodges and tented camps, a private 4x4 with a local guide and an itinerary shaped around you.',
  },
  budget: {
    name: 'Budget Safaris',
    h1: 'Budget safaris in Tanzania',
    filter: (t) => hasTag(t, 'budget'),
    metaTitle: 'Budget Safari Tanzania | Group & Camping Tours | Glad Of Africa',
    metaDescription: 'Affordable Tanzania safaris to the Serengeti and Ngorongoro. Joining groups, camping and short trips with expert local guides.',
    intro: 'See the same Serengeti wildlife for less. Joining-group and short safaris keep costs low without cutting corners on guides, vehicles or safety.',
  },
  group: {
    name: 'Joining Group Safaris',
    h1: 'Joining group safaris',
    filter: (t) => hasTag(t, 'group'),
    metaTitle: 'Joining Group Safaris Tanzania | Shared Tours | Glad Of Africa',
    metaDescription: 'Join a small-group safari in Tanzania: Big Five, Great Migration and Serengeti departures shared with other travellers at a lower price.',
    intro: 'Share the vehicle and the cost. Small groups, fixed departures and the same expert guides as our private safaris.',
  },
  migration: {
    name: 'Migration Safaris',
    h1: 'Great Migration safaris in Tanzania',
    filter: (t) => hasTag(t, 'migration'),
    metaTitle: 'Great Migration Safari Tanzania | Mara River & Calving | Glad Of Africa',
    metaDescription: 'Great Migration safaris in the Serengeti: Mara River crossings (Jul-Oct) and Ndutu calving season (Jan-Mar). Group and private options.',
    intro: 'Time your safari to the herds. Choose northern Serengeti Mara River crossings or southern Ndutu calving season while our guides track the wildebeest daily.',
  },
  trekking: {
    name: 'Hiking & Trekking',
    h1: 'Kilimanjaro, Meru & Ol Donyo Lengai treks',
    filter: (t) => hasTag(t, 'trekking'),
    metaTitle: 'Kilimanjaro Climbing Tours & Mount Meru Treks | Glad Of Africa',
    metaDescription: 'Climb Kilimanjaro, Mount Meru or Ol Donyo Lengai with experienced local guides, and add a safari to the trip.',
    intro: 'Summit Africa\'s highest peak with a locally owned team, or wind through the Crater Highlands. Every trek can be paired with a safari.',
  },
  'day-trips': {
    name: 'Day Trip Experience',
    h1: 'Day trips from Arusha',
    filter: (t) => hasTag(t, 'day-trips'),
    metaTitle: 'Day Trips from Arusha | Tarangire & Manyara | Glad Of Africa',
    metaDescription: 'Full-day trips from Arusha to Tarangire, Lake Manyara, Ngorongoro Crater and Kilimanjaro National Park with guide, lunch and park fees.',
    intro: 'Short on time? Join a day trip from Arusha and see elephants, baobabs and more in a single day.',
  },
};

const categoryList = () => Object.entries(categories).map(([slug, c]) => ({ slug, ...c }));

module.exports = { categories, categoryList };
