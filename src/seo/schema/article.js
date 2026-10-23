const { env, site } = require('../../config');
const { abs } = require('../meta');

module.exports = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.excerpt,
  image: abs(post.image || site.defaultOgImage),
  datePublished: post.published,
  dateModified: post.published,
  mainEntityOfPage: `${env.siteUrl}/blog/${post.slug}`,
  author: { '@type': 'Organization', name: site.name },
  publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: abs(site.logo) } },
});
