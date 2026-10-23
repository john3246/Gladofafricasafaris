const { text } = require('./html');

/** Walks headings and accordion items in document order so each Q&A keeps its group (General, Best time, Booking...). */
function parseFaq(raw) {
  const html = raw.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '');
  const re = /<h([1-6])[^>]*class="[^"]*elementor-heading-title[^"]*"[^>]*>([\s\S]*?)<\/h\1>|elementor-accordion-title"[^>]*>([\s\S]*?)<\/a>[\s\S]*?elementor-tab-content[^>]*>([\s\S]*?)<\/div>/g;
  const out = [];
  let group = 'General';
  for (const m of html.matchAll(re)) {
    if (m[2] !== undefined) {
      const t = text(m[2]);
      if (t && t.length < 60 && !/\?$/.test(t)) group = t;
    } else {
      out.push({ group, q: text(m[3]), a: text(m[4]) });
    }
  }
  return out;
}

module.exports = { parseFaq };
