const service = require('./home.service');
const { buildMeta } = require('../../seo/meta');
const orgSchema = require('../../seo/schema/organization');
const faqSchema = require('../../seo/schema/faq');

exports.index = async (req, res) => {
  const data = await service.getHomeData();
  res.locals.seo = buildMeta({
    title: 'Tanzania Safari Tours: Luxury, Midrange & Budget | Glad Of Africa',
    description: 'Locally owned Arusha tour operator for northern Tanzania safaris: Serengeti Great Migration, Ngorongoro Crater and Kilimanjaro. Luxury to budget. Get a free quote.',
  });
  res.locals.schemas = [orgSchema(), faqSchema(data.faqs)];
  res.render('home/views/index', data);
};
