const { pages } = require('../../store/collections');
const reviewsService = require('../reviews/reviews.service');
const { buildMeta } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');
const faqSchema = require('../../seo/schema/faq');
const orgSchema = require('../../seo/schema/organization');
const blocksService = require('../blocks/blocks.service');
const { stripTags } = require('../admin/lib/text');

const NAMES = { about: 'About Us', terms: 'Terms & Conditions', privacy: 'Privacy Policy' };

/** Renders an editable page (CMS > Pages & Website Content). About keeps its photo layout. */
exports.show = (key) => async (req, res, next) => {
  const page = await pages.get(key);
  if (!page || page.draft) return next();
  res.locals.seo = buildMeta({ title: page.metaTitle || NAMES[key], description: page.metaDescription || '', noindex: page.noindex });
  const crumbs = [{ name: 'Home', href: '/' }, { name: NAMES[key] }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), ...(key === 'about' ? [orgSchema()] : [])];
  const reviews = key === 'about' ? await reviewsService.list() : [];
  res.render(key === 'about' ? 'pages/views/about' : 'pages/views/page', { page, reviews, blocks: await blocksService.resolve(page.blocks), facts: key === 'about' ? await require('../showcase/quickFacts').rows() : [] });
};

/** Pages created in the CMS are served at /<slug> (registered last so built-in routes always win). */
exports.custom = async (req, res, next) => {
  const page = await pages.get(req.params.slug);
  if (!page || page.draft || ['home', 'about', 'terms', 'privacy'].includes(page.slug)) return next();
  const title = stripTags(page.title);
  res.locals.seo = buildMeta({ title: page.metaTitle || title, description: page.metaDescription || page.subtitle || '', image: page.ogImage, noindex: page.noindex });
  const crumbs = [{ name: 'Home', href: '/' }, { name: title }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs)];
  const blocks = await blocksService.resolve(page.blocks);
  const faqs = blocks.filter((b) => b.type === 'faq').flatMap((b) => (b.data && b.data.faqs) || []);
  if (faqs.length) res.locals.schemas.push(faqSchema(faqs)); // FAQ rich results for pages that carry an FAQ section
  // A page that opens with its own hero banner does not need the standard title banner on top.
  const showTitle = !page.hideTitle && !(blocks[0] && blocks[0].type === 'hero');
  res.render('pages/views/builder', { page, blocks, showTitle });
};

