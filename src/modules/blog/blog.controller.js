const service = require('./blog.service');
const { buildMeta } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');
const articleSchema = require('../../seo/schema/article');

exports.index = async (req, res) => {
  const posts = await service.list();
  res.locals.seo = buildMeta({
    title: 'Tanzania Safari Blog: Travel Tips, Costs & Migration Guides',
    description: 'Expert Tanzania travel advice: safari costs, best time to visit, Great Migration calendar and northern circuit planning guides.',
  });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Blog' }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs)];
  res.render('blog/views/index', { posts });
};

exports.show = async (req, res, next) => {
  const data = await service.bySlugWithRelated(req.params.slug);
  if (!data) return next();
  const { post, tours } = data;
  res.locals.seo = buildMeta({
    title: post.metaTitle,
    description: post.metaDescription,
    image: post.image,
    type: 'article',
    published: post.published,
  });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog' }, { name: post.title }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), articleSchema(post)];
  res.render('blog/views/show', { post, tours });
};
