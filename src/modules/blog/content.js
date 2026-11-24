const sanitizeHtml = require('sanitize-html');

const EMBED_HOSTS = ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = (html) => sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const slugify = (s) => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';

/** Strips everything an editor (or a pasted web page) could add except the formatting a blog article needs. */
function clean(html) {
  return sanitizeHtml(String(html || ''), {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'iframe', 'hr', 'pre', 'code'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'], img: ['src', 'alt', 'width', 'height', 'loading'], iframe: ['src', 'class', 'allowfullscreen', 'frameborder'],
      p: ['class'], h2: ['class'], h3: ['class'], h4: ['class'], li: ['class'], blockquote: ['class'],
    },
    allowedClasses: { '*': [/^ql-align-(center|right|justify)$/, /^ql-indent-[1-8]$/], iframe: ['ql-video'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedIframeHostnames: EMBED_HOSTS,
    transformTags: {
      a: (tag, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href || '');
        return { tagName: 'a', attribs: { ...attribs, ...(external ? { target: '_blank', rel: 'noopener' } : {}) } };
      },
      img: (tag, attribs) => ({ tagName: 'img', attribs: { ...attribs, loading: 'lazy' } }),
    },
  }).replace(/<p>(\s|<br\s*\/?>)*<\/p>/g, '');
}

/** Cleans the article and derives what the page needs: heading anchors, a table of contents, word count and reading time. */
function process(html) {
  const body = clean(html);
  const toc = [];
  const used = new Set();
  const withIds = body.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (m, level, attrs, inner) => {
    const text = plain(inner);
    if (!text) return m;
    let id = slugify(text);
    for (let n = 2; used.has(id); n += 1) id = `${slugify(text)}-${n}`;
    used.add(id);
    toc.push({ id, text, level: Number(level) });
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
  const words = plain(withIds).split(' ').filter(Boolean).length;
  return { html: withIds, toc, words, minutes: Math.max(1, Math.round(words / 220)) };
}

/** Posts written before the rich editor stored { h, p[] } sections; this turns them into editor HTML. */
const fromSections = (sections = []) => sections
  .map((s) => `${s.h ? `<h2>${esc(s.h)}</h2>` : ''}${(s.p || []).map((p) => `<p>${esc(p)}</p>`).join('')}`).join('');

module.exports = { clean, process, fromSections, plain };
