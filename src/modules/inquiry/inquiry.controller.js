const { validateInquiry } = require('./inquiry.validator');
const repo = require('./inquiry.repository');
const { formContext, resolveTour } = require('./inquiry.form');
const { notifyNewInquiry } = require('../../services/mailer');
const toursService = require('../tours/tours.service');
const { buildMeta } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');
const orgSchema = require('../../seo/schema/organization');
const logger = require('../../utils/logger');

/** Old "style" values kept for the CMS list and CSV: derived from what the guest ticked. */
const legacyTier = (styles) => {
  const s = styles.join(' ').toLowerCase();
  return /luxury|fly-in/.test(s) ? 'luxury' : /budget|camping/.test(s) ? 'budget' : /midrange|lodge/.test(s) ? 'midrange' : 'not-sure';
};

async function renderForm(res, { status = 200, values = {}, errors = {}, tour = null, title, description, crumbs }) {
  res.locals.seo = buildMeta({ title, description, noindex: Boolean(tour) || status !== 200 });
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), orgSchema()];
  res.status(status).render('inquiry/views/contact', { ...(await formContext()), errors, values, tour });
}

const QUOTE = { title: 'Get a Free Tanzania Safari Quote', description: 'Tell us your dates, group size and budget and get a free tailor-made Tanzania safari quote from our Arusha team on WhatsApp, phone or email.', crumbs: [{ name: 'Home', href: '/' }, { name: 'Get a quote' }] };
const CONTACT = { title: 'Contact Glad Of Africa Safari & Tours, Arusha', description: 'Contact our Arusha office at 402 Sakina by phone, WhatsApp or email, or send a message to plan your Tanzania safari or Kilimanjaro climb with local experts.', crumbs: [{ name: 'Home', href: '/' }, { name: 'Contact' }] };

/** /get-a-quote and /contact-us. `?tour=<slug>` (or an older title link) preselects a tour. */
exports.contact = async (req, res) => {
  const tour = await resolveTour(req.query.tour);
  const contact = req.path === '/contact-us';
  res.locals.contactPage = contact;
  await renderForm(res, { ...(contact ? CONTACT : QUOTE), values: { tourSlug: tour ? tour.slug : '' }, tour });
};

/** /book/<tour-slug>: the same form with that tour already chosen. */
exports.book = async (req, res, next) => {
  const tour = await toursService.bySlug(req.params.slug);
  if (!tour) return next();
  await renderForm(res, {
    title: `Book ${tour.title}`, description: `Request a quote for ${tour.title}.`, values: { tourSlug: tour.slug }, tour,
    crumbs: [{ name: 'Home', href: '/' }, { name: 'Safaris', href: '/tanzania-safaris' }, { name: tour.title, href: `/tours/${tour.slug}` }, { name: 'Book' }],
  });
};

exports.submit = async (req, res) => {
  const { data, errors } = validateInquiry(req.body);
  if (errors) {
    const tour = await resolveTour(req.body.tourSlug || req.body.tour);
    const styles = [].concat(req.body.styles || []);
    return renderForm(res, { ...QUOTE, status: 422, values: { ...req.body, styles, tourSlug: tour ? tour.slug : '' }, errors, tour });
  }
  const tour = await resolveTour(data.tourSlug || data.tour);
  // where the guest comes from (country of the connection, page language, referring site): shown in CMS > Analytics. No IP address is kept.
  const country = require('../../services/geo').lookup(req.ip).country || '';
  let referrer = '';
  try { referrer = new URL(req.get('referer') || '').hostname.replace(/^www./, ''); } catch (_) { /* no referrer */ }
  const record = { ...data, tourSlug: tour ? tour.slug : '', tour: tour ? tour.title : data.tour, tier: legacyTier(data.styles), country, lang: req.lang || 'en', referrer: referrer === req.hostname.replace(/^www./, '') ? '' : referrer };
  if (record.startDate && !record.travelMonth) {
    record.travelMonth = new Date(`${record.startDate}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  if (!data.website) {
    const saved = await repo.save(record);
    notifyNewInquiry(saved).catch((e) => logger.warn(e.message)); // never block the visitor on e-mail
  }
  res.locals.seo = buildMeta({ title: 'Thank You', description: 'We received your safari request.', noindex: true });
  res.render('inquiry/views/thanks', { name: data.name, summary: { tour: record.tour, startDate: record.startDate, endDate: record.endDate, travelMonth: record.travelMonth, travellers: record.travellers } });
};
