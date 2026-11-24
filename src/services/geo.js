/**
 * Where an IP address is: country and city from a database that ships inside the app (geoip-lite), so no address
 * is ever sent to another service. The data loads the first time it is needed (about 100 MB of memory) and answers
 * are remembered. City is often unknown, especially for mobile networks; the country is usually right.
 */
let geo = null;
const cache = new Map();
let names = null;

const PRIVATE = /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80)/i;

function countryName(code) {
  try { names = names || new Intl.DisplayNames(['en'], { type: 'region' }); return names.of(code) || code; } catch (_) { return code; }
}

/** @returns {{label: string, country: string, city: string}} label is e.g. "Arusha, Tanzania", "Local network" or "Unknown". */
function lookup(rawIp) {
  const ip = String(rawIp || '').replace(/^::ffff:/i, '').trim();
  if (!ip) return { label: 'Unknown', country: '', city: '' };
  if (PRIVATE.test(ip)) return { label: 'Local network', country: '', city: '' };
  if (cache.has(ip)) return cache.get(ip);
  let out = { label: 'Unknown', country: '', city: '' };
  try {
    geo = geo || require('geoip-lite');
    const hit = geo.lookup(ip);
    if (hit && hit.country) {
      const country = countryName(hit.country);
      out = { label: [hit.city, country].filter(Boolean).join(', '), country, city: hit.city || '' };
    }
  } catch (_) { /* the location database is optional: show Unknown */ }
  if (cache.size > 2000) cache.clear();
  cache.set(ip, out);
  return out;
}

/** "Chrome on Windows", "Safari on iPhone"... from a browser's User-Agent text. */
function device(ua) {
  const s = String(ua || '');
  if (!s) return '';
  const browser = /edg\//i.test(s) ? 'Edge' : /opr\/|opera/i.test(s) ? 'Opera' : /firefox/i.test(s) ? 'Firefox' : /chrome|crios/i.test(s) ? 'Chrome' : /safari/i.test(s) ? 'Safari' : /curl|wget|python|node/i.test(s) ? 'Script' : 'Browser';
  const os = /iphone|ipad/i.test(s) ? 'iPhone/iPad' : /android/i.test(s) ? 'Android' : /windows/i.test(s) ? 'Windows' : /mac os/i.test(s) ? 'Mac' : /linux/i.test(s) ? 'Linux' : '';
  return os ? `${browser} on ${os}` : browser;
}

module.exports = { lookup, device };
