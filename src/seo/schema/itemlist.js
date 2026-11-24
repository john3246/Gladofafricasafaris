const { env } = require('../../config');

/** ItemList of tours (or other pages) for listing pages: [{ name, href }]. */
module.exports = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  numberOfItems: items.length,
  itemListElement: items.slice(0, 50).map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: `${env.siteUrl}${it.href}`, name: it.name })),
});
