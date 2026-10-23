const { env } = require('../../config');
const { buildSitemapEntries, renderSitemap } = require('./seo.service');

exports.sitemap = async (req, res) => {
  const entries = await buildSitemapEntries();
  res.type('application/xml').send(renderSitemap(entries));
};

exports.robots = (req, res) => {
  const body = env.isProd
    ? `User-agent: *\nAllow: /\nDisallow: /inquiry\nSitemap: ${env.siteUrl}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
  res.type('text/plain').send(body);
};
