const { env, site } = require('../../config');
const { abs } = require('../meta');

module.exports = (post) => ({
  '@context': 'https://schema.org',
  '@type': ['BlogPosting', 'Article'],
  headline: post.title,
  description: post.excerpt,
  image: abs(post.image || site.defaultOgImage),
  datePublished: post.published,
  dateModified: (post.updatedAt || post.published).slice(0, 10),
  mainEntityOfPage: `${env.siteUrl}/blog/${post.slug}`,
  articleSection: post.category,
  keywords: [post.focusKeyword, ...(post.tags || [])].filter(Boolean).join(', ') || undefined,
  wordCount: post.wordCount,
  author: post.author ? { '@type': 'Person', name: post.author, ...(post.authorTitle ? { jobTitle: post.authorTitle } : {}), worksFor: { '@id': `${env.siteUrl}/#organization` } } : { '@type': 'Organization', '@id': `${env.siteUrl}/#organization`, name: site.name },
  publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: abs(site.logo) } },
});
