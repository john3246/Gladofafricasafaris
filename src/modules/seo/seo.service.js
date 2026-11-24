const { env } = require('../../config');
const toursService = require('../tours/tours.service');
const destinationsService = require('../destinations/destinations.service');
const blogService = require('../blog/blog.service');
const categoriesService = require('../tours/categories.service');
const { pages, accommodations } = require('../../store/collections');
const { isoDate } = require('../../utils/format');

const BUILT_IN = new Set(['home', 'about', 'terms', 'privacy']);
const STATIC = [
  { loc: '/', priority: 1.0 },
  { loc: '/tanzania-safaris', priority: 0.9 },
  { loc: '/destinations', priority: 0.8 },
  { loc: '/blog', priority: 0.7 },
  { loc: '/about-us', priority: 0.5 },
  { loc: '/faqs', priority: 0.6 },
  { loc: '/contact-us', priority: 0.6 },
  { loc: '/get-a-quote', priority: 0.7 },
  { loc: '/reviews', priority: 0.6 },
  { loc: '/accommodations', priority: 0.6 },
  { loc: '/experiences', priority: 0.7 },
  { loc: '/offers', priority: 0.8 },
  { loc: '/travel-insurance', priority: 0.6 },
];

// Last-modified day: when the record was edited; for content that has not been edited since it was loaded, the day this release started.
const BOOT_DAY = new Date().toISOString().slice(0, 10);
const day = (v) => (v ? String(v).slice(0, 10) : BOOT_DAY);

async function buildSitemapEntries() {
  const [tours, destinations, posts, cats, customPages, lodges] = await Promise.all([
    toursService.list(),
    destinationsService.list(),
    blogService.list(),
    categoriesService.list(),
    pages.list(),
    accommodations.list(),
  ]);
  return [
    ...STATIC,
    ...cats.map((c) => ({ loc: `/tanzania-safaris/${c.slug}`, priority: 0.8 })),
    ...customPages.filter((p) => !p.draft && !p.noindex && !BUILT_IN.has(p.slug)).map((p) => ({ loc: `/${p.slug}`, priority: 0.5 })),
    ...lodges.filter((a) => a.draft !== true).map((a) => ({ loc: `/accommodations/${a.slug}`, priority: 0.5, images: [a.image] })),
    ...tours.map((t) => ({ loc: `/tours/${t.slug}`, priority: 0.8, lastmod: day(t.updatedAt), changefreq: 'weekly', images: [t.image, ...(t.gallery || [])] })),
    ...destinations.map((d) => ({ loc: `/destinations/${d.slug}`, priority: 0.8, lastmod: day(d.updatedAt), images: [d.image] })),
    ...posts.filter((p) => p.noindex !== true).map((p) => ({ loc: `/blog/${p.slug}`, priority: 0.6, lastmod: p.updatedAt ? day(p.updatedAt) : isoDate(p.published), changefreq: 'monthly', images: [p.image] })),
  ];
}

/** Image sitemap entries: help Google Images find the photos on a page. */
function images(list = []) {
  return [...new Set(list.filter(Boolean))].slice(0, 10)
    .map((src) => `<image:image><image:loc>${esc(/^https?:/.test(src) ? src : env.siteUrl + src)}</image:loc></image:image>`).join('');
}

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const i18n = require('../../i18n');
const i18nStore = require('../../i18n/store');

/** One <url> per address; fully translated pages get one per language, each listing all the others as alternates. */
function renderSitemap(entries) {
  const urls = [];
  for (const e of entries) {
    const tail = `<lastmod>${e.lastmod || BOOT_DAY}</lastmod>${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ''}<priority>${e.priority}</priority>`;
    const langs = ['it', 'fr', 'de', 'zh'].filter((c) => i18nStore.isComplete(c, e.loc));
    if (langs.length) {
      const at = (code) => `${env.siteUrl}${i18n.href(code, e.loc === '/' ? '' : e.loc)}`;
      const have = i18n.LANGS.filter((l) => l.code === 'en' || langs.includes(l.code));
      const alts = [...have.map((l) => `<xhtml:link rel="alternate" hreflang="${l.code}" href="${at(l.code)}"/>`), `<xhtml:link rel="alternate" hreflang="x-default" href="${at('en')}"/>`].join('');
      have.forEach((l) => urls.push(`  <url><loc>${at(l.code)}</loc>${alts}${tail}${l.code === 'en' ? images(e.images) : ''}</url>`));
    } else {
      urls.push(`  <url><loc>${env.siteUrl}${e.loc === '/' ? '' : e.loc}</loc>${tail}${images(e.images)}</url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>`;
}

module.exports = { buildSitemapEntries, renderSitemap };
