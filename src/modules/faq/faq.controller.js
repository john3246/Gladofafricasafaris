const service = require('./faq.service');
const { buildMeta } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');
const faqSchema = require('../../seo/schema/faq');

exports.index = async (req, res) => {
  const faqs = await service.list();
  res.locals.seo = buildMeta({
    title: 'Tanzania Safari FAQs: Cost, Best Time, Visas & Booking',
    description: 'Answers to the most common questions about Tanzania safaris: cost, best time to go, northern circuit, budget options, visas and insurance.',
  });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'FAQs' }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), faqSchema(faqs)];
  res.render('faq/views/index', { faqs });
};
