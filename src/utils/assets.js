const fs = require('fs');
const path = require('path');

/** /css/app.css -> /css/app.css?v=<fingerprint of the file>, so browsers can cache it for a year and still get every release. */
const cache = new Map();
module.exports = (url) => {
  if (!cache.has(url)) {
    let v = '0';
    try { v = Math.floor(fs.statSync(path.join(__dirname, '..', '..', 'public', url)).mtimeMs / 1000).toString(36); } catch (_) { /* file missing: no fingerprint */ }
    cache.set(url, `${url}?v=${v}`);
  }
  return cache.get(url);
};
