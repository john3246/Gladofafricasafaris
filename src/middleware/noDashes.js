/**
 * House style: no long dashes anywhere on the public site. They are replaced as each page goes out (after translation),
 * so it covers English, the other languages and anything added later in the CMS, without changing the stored text.
 * Scripts, styles, link addresses and form values are left exactly as they are.
 */
const ENTITY = /&(?:mdash|ndash|#8211|#8212|#x2013|#x2014);/gi;
const DASH = /[–—―]/;
const TEXT_ATTRS = /(\s(?:content|alt|title|aria-label|placeholder)=")([^"]*)(")/g;

function clean(text) {
  const s = text.replace(ENTITY, '—');
  if (!DASH.test(s)) return s;
  return s
    .replace(/(\d)\s*[–—]\s*(?=[$€]?\d)/g, '$1-') // ranges: 6-10, $200-$800
    .replace(/——/g, '，')
    .replace(/([,.:;!?，。：；])\s*[–—―]+\s+/g, '$1 ')
    .replace(/(\S)\s+[–—―]+\s+/g, '$1, ')
    .replace(/^(\s*)[–—―]+\s+(?=\S)/, '$1, ')
    .replace(/(\S)\s+[–—―]+(\s*)$/, '$1,$2')
    .replace(/([A-Za-zÀ-ÿ])—(?=[A-Za-zÀ-ÿ])/g, '$1, ')
    .replace(/[–—―]/g, '-');
}

/** JSON-LD (search engine data) is text too. */
const isData = (block) => /^<script[^>]*application\/ld\+json/i.test(block);

function removeDashes(html) {
  return html
    .split(/(<(?:script|style|textarea|pre)\b[\s\S]*?<\/(?:script|style|textarea|pre)>|<!--[\s\S]*?-->|<[^>]+>)/i)
    .map((part) => {
      if (!part) return part;
      if (part[0] !== '<') return clean(part);
      if (isData(part)) return part.replace(ENTITY, '—').replace(/(\d)\s*[–—]\s*(?=\d)/g, '$1-').replace(/\s+[–—]\s+/g, ', ').replace(/——/g, '，').replace(/[–—―]/g, '-');
      if (/^<(script|style|textarea|pre|!)/i.test(part)) return part;
      return part.replace(TEXT_ATTRS, (m, a, v, z) => a + clean(v) + z);
    })
    .join('');
}

module.exports = (req, res, next) => {
  const send = res.send;
  res.send = function withoutDashes(body) {
    const html = typeof body === 'string' && (!res.get('Content-Type') || /html/.test(String(res.get('Content-Type')))) && body.includes('<html');
    return send.call(this, html ? removeDashes(body) : body);
  };
  next();
};
module.exports.removeDashes = removeDashes;
