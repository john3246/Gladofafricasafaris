const { site, env } = require('../config');
const { truncate } = require('../utils/format');

const abs = (p) => (/^https?:/.test(p) ? p : `${env.siteUrl}${p}`);

/** Normalises per-page SEO data for the <head> partial. Appends the brand unless the title already has it. */
function buildMeta({ title, description, image, type = 'website', noindex = false, published, modified }) {
  return {
    title: title.includes(site.shortName) ? title : `${title} | ${site.shortName}`,
    description: truncate(description, 158),
    image: abs(image || site.defaultOgImage),
    type,
    noindex,
    published,
    modified,
  };
}

module.exports = { buildMeta, abs };
