const ENTITIES = { '&amp;': '&', '&#8217;': '’', '&#8216;': '‘', '&#8211;': '–', '&#8212;': '—', '&#038;': '&', '&#039;': "'", '&quot;': '"', '&nbsp;': ' ', '&#8220;': '“', '&#8221;': '”', '&hellip;': '…', '&#36;': '$' };

const decode = (s) => s.replace(/&#?\w+;/g, (e) => ENTITIES[e] ?? e);

/** Strips tags, decodes entities and collapses whitespace. */
const text = (s = '') => decode(s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

const meta = (html, prop) => {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`, 'i'));
  return m ? decode(m[1]) : '';
};

/** All matches of an element by regex, returned as text. */
const all = (html, re) => [...html.matchAll(re)].map((m) => text(m[1]));

module.exports = { decode, text, meta, all };
