const fs = require('fs');
const path = require('path');

const BASE = 'https://gladofafricasafari.com';
const cacheDir = path.join(__dirname, '.cache');
fs.mkdirSync(cacheDir, { recursive: true });

const cacheName = (url) => path.join(cacheDir, url.replace(/[^a-z0-9]+/gi, '_').slice(-150) + '.html');

/** GET html with a disk cache so re-runs do not hammer the live site. */
async function getHtml(url) {
  const file = cacheName(url);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const res = await fetch(url, { headers: { 'user-agent': 'GladSiteImporter/1.0' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const html = await res.text();
  fs.writeFileSync(file, html);
  return html;
}

/** Download a binary file once; returns true when the file exists afterwards. */
async function download(url, dest) {
  if (fs.existsSync(dest)) return true;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = { BASE, getHtml, download };
