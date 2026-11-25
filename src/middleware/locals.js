const { site, env } = require('../config');
const nav = require('../data/nav.data');
const navigation = require('../services/navigation.service');
const { getSettings } = require('../services/settings.service');
const { usd, longDate, route, nights } = require('../utils/format');

const i18n = require('../i18n');
const store = require('../i18n/store');

/** hreflang tags: every language of a fully translated page; English only (plus x-default) for the rest; none for unfinished translations. */
function alternatesFor(req) {
  const lang = req.lang || 'en';
  const url = (code) => `${env.siteUrl}${i18n.href(code, req.path === '/' ? '' : req.path)}`;
  const done = store.LANGS.filter((c) => store.isComplete(c, req.path));
  if (lang === 'en' || done.includes(lang)) return [{ lang: 'en', href: url('en') }, ...done.map((c) => ({ lang: c, href: url(c) })), { lang: 'x-default', href: url('en') }];
  return [];
}

/** Exposes brand config, CMS settings and helpers to every public EJS template. */
module.exports = async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.locals.siteSettings = settings;
    const dynamic = await navigation.get();
    res.locals.nav = {
      ...nav,
      tourStyles: dynamic.tourStyles,
      destinationGroups: dynamic.destinationGroups,
      topLinks: [...settings.topLinks, ...dynamic.topPages],
      footerLinks: [...settings.footerLinks, ...dynamic.footerPages],
      experiences: dynamic.experiences,
    };
    res.locals.navTours = dynamic.signature;
  } catch (err) {
    return next(err);
  }
  Object.assign(res.locals, {
    site, usd, longDate, route, nights, asset: require('../utils/assets'),
    currentPath: req.path,
    canonical: `${env.siteUrl}${require('../i18n').href(req.lang || 'en', req.path === '/' ? '' : req.path)}`,
    alternates: alternatesFor(req),
    seo: {},
    schemas: [],
    globalSchemas: [require('../seo/schema/website')(), require('../seo/schema/organization')()],
    breadcrumbs: [],
  });
  next();
};
