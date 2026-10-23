const { text, meta, decode } = require('./html');

/** Turns a WordPress block post into {intro[], sections:[{h,p[]}]} using wp-block heading/paragraph classes. */
function parsePost(html, url) {
  const title = text((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || meta(html, 'og:title'));
  const blocks = [...html.matchAll(/<(h[23]|p)[^>]*class="wp-block-(?:heading|paragraph)"[^>]*>([\s\S]*?)<\/\1>/g)];
  const sections = [{ h: null, p: [] }];
  for (const [, tag, inner] of blocks) {
    const t = text(inner);
    if (!t) continue;
    if (tag === 'p') sections[sections.length - 1].p.push(t);
    else sections.push({ h: t, p: [] });
  }
  const date = (meta(html, 'article:published_time') || '').slice(0, 10);
  const slug = url.replace(/\/$/, '').split('/').pop();
  return {
    slug,
    title: decode(title.replace(/\s+-\s+Glad Of Africa.*$/i, '')).trim(),
    excerpt: meta(html, 'og:description'),
    image: meta(html, 'og:image'),
    published: date,
    sections: sections.filter((s) => s.p.length || s.h),
  };
}

module.exports = { parsePost };
