const path = require('path');
const express = require('express');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');

const { env } = require('./config');
const security = require('./middleware/security');
const canonicalUrl = require('./middleware/canonicalUrl');
const cacheHeaders = require('./middleware/cacheHeaders');
const locals = require('./middleware/locals');
const pageCache = require('./cache/pageCache');
const { notFound, errorHandler } = require('./middleware/errorHandler');

/** Order matters: more specific routers first; the home router handles '/'. */
const routers = [
  require('./modules/seo/seo.routes'),
  require('./modules/home/home.routes'),
  require('./modules/tours/tours.routes'),
  require('./modules/destinations/destinations.routes'),
  require('./modules/blog/blog.routes'),
  require('./modules/faq/faq.routes'),
  require('./modules/pages/pages.routes'),
  require('./modules/inquiry/inquiry.routes'),
];

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'modules')]);
  app.set('view engine', 'ejs');
  app.set('layout', 'layouts/main');
  app.use(expressLayouts);

  app.get('/healthz', (req, res) => res.type('text/plain').send('ok')); // Render health check (no redirects/cache)

  app.use(security);
  app.use(compression());
  app.use(express.static(path.join(__dirname, '..', 'public'), { setHeaders: cacheHeaders }));
  app.use(express.urlencoded({ extended: false, limit: '20kb' }));
  app.use(canonicalUrl);
  app.use(locals);
  app.use(pageCache());

  routers.forEach((r) => app.use(r));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp, env };
