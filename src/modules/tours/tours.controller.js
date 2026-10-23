const service = require('./tours.service');
const faqService = require('../faq/faq.service');
const destinationsService = require('../destinations/destinations.service');
const { categoryList } = require('./tours.categories');
const reviews = require('../../data/reviews.data');
const { buildMeta } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');
const tripSchema = require('../../seo/schema/trip');

async function renderBoard(res, { tours, heading, intro, active, crumbs }) {
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs)];
  const faqs = await faqService.top(6);
  res.render('tours/views/list', { tours, heading, intro, active, categories: categoryList(), faqs, reviews });
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
    intro: `${tours.length} priced safari packages across the Northern Circuit, joining group safaris, treks and day trips, published per person.`,
    active: '',
    crumbs: [{ name: 'Home', href: '/' }, { name: 'Tanzania safari tours' }],
  });
};

exports.category = async (req, res, next) => {
  const data = await service.byCategory(req.params.category);
  if (!data) return next();
  const { category, tours } = data;
  res.locals.seo = buildMeta({ title: category.metaTitle, description: category.metaDescription });
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
  res.locals.seo = buildMeta({ title: tour.metaTitle, description: tour.metaDescription, image: tour.image });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Safaris', href: '/tanzania-safaris' }, { name: tour.title }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), tripSchema(tour)];
  res.render('tours/views/show', { tour, related, destinations: destinations.filter(Boolean) });
};
