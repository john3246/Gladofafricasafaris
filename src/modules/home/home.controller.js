const { pages } = require('../../store/collections');
const blocksService = require('../blocks/blocks.service');
const homeSeed = require('../../data/home.seed');
const { buildMeta } = require('../../seo/meta');
const orgSchema = require('../../seo/schema/organization');
const faqSchema = require('../../seo/schema/faq');

/** The home page is a list of sections edited in CMS > Pages > Home. */
exports.index = async (req, res) => {
  const page = (await pages.get('home')) || homeSeed;
  const blocks = await blocksService.resolve(page.blocks);
  res.locals.seo = buildMeta({ title: page.metaTitle || homeSeed.metaTitle, description: page.metaDescription || homeSeed.metaDescription, noindex: page.noindex });
  const faqs = (blocks.find((b) => b.type === 'faq') || { data: {} }).data.faqs || [];
  res.locals.schemas = [orgSchema(), faqSchema(faqs)];
  res.render('home/views/index', { blocks });
};
