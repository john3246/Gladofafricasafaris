const service = require('./destinations.service');
const toursService = require('../tours/tours.service');
const { buildMeta } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');
const destinationSchema = require('../../seo/schema/destination');
const faqSchema = require('../../seo/schema/faq');
const facts = require('./facts');
const accommodationsService = require('../showcase/accommodations');
const { regions } = require('../../store/collections');
const extras = require('../../services/extras.service');

exports.index = async (req, res) => {
  const destinations = await service.list();
  res.locals.seo = buildMeta({
    title: 'Tanzania Destinations: Serengeti, Ngorongoro, Tarangire & More',
    description: 'Explore northern Tanzania destinations: Serengeti, Ngorongoro Crater, Tarangire, Lake Manyara, Mount Kilimanjaro and Mount Meru.',
  });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Destinations' }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs)];
  const live = (await regions.list()).filter((r) => r.draft !== true).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  // Destinations whose region was removed still show, under an "Other destinations" heading.
  const known = new Set(live.map((r) => r.slug));
  const orphans = destinations.filter((d) => !known.has(d.circuit));
  if (orphans.length) live.push({ slug: 'other', title: 'Other destinations', text: '' });
  res.render('destinations/views/index', { destinations: destinations.map((d) => (known.has(d.circuit) ? d : { ...d, circuit: 'other' })), regions: live });
};

exports.show = async (req, res, next) => {
  const destination = await service.bySlug(req.params.slug);
  if (!destination) return next();
  const [tours, all] = await Promise.all([toursService.forDestination(destination.slug), service.list()]);
  res.locals.seo = buildMeta({ title: destination.metaTitle, description: destination.metaDescription && destination.metaDescription.length > 60 ? destination.metaDescription : `${destination.tagline || ''} ${(destination.intro || [])[0] || ''}`, image: destination.image, extras: ['Best time to visit, wildlife and safaris.'] });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Destinations', href: '/destinations' }, { name: destination.name }];
  res.locals.breadcrumbs = crumbs;
  const faqs = facts.faqs(destination, tours);
  const region = facts.regionOf(destination);
  const lodges = region ? (await accommodationsService.page()).items.filter((a) => a.region === region).slice(0, 6) : [];
  res.locals.schemas = [breadcrumb(crumbs), destinationSchema(destination), faqSchema(faqs)];
  res.render('destinations/views/show', {
    summary: require('../../seo/summary').destination(destination, tours),
    factRows: facts.table(destination), faqs, lodges,
    destination,
    extras: await extras.visible('destinations', destination),
    tours,
    others: all.filter((d) => d.slug !== destination.slug).slice(0, 3),
  });
};
