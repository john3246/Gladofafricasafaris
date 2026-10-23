const service = require('./destinations.service');
const toursService = require('../tours/tours.service');
const { buildMeta } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');

exports.index = async (req, res) => {
  const destinations = await service.list();
  res.locals.seo = buildMeta({
    title: 'Tanzania Destinations: Serengeti, Ngorongoro, Tarangire & More',
    description: 'Explore northern Tanzania destinations: Serengeti, Ngorongoro Crater, Tarangire, Lake Manyara, Mount Kilimanjaro and Mount Meru.',
  });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Destinations' }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs)];
  res.render('destinations/views/index', { destinations });
};

exports.show = async (req, res, next) => {
  const destination = await service.bySlug(req.params.slug);
  if (!destination) return next();
  const [tours, all] = await Promise.all([toursService.forDestination(destination.slug), service.list()]);
  res.locals.seo = buildMeta({ title: destination.metaTitle, description: destination.metaDescription, image: destination.image });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Destinations', href: '/destinations' }, { name: destination.name }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs)];
  res.render('destinations/views/show', {
    destination,
    tours,
    others: all.filter((d) => d.slug !== destination.slug).slice(0, 3),
  });
};
