const c = require('../../../store/collections');
const { stripTags } = require('./text');

/** Flags SEO problems on one document (missing / too long / too short titles and descriptions). */
function check(item) {
  const issues = [];
  const t = (item.metaTitle || '').length;
  const d = (item.metaDescription || '').length;
  if (!t) issues.push('No SEO title'); else if (t > 62) issues.push('Title too long');
  if (!d) issues.push('No description'); else if (d < 70) issues.push('Description short'); else if (d > 160) issues.push('Description too long');
  return { t, d, issues };
}

const GROUPS = [
  ['Tour', c.tours, (x) => x.title, (x) => `/admin/tours/${x.slug}/edit`],
  ['Destination', c.destinations, (x) => x.name, (x) => `/admin/destinations/${x.slug}/edit`],
  ['Blog post', c.posts, (x) => x.title, (x) => `/admin/blog/${x.slug}/edit`],
  ['Page', c.pages, (x) => stripTags(x.title), (x) => `/admin/pages/${x.slug}/edit`],
];

/** One row per public page with its SEO checks. */
async function collectRows() {
  const rows = [];
  for (const [type, col, title, href] of GROUPS) {
    for (const item of await col.list()) rows.push({ type, title: title(item), href: href(item), draft: item.draft === true, ...check(item) });
  }
  return rows;
}

module.exports = { collectRows, check };
