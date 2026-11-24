const { env } = require('../config');

/**
 * Static file caching.
 * - CSS and JavaScript have no version in their address, so browsers must re-check them on every visit
 *   (the server answers "not modified" in a few bytes). Otherwise a release would not reach returning visitors.
 * - Images and fonts rarely change: kept for 30 days in production.
 */
module.exports = (res, filePath) => {
  // Files requested with ?v=<fingerprint> (see utils/assets) never change under that address: kept for a year.
  if (/\.(css|js|mjs)$/.test(filePath) && env.isProd && res.req && res.req.query && res.req.query.v) return res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  if (/\.(css|js|mjs)$/.test(filePath)) return res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  const media = /\.(webp|avif|jpg|jpeg|png|gif|svg|ico|woff2?|mp4|webm)$/.test(filePath);
  return res.setHeader('Cache-Control', media && env.isProd ? 'public, max-age=2592000' : 'public, max-age=3600');
};
