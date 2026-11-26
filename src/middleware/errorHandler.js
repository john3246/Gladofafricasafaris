const logger = require('../utils/logger');
const { env } = require('../config');

const analytics = require('../services/analytics');
const legacyFallback = require('./legacyFallback');

const notFound = (req, res) => {
  // old-website addresses go to the closest page instead of a dead end
  const old = (req.method === 'GET' || req.method === 'HEAD') && legacyFallback(req.path);
  if (old && old.to) return res.redirect(301, old.to);
  if (old && old.gone) return res.status(410).render('pages/error', { seo: { title: 'Page removed', description: 'This page no longer exists.', noindex: true }, code: 410, message: 'This page no longer exists.' });
  analytics.track404(req);
  res.status(404).render('pages/error', {
    seo: { title: 'Page not found', description: 'The page you are looking for does not exist.', noindex: true },
    code: 404,
    message: 'We could not find that page.',
  });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err);
  res.status(500).render('pages/error', {
    seo: { title: 'Something went wrong', description: 'Unexpected error.', noindex: true },
    code: 500,
    message: env.isProd ? 'Something went wrong on our side.' : err.message,
  });
};

module.exports = { notFound, errorHandler };
