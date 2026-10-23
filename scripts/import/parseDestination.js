const { text, meta, all } = require('./html');

/** Destination pages are thin: og meta + a couple of intro paragraphs. Hand-written extras fill the rest. */
function parseDestination(html) {
  const paras = all(html, /<p[^>]*>([\s\S]*?)<\/p>/g).filter((p) => p.length > 90 && !/cookie|copyright/i.test(p));
  return {
    name: text(meta(html, 'og:title')).replace(/\s+-\s+.*$/, ''),
    description: meta(html, 'og:description'),
    image: meta(html, 'og:image'),
    intro: [...new Set(paras)].slice(0, 3),
  };
}

module.exports = { parseDestination };
