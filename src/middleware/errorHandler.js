const logger = require('../utils/logger');
const { env } = require('../config');

const notFound = (req, res) => {
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
