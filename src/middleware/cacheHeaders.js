const { env } = require('../config');

/** Long-lived caching for static assets (Core Web Vitals / repeat visits). */
module.exports = (res, filePath) => {
  const long = /\.(css|js|webp|avif|jpg|jpeg|png|svg|woff2?)$/.test(filePath);
  res.setHeader('Cache-Control', long && env.isProd ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
};
