const crypto = require('crypto');
const { pageviews, notfound, redirects } = require('../store/collections');
const logger = require('../utils/logger');

/**
 * Privacy-friendly first-party analytics: no cookies, no personal data stored. Visitors are counted from a
 * daily-salted hash of IP + browser. Counts are buffered in memory and merged into one document per day.
 */
const BOT = /bot|crawl|spider|slurp|preview|monitor|uptime|curl|wget|python|headless|lighthouse|facebookexternalhit/i;
const FLUSH_MS = 20000;
const MAX_VISITORS_PER_DAY = 20000;
const MAX_KEYS = 400; // a day never stores more than this many distinct values per list, so odd traffic cannot bloat the database
const CRAWLERS = /(googlebot|google-inspectiontool|adsbot-google|bingbot|duckduckbot|yandexbot|baiduspider|applebot|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|gptbot|claudebot|oai-searchbot|perplexitybot|facebookexternalhit|twitterbot|linkedinbot|whatsapp)/i;
const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|startpage|qwant|brave|search)\./i;
const SOCIAL = /(facebook|instagram|t\.co|twitter|x\.com|tiktok|youtube|youtu\.be|linkedin|pinterest|whatsapp|reddit|l\.messenger)/i;
const EVENTS = new Set(['whatsapp', 'phone', 'email', 'quote-start', 'brochure']);

const today = () => new Date().toISOString().slice(0, 10);
const device = (ua) => (/ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop');
const host = (ref, own) => {
  try { const h = new URL(ref).hostname.replace(/^www\./, ''); return h === own ? '' : h; } catch (_) { return ''; }
};

const LISTS = ['pages', 'refs', 'devices', 'sources', 'search', 'campaigns', 'bots', 'events', 'langs', 'hours', 'countries', 'tourCountries'];
const fresh = () => ({ date: today(), views: 0, visitors: new Set(), pages: {}, refs: {}, devices: {}, sources: {}, search: {}, campaigns: {}, bots: {}, events: {}, langs: {}, hours: {}, countries: {}, tourCountries: {} });
let buf = fresh();
let missing = {};
let hits = {};
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };

/** Express middleware: counts successful HTML page views on the public site. */
function middleware(req, res, next) {
  res.on('finish', () => {
    try {
      const ua = req.get('user-agent') || '';
      // A returning visitor's browser re-checks the page and gets "304 not modified" with no content type: that is still a page view.
      const page = (res.statusCode === 200 && (res.get('Content-Type') || '').includes('html')) || (res.statusCode === 304 && /text\/html/.test(req.get('accept') || '') && !/\.\w{2,5}$/.test(req.path));
      if (req.method !== 'GET' || !page || /prefetch|prerender/i.test(`${req.get('purpose') || ''}${req.get('sec-purpose') || ''}`)) return;
      if (req.path === '/healthz' || req.path.startsWith('/admin')) return;
      if (buf.date !== today()) flush();
      const crawler = ua.match(CRAWLERS);
      if (crawler) { bump(buf.bots, crawler[1].toLowerCase()); return; } // search-engine visits are counted apart from people
      if (BOT.test(ua)) return;
      const day = today();
      buf.views += 1;
      const vid = crypto.createHash('sha1').update(`${req.ip}|${ua}|${day}|glad`).digest('hex').slice(0, 12);
      buf.visitors.add(vid);
      noteLive(vid, req.path.length > 1 ? req.path.replace(/\/$/, '') : '/', device(ua));
      bump(buf.pages, req.path.length > 1 ? req.path.replace(/\/$/, '') : '/');
      bump(buf.devices, device(ua));
      const ref = host(req.get('referer') || '', req.hostname.replace(/^www\./, ''));
      if (ref) bump(buf.refs, ref.replace(/\./g, '·')); // dots are not allowed in some JSON keys
      const q = req.query || {};
      const utm = q.utm_source || q.utm_medium || q.utm_campaign;
      if (utm) bump(buf.campaigns, [q.utm_source, q.utm_medium, q.utm_campaign].map((v) => String(v || '-').slice(0, 40).replace(/[.$]/g, '')).join(' / '));
      bump(buf.sources, ref ? (SEARCH.test(ref) ? 'Search engines' : SOCIAL.test(ref) ? 'Social media' : 'Other websites') : utm ? 'Campaigns' : 'Direct');
      if (ref && SEARCH.test(ref)) bump(buf.search, ref.replace(/^www\./, '').split('.')[0]);
      const country = (require('./geo').lookup(req.ip).country || 'Unknown').replace(/[.$]/g, '');
      bump(buf.countries, country);
      const tour = req.path.match(/^\/tours\/([a-z0-9-]+)\/?$/);
      if (tour) bump(buf.tourCountries, `${tour[1]}|${country}`);
      const lang = (req.get('accept-language') || '').slice(0, 2).toLowerCase();
      if (/^[a-z]{2}$/.test(lang)) bump(buf.langs, lang);
      bump(buf.hours, String((new Date().getUTCHours() + 3) % 24)); // East Africa Time
    } catch (_) { /* analytics must never break a request */ }
  });
  next();
}

/** Counts a click on a contact button (WhatsApp, phone, email...). Called by POST /t/e from public/js/track.js. */
function trackEvent(name) {
  if (!EVENTS.has(name)) return false;
  if (buf.date !== today()) flush();
  bump(buf.events, name);
  return true;
}

// ---- live view (memory only, nothing stored): who is on the site right now and what happened in the last half hour
const LIVE_WINDOW = 5 * 60 * 1000;
const recent = new Map(); // visitor code -> { t, path, device }
const perMinute = new Map(); // minute number -> page views
function noteLive(vid, path, dev) {
  const now = Date.now();
  recent.set(vid, { t: now, path, device: dev });
  const m = Math.floor(now / 60000);
  perMinute.set(m, (perMinute.get(m) || 0) + 1);
  if (perMinute.size > 90) for (const k of perMinute.keys()) if (k < m - 60) perMinute.delete(k);
}

/** Visitors active in the last 5 minutes, the pages they are on, views today and views per minute for the last 30 minutes. */
async function realtime() {
  const now = Date.now();
  for (const [k, v] of recent) if (now - v.t > LIVE_WINDOW) recent.delete(k);
  const pages = {}; const devices = {};
  for (const v of recent.values()) { bump(pages, v.path); bump(devices, v.device); }
  const doc = (await pageviews.get(today())) || { views: 0 };
  const m = Math.floor(now / 60000);
  const minutes = [];
  for (let i = 29; i >= 0; i -= 1) minutes.push(perMinute.get(m - i) || 0);
  const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  return {
    active: recent.size, pages: top(pages), devices: top(devices), minutes,
    last30: minutes.reduce((n, x) => n + x, 0),
    viewsToday: (buf.date === today() ? buf.views : 0) + (doc.views || 0),
    at: new Date().toISOString(),
  };
}

const track404 = (req) => {
  if (/\.(?:png|jpe?g|gif|webp|svg|ico|css|js|map|woff2?)$/i.test(req.path)) return;
  bump(missing, req.path.slice(0, 200));
};
const trackRedirect = (id) => bump(hits, id);

async function flush() {
  const snap = buf; const m = missing; const h = hits;
  buf = fresh();
  missing = {}; hits = {};
  try {
    if (snap.views || Object.keys(snap.bots).length || Object.keys(snap.events).length) {
      const doc = (await pageviews.get(snap.date)) || { date: snap.date, views: 0, visitors: [], sort: -Number(snap.date.replace(/-/g, '')) };
      LISTS.forEach((k) => { doc[k] = doc[k] || {}; });
      doc.views += snap.views;
      doc.visitors = [...new Set([...doc.visitors, ...snap.visitors])].slice(0, MAX_VISITORS_PER_DAY);
      for (const k of LISTS) for (const [p, n] of Object.entries(snap[k])) if (p in doc[k] || Object.keys(doc[k]).length < (k === 'tourCountries' ? 4000 : MAX_KEYS)) bump(doc[k], p, n);
      await pageviews.put(doc);
    }
    for (const [p, n] of Object.entries(m)) {
      const row = (await notfound.get(p)) || { path: p, count: 0, first: new Date().toISOString(), sort: 0 };
      await notfound.put({ ...row, count: row.count + n, last: new Date().toISOString() });
    }
    for (const [id, n] of Object.entries(h)) {
      const row = await redirects.get(id);
      if (row) await redirects.put({ ...row, hits: (row.hits || 0) + n });
    }
  } catch (err) {
    logger.warn(`analytics flush failed: ${err.message}`);
  }
}

const timer = setInterval(flush, FLUSH_MS);
timer.unref();
['SIGTERM', 'SIGINT'].forEach((s) => process.once(s, () => flush().finally(() => process.exit(0))));

/** Totals and series for the last `days` days (includes the unflushed buffer so numbers are live). */
async function summary(days = 30) {
  await flush();
  const all = await pageviews.list();
  const byDate = new Map(all.map((d) => [d.date, d]));
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const d = byDate.get(date);
    series.push({ date, views: d?.views || 0, visitors: d?.visitors?.length || 0 });
  }
  const prev = [];
  for (let i = days * 2 - 1; i >= days; i -= 1) prev.push(byDate.get(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)));
  const merge = (key) => {
    const out = {};
    series.forEach((s) => Object.entries(byDate.get(s.date)?.[key] || {}).forEach(([k, n]) => bump(out, k, n)));
    return Object.entries(out).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name: name.replace(/·/g, '.'), count }));
  };
  const sum = (arr, f) => arr.reduce((n, x) => n + f(x), 0);
  return {
    series,
    views: sum(series, (s) => s.views),
    visitors: sum(series, (s) => s.visitors),
    prevViews: sum(prev, (d) => d?.views || 0),
    prevVisitors: sum(prev, (d) => d?.visitors?.length || 0),
    pages: merge('pages').slice(0, 10),
    allPages: merge('pages'),
    sources: merge('sources'),
    search: merge('search'),
    campaigns: merge('campaigns').slice(0, 8),
    bots: merge('bots'),
    events: merge('events'),
    langs: merge('langs').slice(0, 6),
    hours: merge('hours'),
    countries: merge('countries'),
    tourCountries: merge('tourCountries'),
    refs: merge('refs').slice(0, 8),
    devices: merge('devices'),
    today: series[series.length - 1],
  };
}

module.exports = { middleware, track404, trackRedirect, trackEvent, flush, summary, realtime };
