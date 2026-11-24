const reviewsService = require('../reviews/reviews.service');
const accommodations = require('./accommodations');
const offers = require('./offers');
const faqSchema = require('../../seo/schema/faq');
const experiences = require('./experiences');
const { buildMeta } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');
const orgSchema = require('../../seo/schema/organization');
const itemList = require('../../seo/schema/itemlist');

function head(res, { title, description, crumb }) {
  const crumbs = [{ name: 'Home', href: '/' }, { name: crumb }];
  res.locals.seo = buildMeta({ title, description });
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), orgSchema()];
}

/** /reviews: every published guest review. */
exports.reviews = async (req, res) => {
  const reviews = await reviewsService.list();
  head(res, { title: 'Guest Reviews: Tanzania Safari & Kilimanjaro Tours | Glad Of Africa', description: 'Read what travellers say about their Tanzania safaris and Kilimanjaro climbs with Glad Of Africa: guides, itineraries, camps and service.', crumb: 'Reviews' });
  res.render('showcase/views/reviews', { reviews });
};

/** /accommodations: the lodges, camps and hotels used on the safaris. */
exports.accommodations = async (req, res) => {
  const { items, regions } = await accommodations.page();
  head(res, { title: 'Where You Stay: Safari Lodges, Camps & Hotels in Tanzania | Glad Of Africa', description: 'The lodges, tented camps, hotels and Kilimanjaro huts used on our Tanzania safaris and climbs, and the itineraries each one appears in.', crumb: 'Accommodations' });
  res.locals.schemas.push(itemList(items.slice(0, 50).map((a) => ({ name: a.name, href: `/accommodations/${a.slug}` }))));
  res.render('showcase/views/accommodations', { items, regions });
};

/** /accommodations/<slug>: one lodge, camp or hotel. */
exports.accommodation = async (req, res, next) => {
  const found = await accommodations.bySlug(req.params.slug);
  if (!found) return next();
  const { item, near } = found;
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Accommodations', href: '/accommodations' }, { name: item.name }];
  res.locals.seo = buildMeta({ title: `${item.name}, ${item.region}: Safari Accommodation`, description: item.description, image: item.hasOwnPhoto ? item.image : undefined, extras: [`Safari accommodation in ${item.region}, Tanzania.`, 'See facts and the safaris that stay here.', 'Ask us to include it in your safari.'] });
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), { '@context': 'https://schema.org', '@type': 'LodgingBusiness', name: item.name, description: item.description, address: { '@type': 'PostalAddress', addressRegion: item.region, addressCountry: 'TZ' } }];
  res.render('showcase/views/accommodation', { item, near });
};

/** /offers: calving season and holiday packages. */
exports.offers = async (req, res) => {
  const list = await offers.groups();
  const faqs = await offers.questions();
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Offers' }];
  res.locals.seo = buildMeta({ title: 'Tanzania Safari Offers: Calving Season & Holidays', description: 'Calving season safaris in Ndutu and safari-and-beach holiday packages with Zanzibar, from local Arusha guides. See every offer and get a free quote.', extras: ['Prices per person.'] });
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), itemList(list.flatMap((g) => g.tours).map((t) => ({ name: t.title, href: `/tours/${t.slug}` }))), faqSchema(faqs)];
  res.render('showcase/views/offers', { groups: list, faqs, facts: await require('./quickFacts').rows('offers'), finder: await require('./finder').data() });
};

/** /travel-insurance: the mandatory travel insurance policy (edited in CMS > Policy pages; other languages are translated from it). */
exports.insurance = async (req, res, next) => {
  const doc = await require('../../store/collections').policies.get('travel-insurance');
  if (!doc || doc.draft) return next();
  const L = { ...doc, meta: { title: doc.metaTitle || doc.h1, description: doc.metaDescription || doc.sub } };
  const crumbs = [{ name: req.lang === 'en' ? 'Home' : 'Home', href: '/' }, { name: L.h1 }];
  res.locals.seo = buildMeta({ title: L.meta.title, description: L.meta.description, extras: [] });
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), faqSchema(L.faqs), { '@context': 'https://schema.org', '@type': 'WebPage', name: L.h1, description: L.meta.description, inLanguage: req.lang, isPartOf: { '@id': `${require('../../config').env.siteUrl}/#website` }, publisher: { '@id': `${require('../../config').env.siteUrl}/#organization` } }];
  res.render('showcase/views/insurance', { L });
};

/** /experiences: the kinds of tour we run, each linking to the filtered safaris page. */
exports.experiences = async (req, res) => {
  const items = await experiences.list();
  head(res, { title: 'Tanzania Safari Experiences: Migration, Walking, Honeymoon & More | Glad Of Africa', description: 'Choose your kind of Tanzania safari: the Great Migration, walking safaris, honeymoons, family tours, Kilimanjaro climbs and Zanzibar beach extensions.', crumb: 'Experiences' });
  res.render('showcase/views/experiences', { items });
};
