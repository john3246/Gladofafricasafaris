const { redirects } = require('../store/collections');
const { events } = require('../store');
const analytics = require('../services/analytics');

/** Applies CMS-managed redirects (CMS > Redirects & 404s). Rules are cached and rebuilt when edited. */
let map = null;
events.on('change', (name) => { if (name === 'redirects') map = null; });

const normalise = (p) => {
  const s = String(p || '').split('?')[0].toLowerCase();
  return s.length > 1 ? s.replace(/\/+$/, '') : s;
};

async function load() {
  if (!map) map = new Map((await redirects.list()).filter((r) => r.enabled !== false).map((r) => [normalise(r.from), r]));
  return map;
}

module.exports = async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  try {
    const rule = (await load()).get(normalise(req.path));
    if (!rule || normalise(rule.to) === normalise(req.path)) return next();
    analytics.trackRedirect(rule.id);
    const search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(Number(rule.code) === 302 ? 302 : 301, rule.to + (rule.to.includes('?') ? '' : search));
  } catch (_) {
    return next();
  }
};

module.exports.normalise = normalise;
