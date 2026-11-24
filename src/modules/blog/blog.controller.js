const service = require('./blog.service');
const { env, site } = require('../../config');
const { buildMeta, abs } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');
const articleSchema = require('../../seo/schema/article');
const extras = require('../../services/extras.service');
const content = require('./content');
const { isPreview } = require('../../utils/preview');

const xml = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

exports.index = async (req, res) => {
  const { category, tag, page } = req.query;
  const data = await service.page({ category, tag, page });
  const filtered = category || tag;
  res.locals.seo = buildMeta({
    title: filtered ? `${category || tag}: Tanzania Safari Blog | Glad Of Africa` : 'Tanzania Safari Blog: Travel Tips, Costs & Migration Guides',
    description: 'Expert Tanzania travel advice: safari costs, best time to visit, Great Migration calendar and northern circuit planning guides.',
    noindex: Boolean(filtered) || data.page > 1, // filtered and later pages duplicate the main listing
  });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Blog' }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs)];
  res.render('blog/views/index', { ...data, category: category || '', tag: tag || '' });
};

exports.show = async (req, res, next) => {
  // ?preview=1 lets signed-in CMS users read drafts and scheduled posts.
  const preview = req.query.preview === '1' && isPreview(req);
  const data = await service.bySlugWithRelated(req.params.slug, { preview });
  if (!data) return next();
  const { post, tours } = data;
  res.locals.seo = buildMeta({
    title: post.metaTitle,
    description: post.metaDescription,
    image: post.image,
    type: 'article',
    published: post.published,
    modified: (post.updatedAt || post.published).slice(0, 10),
    noindex: post.noindex || preview,
  });
  if (preview) res.set('Cache-Control', 'no-store');
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: post.title }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), articleSchema(post)];
  const html = post.content || content.fromSections(post.sections); // older posts keep their sections
  const body = post.content ? post.content : content.process(html).html;
  const toc = post.content ? post.toc || [] : content.process(html).toc;
  res.render('blog/views/show', { finder: post.finder ? await require('../showcase/finder').data() : null, post, tours, articleHtml: body, toc, preview, related: await service.relatedPosts(post), extras: await extras.visible('blog', post) });
};

/** RSS feed so readers and aggregators can follow the blog. */
exports.feed = async (req, res) => {
  const posts = (await service.list()).slice(0, 20);
  const items = posts.map((p) => `<item><title>${xml(p.title)}</title><link>${env.siteUrl}/blog/${p.slug}</link><guid>${env.siteUrl}/blog/${p.slug}</guid>` +
    `<pubDate>${new Date(p.published).toUTCString()}</pubDate><category>${xml(p.category)}</category><description>${xml(p.excerpt)}</description>` +
    `${p.image ? `<enclosure url="${xml(abs(p.image))}" type="image/webp" length="0"/>` : ''}</item>`).join('');
  res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(site.name)} blog</title>` +
    `<link>${env.siteUrl}/blog</link><description>Tanzania safari travel tips, costs and migration guides.</description><language>en</language>${items}</channel></rss>`);
};
