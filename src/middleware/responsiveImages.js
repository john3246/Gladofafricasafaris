const fs = require('fs');
const path = require('path');

/**
 * Photo handling for public pages:
 *  - srcset/sizes so a phone downloads a 480 px copy instead of the 1600 px original (see scripts/make-variants.js);
 *    photos without small copies, and tags that already have a srcset, are left alone.
 *  - loading hints: the priority photo (fetchpriority="high") loads at once, every other photo lazily, all decode async.
 */
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'img', 'manifest.json'), 'utf8')); } catch (_) { /* no small copies yet: pages work as before */ }

const CARD = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

function hints(tag) {
  let t = tag;
  if (!/\sdecoding=/.test(t)) t = t.replace(/^<img/, '<img decoding="async"');
  const priority = /\sfetchpriority="high"/.test(t);
  if (!/\sloading=/.test(t)) {
    if (priority) t = t.replace(/^<img/, '<img loading="eager"');
    else if (!/\ssrc="\/images\/logo/.test(t)) t = t.replace(/^<img/, '<img loading="lazy"'); // the logo sits in the header: never lazy
  }
  return t;
}

function enhance(html) {
  return html.replace(/<img\b[^>]*>/g, (raw) => {
    const tag = hints(raw);
    if (/\ssrcset=/.test(tag)) return tag;
    const m = tag.match(/\ssrc="(\/images\/[^"]+\.webp)"/);
    const info = m && manifest[m[1]];
    if (!info || !info.v.length) return tag;
    const set = [...info.v.map((w) => `/img/${w}${m[1].slice('/images'.length)} ${w}w`), `${m[1]} ${info.w}w`].join(', ');
    const width = Number((tag.match(/\swidth="(\d+)"/) || [])[1] || 0);
    return tag.replace(/\ssrc="/, ` srcset="${set}" sizes="${width >= 1400 ? '100vw' : CARD}" src="`);
  });
}

module.exports = (req, res, next) => {
  const send = res.send;
  res.send = function patched(body) {
    if (typeof body === 'string' && (!res.get('Content-Type') || /html/.test(String(res.get('Content-Type')))) && body.includes('<img')) body = enhance(body);
    return send.call(this, body);
  };
  next();
};
module.exports.enhance = enhance;
