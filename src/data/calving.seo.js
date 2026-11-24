/**
 * Search-focused content for the calving season and Ndutu: a landing page, FAQs, a tour category and better
 * titles/descriptions for the calving safaris. Everything is editable in the CMS afterwards.
 */
const SLUGS = [
  '5-day-ndutu-calving-season-ngorongoro-crater-safari',
  '6-days-ndutu-safari',
  '7-day-february-calving-season-safari',
  '7-days-ndutu-calving-season-safari',
  '8-days-experience-calving-season-in-tanzania',
];

const GROUP = 'Calving season & Ndutu';

const faqs = [
  ['When is the calving season in Tanzania?', 'The peak is usually February, with births starting in late January and continuing into March. Exact timing follows the rains, so it changes a little each year.'],
  ['Where is the best place to see the wildebeest calving?', 'The Ndutu area in the southern Serengeti and the Ngorongoro Conservation Area, together with the nearby Kusini plains. The short-grass plains here hold the herds during the birthing weeks.'],
  ['How many days do I need for a calving season safari?', 'We recommend at least five days, with two or three nights around Ndutu. Six to seven days gives you time to follow the herds and add Tarangire, Lake Manyara or the Ngorongoro Crater.'],
  ['Is Ndutu crowded in February?', 'February is the busiest month, but the plains are large and a good guide finds quiet spots. For fewer vehicles, travel in late January or early March.'],
  ['What will I see during the calving season?', 'Thousands of newborn wildebeest and zebra foals, and the predators that follow them: lions, cheetahs, spotted hyenas, jackals and leopards. Hunts are part of the experience, so it is not always gentle.'],
  ['How much does a Ndutu calving safari cost?', 'Our calving season packages start from about $2,600 per person for five days. The price depends on the number of days, the accommodation and the size of your group. Ask us for a quote for your dates.'],
  ['What should I pack for Ndutu in the calving season?', 'Layers: it is cool in the mornings and warm in the day. Bring a light rain jacket, a hat, sunscreen, binoculars and a camera with a zoom lens. Ndutu is in the green season, so expect a few short showers.'],
  ['Can I combine the calving season with the Ngorongoro Crater?', 'Yes. Many itineraries spend two or three nights at Ndutu and one night on the crater rim, with a descent into the crater the next morning. See our 5-day Ndutu calving season and Ngorongoro Crater safari.'],
].map(([q, a], i) => ({ slug: `faq-calving-${i + 1}`, group: GROUP, q, a, sort: 200 + i }));

const page = {
  slug: 'ndutu-calving-season-safari',
  title: 'Ndutu calving season safari',
  subtitle: '',
  hideTitle: true,
  metaTitle: 'Ndutu Calving Season Safari 2027: Dates, Prices & Packages',
  metaDescription: 'Plan a Ndutu calving season safari in Tanzania: best months (Jan to Mar), what you will see, where to stay and 5 to 8 day packages from $2,600.',
  sort: 20,
  blocks: [
    { type: 'hero', image: '/images/tours/5-day-ndutu-calving-season-ngorongoro-crater-safari.webp', heading: 'Ndutu calving season safari', intro: 'Watch hundreds of thousands of wildebeest calves born on the southern Serengeti plains, with lions, cheetahs and hyenas close behind. Locally guided, tailor-made, from five days.', buttons: ['See calving safaris | /tanzania-safaris/calving-season', 'Get a quote | /get-a-quote'] },
    { type: 'richtext', theme: 'white', eyebrow: 'The Great Migration in birth', heading: 'What is the Ndutu <em>calving season</em>?',
      body: '<p>Every year, around one and a half million wildebeest gather on the short-grass plains around Lake Ndutu, in the southern Serengeti and the Ngorongoro Conservation Area. Within a few weeks, hundreds of thousands of calves are born. A calf can stand and run within minutes, and the sheer numbers help the herd survive.</p><p>It is one of the richest wildlife spectacles in Africa, and one of the best times of year for predators: lions, cheetahs, spotted hyenas, jackals and leopards all hunt the newborns. Read our <a href="/blog/serengeti-calving-season-guide">complete guide to the Serengeti calving season</a> for the full story.</p>' },
    { type: 'features', theme: 'sand', eyebrow: 'Why go', heading: 'Why choose a <em>calving season</em> safari', items: [
      'Newborns by the thousand | The peak is usually February, when the plains are covered with herds and calves.',
      'Big cats in action | Lions, cheetahs and hyenas follow the herds, so sightings are frequent and often dramatic.',
      'Green, photogenic plains | The short rains turn Ndutu green, with soft light and dramatic skies for photography.',
      'Fewer vehicles than the north | Ndutu is quieter than the Mara River crossing areas, especially in late January and March.',
      'Easy to combine | Add the Ngorongoro Crater, Tarangire or Lake Manyara in one safari.',
    ] },
    { type: 'tours', theme: 'white', eyebrow: 'Our packages', heading: 'Ndutu calving season <em>safaris</em>', layout: 'grid', category: 'calving-season', count: 6, buttons: ['All calving safaris | /tanzania-safaris/calving-season'] },
    { type: 'richtext', theme: 'cream', eyebrow: 'When to go', heading: 'The best <em>months</em> for calving',
      body: '<ul><li><strong>January:</strong> herds arriving and green plains, fewer vehicles, the first calves may be days away.</li><li><strong>February:</strong> the peak of the calving. Busiest and most expensive, but the best chance to see thousands of newborns.</li><li><strong>March:</strong> births slow and the herds begin to move. Calves are a few weeks old and running with their mothers, and camps are quieter.</li></ul><p>Not sure which month suits you? Read <a href="/blog/ndutu-in-january-february-or-march">Ndutu in January, February or March</a>, or tell us your dates and we will suggest the best plan.</p>' },
    { type: 'richtext', theme: 'white', eyebrow: 'Plan it well', heading: 'Where to stay and <em>how long</em>',
      body: '<p>We recommend at least five days, with two or three nights around Ndutu so your guide can follow the herds. Many itineraries add a night on the Ngorongoro Crater rim and a crater descent. See <a href="/blog/where-to-stay-ndutu-calving-season">where to stay for the Ndutu calving season</a> and <a href="/blog/ndutu-calving-safari-cost-and-itinerary">what a calving safari costs</a>.</p><p>Camps near Ndutu are small and fill up for January to March, often a year ahead. Book early for the best choice.</p>' },
    { type: 'faq', theme: 'sand', eyebrow: 'Questions', heading: 'Calving season <em>questions</em>', faqGroup: GROUP, count: 8, buttons: ['All FAQs | /faqs'] },
    { type: 'cta', theme: 'deep', heading: 'Plan your calving season safari', intro: 'Tell us your dates, group size and budget. A local safari expert replies with a tailored itinerary and a clear price.', buttons: ['Get a free quote | /get-a-quote', 'Chat on WhatsApp | https://wa.me/255695108009'] },
  ],
};

const category = {
  slug: 'calving-season', name: 'Calving Season Safaris', sort: 9, showInMenu: false, ruleType: 'tag', ruleValue: 'calving',
  h1: 'Calving season safaris in Ndutu and the southern Serengeti',
  metaTitle: 'Calving Season Safari Tanzania | Ndutu Packages | Glad Of Africa',
  metaDescription: 'Ndutu calving season safaris from 5 to 8 days: newborn wildebeest, big cats and the Ngorongoro Crater. Private tours with local guides.',
  intro: 'Time your safari to the birth of hundreds of thousands of wildebeest calves on the Ndutu plains, usually from late January to March.',
};

const tourMeta = {
  '5-day-ndutu-calving-season-ngorongoro-crater-safari': ['5-Day Ndutu Calving Safari & Ngorongoro Crater', 'A 5-day Ndutu calving season safari with a Ngorongoro Crater descent. See newborn wildebeest and big cats in the southern Serengeti. Private tour from $2,600.'],
  '6-days-ndutu-safari': ['6-Day Ndutu Safari: Calving Season Wildebeest', 'A 6-day Ndutu safari to see the wildebeest calving season in the southern Serengeti, with predators, newborn calves and the Ngorongoro Crater. Private tour from $2,950.'],
  '7-day-february-calving-season-safari': ['7-Day February Calving Season Safari in Ndutu', 'Follow the herds around Ndutu in February, the peak of the calving season, on a 7-day private safari with big cat sightings and newborn wildebeest. From $2,800.'],
  '7-days-ndutu-calving-season-safari': ['7-Day Ndutu Calving Season Safari, Serengeti', 'A 7-day Ndutu calving season safari in the southern Serengeti and Ngorongoro, built around the wildebeest birthing weeks and the predators that follow. From $2,700.'],
  '8-days-experience-calving-season-in-tanzania': ['8-Day Calving Season Safari: Ndutu & Serengeti', 'An 8-day calving season safari combining Ndutu with more of the Serengeti for extra time with the herds, big cats and photography. Private tour from $4,500.'],
};

module.exports = { SLUGS, GROUP, faqs, page, category, tourMeta };
