const { getSettings } = require('../services/settings.service');
const { isPreview } = require('../utils/preview');

const EXEMPT = /^\/(admin|uploads|healthz|css|js|images|icons)(\/|$)/;

/**
 * Maintenance mode (CMS > Site Settings): visitors see a "back soon" page with a 503 status while signed-in
 * CMS users (who carry a preview cookie) still see the real site.
 */
module.exports = async (req, res, next) => {
  if (EXEMPT.test(req.path)) return next();
  try {
    const s = await getSettings();
    if (!s.maintenance || isPreview(req)) return next();
    res.set('Retry-After', '3600').status(503).render('pages/maintenance', { layout: false, siteSettings: s });
  } catch (err) {
    next(err);
  }
};
