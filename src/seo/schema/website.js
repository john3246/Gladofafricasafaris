const { env, site } = require('../../config');

/** WebSite entity: lets Google show the site name in results and ties every page to the organisation. */
module.exports = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${env.siteUrl}/#website`,
  url: env.siteUrl,
  name: site.name,
  alternateName: site.shortName,
  inLanguage: 'en',
  publisher: { '@id': `${env.siteUrl}/#organization` },
});
