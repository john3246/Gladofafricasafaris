const { LANGS, href } = require('./index');
const { transform } = require('./transform');
const pageMeta = require('./pageMeta');
const store = require('./store');

const SKIP = /^\/(?:admin|uploads|images|img|css|js|icons|video|vendor|robots\.txt|sitemap\.xml|llms|healthz|t\/|\.well-known)|^\/(?:es|it|fr|de|zh)(?:\/|$)|^\/\//;

/**
 * Language by address: /it/..., /fr/... and /de/... are the same pages in another language. The prefix is removed before routing
 * (so every route works unchanged), the page is translated on its way out, and redirects stay inside the language.
 * Every sentence that has no translation yet is remembered, so the CMS (and the translator) know what is missing.
 */
module.exports = (req, res, next) => {
  const m = req.url.match(/^\/(es|it|fr|de|zh)(?=\/|\?|$)/);
  req.lang = m ? m[1] : 'en';
  if (m) req.url = req.url.slice(3) || '/';
  if (req.url[0] !== '/') req.url = `/${req.url}`;
  const search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.locals.lang = req.lang;
  res.locals.langLinks = LANGS.map((l) => ({ ...l, href: href(l.code, req.path) + search, current: l.code === req.lang }));
  if (req.lang === 'en') return next();

  const redirect = res.redirect.bind(res);
  res.redirect = (a, b) => {
    const [status, url] = typeof a === 'number' ? [a, b] : [302, a];
    return redirect(status, typeof url === 'string' && url[0] === '/' && !SKIP.test(url) ? href(req.lang, url) : url);
  };

  const send = res.send;
  res.send = function localized(body) {
    if (typeof body === 'string' && (!res.get('Content-Type') || /html/.test(String(res.get('Content-Type')))) && body.includes('<html')) {
      const path = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;
      const ctx = { path, meta: (pageMeta[req.lang] || {})[path], onMiss: store.noteMiss, native: Boolean(res.locals.i18nNative) };
      body = transform(body, req.lang, ctx);
      if (res.statusCode === 200) store.setStatus(req.lang, path, ctx.share || 0, Boolean(ctx.complete));
      this.set('X-I18n-Coverage', String(Math.round((ctx.share || 0) * 100)));
    }
    return send.call(this, body);
  };
  return next();
};
