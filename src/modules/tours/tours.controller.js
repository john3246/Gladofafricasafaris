const service = require('./tours.service');
const faqService = require('../faq/faq.service');
const destinationsService = require('../destinations/destinations.service');
const categoriesService = require('./categories.service');
const reviewsService = require('../reviews/reviews.service');
const { buildMeta } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');
const itemList = require('../../seo/schema/itemlist');
const tripSchema = require('../../seo/schema/trip');
const extras = require('../../services/extras.service');
const styleLib = require('./styles');
const dayDetails = require('./dayDetails');
const tourFaqs = require('./faqs');
const faqSchema = require('../../seo/schema/faq');
const trustService = require('../../services/trust');
const { accommodations } = require('../../store/collections');
const { getSettings } = require('../../services/settings.service');

async function renderBoard(res, { tours, heading, intro, active, crumbs }) {
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), itemList(tours.map((t) => ({ name: t.title, href: `/tours/${t.slug}` })))];
  const [faqs, reviews] = await Promise.all([faqService.top(6), reviewsService.list()]);
  const styleFilters = styleLib.filterOptions(tours, (await getSettings()).tripStyles);
  // the budget slider must reach the dearest safari on the page (it used to stop at $6,000 and hide anything above)
  const priceCeil = Math.max(1000, Math.ceil(Math.max(0, ...tours.map((t) => t.priceFrom || 0)) / 500) * 500);
  res.render('tours/views/list', { tours, heading, intro, active, categories: await categoriesService.list(), faqs, reviews, styleFilters, priceCeil });
}

exports.index = async (req, res) => {
  const tours = await service.list();
  res.locals.seo = buildMeta({
    title: 'Tanzania Safari Packages: Luxury, Midrange & Budget',
    description: `${tours.length} priced Tanzania safari packages: luxury fly-in, midrange lodge and budget group safaris across the Serengeti, Ngorongoro and Tarangire.`,
  });
  await renderBoard(res, {
    tours,
    heading: 'Tanzania safari tours and safari packages',
    intro: `${tours.length} priced safari packages across the Northern Circuit, joining group safaris, treks and day excursions, published per person.`,
    active: '',
    crumbs: [{ name: 'Home', href: '/' }, { name: 'Tanzania safari tours' }],
  });
};

exports.category = async (req, res, next) => {
  const data = await service.byCategory(req.params.category);
  if (!data) return next();
  const { category, tours } = data;
  res.locals.seo = buildMeta({ title: category.metaTitle, description: category.metaDescription });
  if (category.slug === 'group') res.locals.departures = await require('../showcase/departures').upcoming();
  if (category.showFacts) res.locals.quickFacts = await require('../showcase/quickFacts').rows(category.slug);
  await renderBoard(res, {
    tours,
    heading: category.h1,
    intro: category.intro,
    active: category.slug,
    crumbs: [{ name: 'Home', href: '/' }, { name: 'Safaris', href: '/tanzania-safaris' }, { name: category.name }],
  });
};

exports.show = async (req, res, next) => {
  const tour = await service.bySlug(req.params.slug);
  if (!tour) return next();
  const [related, destinations] = await Promise.all([
    service.related(tour),
    Promise.all(tour.destinations.map((s) => destinationsService.bySlug(s))),
  ]);
  res.locals.seo = buildMeta({ title: tour.metaTitle, description: tour.metaDescription, image: tour.image, extras: [tour.priceConfirmed ? `From $${Number(tour.priceFrom).toLocaleString('en-US')} per person.` : '', `${tour.days}-day Tanzania itinerary.`] });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Safaris', href: '/tanzania-safaris' }, { name: tour.title }];
  res.locals.breadcrumbs = crumbs;
  const faqs = tourFaqs(tour);
  res.locals.schemas = [breadcrumb(crumbs), tripSchema(tour), faqSchema(faqs)];
    // Each itinerary day shows its own photo; days without one borrow from the tour gallery, then the destinations.
  const pool = [...(tour.gallery || []).filter((g) => g !== tour.image), ...destinations.filter(Boolean).map((d) => d.image), tour.image].filter(Boolean);
  const dayPhotos = tour.itinerary.map((d, i) => d.image || (pool.length ? pool[i % pool.length] : ''));
  const days = dayDetails.build(tour.itinerary, dayPhotos, await accommodations.list());
  res.locals.schemas[1] = tripSchema(tour, days);
  res.render('tours/views/show', { summary: require('../../seo/summary').tour(tour, destinations.filter(Boolean)), faqs, trust: await trustService.get(), tour, related, dayPhotos, days, destinations: destinations.filter(Boolean), extras: await extras.visible('tours', tour) });
};
