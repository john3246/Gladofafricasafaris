const path = require('path');
const express = require('express');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');

const { env } = require('./config');
const security = require('./middleware/security');
const canonicalUrl = require('./middleware/canonicalUrl');
const cacheHeaders = require('./middleware/cacheHeaders');
const locals = require('./middleware/locals');
const redirects = require('./middleware/redirects');
const maintenance = require('./middleware/maintenance');
const analytics = require('./services/analytics');
const pageCache = require('./cache/pageCache');
require('./cache/invalidate');
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
  require('./modules/track/track.routes'),
  require('./modules/showcase/showcase.routes'),
  require('./modules/inquiry/inquiry.routes'),
  require('./modules/subscribe/subscribe.routes'),
  require('./modules/pages/pages.custom.routes'),
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
  // CMS and uploads are mounted before the public body parser: /admin parses its own forms (nested fields, 2 MB).
  app.use('/admin', require('./modules/admin/admin.routes'));
  app.use('/uploads', require('./modules/admin/media/media.public'));

  app.use(require('./middleware/noDashes')); // outermost on the way out: runs after translation and the page cache
  app.use(require('./i18n/middleware')); // /it, /fr, /de: the same pages in Italian, French and German
  // Public forms (quote request, newsletter) have no login: refuse posts that come from another website.
  app.use(require('./middleware/sameSite'));
  app.use(express.urlencoded({ extended: false, limit: '20kb' }));
  app.use(maintenance); // 503 page while maintenance mode is on
  app.use(redirects); // CMS-managed 301/302 redirects (old WordPress URLs)
  app.use(require('./middleware/legacyRedirects')); // old WordPress / duplicate addresses -> one clean address (301)
  app.use(canonicalUrl);
  app.use(analytics.middleware); // first-party page-view counting
  app.use(require('./middleware/responsiveImages')); // small photo copies for small screens
  app.use(locals);
  app.use(pageCache());

  routers.forEach((r) => app.use(r));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp, env };
