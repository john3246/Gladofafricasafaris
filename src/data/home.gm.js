/**
 * A short, clean home page: hero, why choose us, four best-selling safaris, a few climbs, six destinations, three guides,
 * reviews and questions. Everything else lives one click away (all safaris, destinations, blog). Editable in CMS > Pages > Home.
 */
const b = (type, o = {}) => ({ type, ...o });

module.exports = [
  b('hero', { useSiteHero: true, buttons: ['Start Planning | /get-a-quote', 'View Migration Safaris | /tanzania-safaris/migration', 'Climb Kilimanjaro | /tanzania-safaris/trekking'] }),
  require('./offers.block'),
  b('finder', { theme: 'sand' }),
  b('tours', require('./bestsellers.block')), // the four best sellers chosen in CMS > Best-selling safaris
  require('./whyus.block'),
  b('tours', {
    theme: 'forest', layout: 'grid', eyebrow: 'Hiking & trekking', heading: 'Climb <em>Kilimanjaro</em>',
    intro: 'Fully supported climbs on the Marangu, Machame and Lemosho routes with experienced mountain guides.',
    tourSlugs: ['6-day-mount-kilimanjaro-machame-route', '6-day-mount-kilimanjaro-marangu-route', '8-day-mount-kilimanjaro-lemosho-route-trek'],
    buttons: ['All climbs and treks | /tanzania-safaris/trekking'],
  }),
  b('destinations', {
    theme: 'white', eyebrow: 'Where to go', heading: 'Tanzania <em>destinations</em>', count: 6,
    intro: 'The parks, the crater, the mountains and the islands.', buttons: ['All destinations | /destinations'],
  }),
  b('blog', { theme: 'stone', eyebrow: 'Travel guides', heading: 'Tanzania <em>travel guides</em>', count: 3, intro: 'Costs, the best time to go, the Great Migration calendar and what to pack.', buttons: ['All travel guides | /blog'] }),
  b('reviews', { count: 3, buttons: ['Read all reviews | /reviews'] }),
  b('faq', { theme: 'sand', eyebrow: 'FAQ', heading: 'Frequently asked <em>questions</em>', count: 5, buttons: ['All FAQs | /faqs'] }),
  b('cta'),
];
