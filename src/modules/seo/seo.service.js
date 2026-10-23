const { env } = require('../../config');
const toursService = require('../tours/tours.service');
const destinationsService = require('../destinations/destinations.service');
const blogService = require('../blog/blog.service');
const { categoryList } = require('../tours/tours.categories');
const { isoDate } = require('../../utils/format');

const STATIC = [
  { loc: '/', priority: 1.0 },
  { loc: '/tanzania-safaris', priority: 0.9 },
  { loc: '/destinations', priority: 0.8 },
  { loc: '/blog', priority: 0.7 },
  { loc: '/about-us', priority: 0.5 },
  { loc: '/faqs', priority: 0.6 },
  { loc: '/contact-us', priority: 0.6 },
];

async function buildSitemapEntries() {
  const [tours, destinations, posts] = await Promise.all([
    toursService.list(),
    destinationsService.list(),
    blogService.list(),
  ]);
  return [
    ...STATIC,
    ...categoryList().map((c) => ({ loc: `/tanzania-safaris/${c.slug}`, priority: 0.8 })),
    ...tours.map((t) => ({ loc: `/tours/${t.slug}`, priority: 0.8 })),
    ...destinations.map((d) => ({ loc: `/destinations/${d.slug}`, priority: 0.8 })),
    ...posts.map((p) => ({ loc: `/blog/${p.slug}`, priority: 0.6, lastmod: isoDate(p.published) })),
  ];
}

function renderSitemap(entries) {
  const urls = entries
    .map(
      (e) =>
        `  <url><loc>${env.siteUrl}${e.loc === '/' ? '' : e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}<priority>${e.priority}</priority></url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

module.exports = { buildSitemapEntries, renderSitemap };
