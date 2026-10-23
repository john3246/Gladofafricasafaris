const toursService = require('../tours/tours.service');
const destinationsService = require('../destinations/destinations.service');
const blogService = require('../blog/blog.service');
const faqService = require('../faq/faq.service');
const reviews = require('../../data/reviews.data');

const BESPOKE = [
  '6-days-northern-serengeti-mara-river-crossing-tour',
  '7-days-central-serengeti-safari',
  '7-days-western-serengeti-safari',
];
const TREKS = ['6-day-mount-kilimanjaro-machame-route', '6-day-mount-kilimanjaro-marangu-route', '8-day-mount-kilimanjaro-lemosho-route-trek'];
const GROUP_FEATURED = '6-day-tanzania-big-five-big-cat-group-safari';

/** The three "Explore Tanzania by region" cards: label, copy, a representative destination for the photo. */
const REGIONS = [
  { circuit: 'northern', anchor: 'northern', title: 'Northern Circuit', photo: 'serengeti-national-park', text: 'Serengeti, Ngorongoro Crater, Tarangire and Lake Manyara: the classic Big Five and Great Migration route.' },
  { circuit: 'zanzibar', anchor: 'zanzibar', title: 'Zanzibar Beaches', photo: 'stone-town', text: 'Stone Town, Nungwi and Mnemba: powder-white sand and turquoise water after the bush.' },
  { circuit: 'southern', anchor: 'southern', title: 'Southern Circuit', photo: 'ruaha-national-park', text: 'Nyerere, Ruaha, Mikumi and Udzungwa: wild, remote and wonderfully uncrowded.' },
];

async function getRegions() {
  return Promise.all(
    REGIONS.map(async (r) => ({
      ...r,
      trips: await toursService.countForCircuit(r.circuit),
      image: (await destinationsService.bySlug(r.photo))?.image,
    }))
  );
}

/** Aggregates everything the home page sections need in parallel. */
async function getHomeData() {
  const [signature, bespoke, treks, groupTours, zanzibar, regions, posts, faqs] = await Promise.all([
    toursService.signature(5),
    toursService.bySlugs(BESPOKE),
    toursService.bySlugs(TREKS),
    toursService.bySlugs([GROUP_FEATURED]),
    toursService.zanzibar(3),
    getRegions(),
    blogService.latest(3),
    faqService.top(6),
  ]);
  return { signature, bespoke, treks, groupTour: groupTours[0], zanzibar, regions, posts, faqs, reviews };
}

module.exports = { getHomeData };
