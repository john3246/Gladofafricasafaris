const { abs } = require('../meta');

/** @param {{name:string, href?:string}[]} items - last item may omit href */
module.exports = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    ...(it.href ? { item: abs(it.href) } : {}),
  })),
});
