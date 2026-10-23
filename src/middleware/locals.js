const { site, env } = require('../config');
const nav = require('../data/nav.data');
const toursService = require('../modules/tours/tours.service');
const { usd, longDate, route, nights } = require('../utils/format');

let navTours = { at: 0, list: [] };

/** Signature tours feed the header mega menu; refreshed every 5 minutes. */
async function getNavTours() {
  if (Date.now() - navTours.at > 300000) navTours = { at: Date.now(), list: await toursService.signature(5) };
  return navTours.list;
}

/** Exposes brand config and helpers to every EJS template. */
module.exports = async (req, res, next) => {
  try {
    res.locals.navTours = await getNavTours();
  } catch (_) {
    res.locals.navTours = [];
  }
  Object.assign(res.locals, {
    site, nav, usd, longDate, route, nights,
    currentPath: req.path,
    canonical: `${env.siteUrl}${req.path === '/' ? '' : req.path}`,
    seo: {},
    schemas: [],
    breadcrumbs: [],
  });
  next();
};
