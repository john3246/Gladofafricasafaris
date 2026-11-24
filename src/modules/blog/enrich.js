const fs = require('fs');
const path = require('path');
const content = require('./content');
const autolink = require('./autolink');
const { posts } = require('../../store/collections');

const GALLERY = path.join(__dirname, '..', '..', '..', 'public', 'images', 'gallery');
const poolOf = () => (fs.existsSync(GALLERY) ? fs.readdirSync(GALLERY).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).sort().map((f) => `/images/gallery/${f}`) : []);

// Words in a section that call for a specific photo; checked in order against the section's heading and first paragraph.
const TOPICS = [
  [/ndutu|calving/i, '/images/tours/7-day-february-calving-season-safari.webp', 'Ndutu calving season in the southern Serengeti'],
  [/migration|wildebeest|mara river/i, '/images/blog/great-migration-safari.webp', 'Great Migration herds crossing the Serengeti'],
  [/cheetah|leopard|lion|big cat/i, '/images/gallery/cheetah.webp', 'A cheetah on the Serengeti plains'],
  [/ngorongoro|crater/i, '/images/destinations/ngorongoro-crater.webp', 'Ngorongoro Crater'],
  [/tarangire|baobab|elephant/i, '/images/destinations/tarangire-national-park.webp', 'Elephants and baobabs in Tarangire National Park'],
  [/manyara/i, '/images/destinations/lake-manyara-national-park.webp', 'Lake Manyara National Park'],
  [/kilimanjaro|trek|climb/i, '/images/destinations/mount-kilimanjaro.webp', 'Mount Kilimanjaro'],
  [/zanzibar|beach|stone town/i, '/images/destinations/stone-town.webp', 'Stone Town, Zanzibar'],
  [/serengeti/i, '/images/destinations/serengeti-national-park.webp', 'Serengeti National Park'],
];

const plain = (h) => content.plain(h);
const esc = (s) => s.replace(/"/g, '&quot;');

/**
 * Adds photos to an article that has none: a topical photo where a section talks about a known place or animal,
 * otherwise a safari photo from the site's own gallery. Never repeats a photo or reuses the cover.
 */
function addPhotos(html, { cover = '', seed = 0 } = {}) {
  const pool = poolOf();
  const used = new Set([cover]);
  const chunks = html.split(/(?=<h2[\s>])/);
  const eligible = chunks.map((c, i) => (c.startsWith('<h2') && /<\/p>/.test(c) ? i : -1)).filter((i) => i >= 0);
  const step = eligible.length > 6 ? 2 : 1;
  const chosen = eligible.filter((_, n) => n % step === 0).slice(0, 6);
  let cursor = seed % Math.max(pool.length, 1);
  chosen.forEach((i) => {
    const chunk = chunks[i];
    const head = plain((chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '');
    const first = plain((chunk.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || '');
    const topic = TOPICS.find(([re, src]) => re.test(`${head} ${first}`) && !used.has(src));
    let src; let alt;
    if (topic) { [, src, alt] = topic; } else {
      for (let tries = 0; tries < pool.length && (!src || used.has(src)); tries += 1) { src = pool[cursor % pool.length]; cursor += 1; }
      alt = `${head || 'Tanzania safari'}: safari in Tanzania`;
    }
    if (!src || used.has(src)) return;
    used.add(src);
    chunks[i] = chunk.replace(/<\/p>/, `</p><p><img src="${src}" alt="${esc(alt)}"></p>`);
  });
  return chunks.join('');
}

/** One-time upgrade of posts written before the rich editor: content from sections, photos and internal links. */
async function upgradeLegacyPosts() {
  const legacy = (await posts.list()).filter((p) => !p.enriched && !p.content);
  if (!legacy.length) return 0;
  const ruleList = await autolink.rules();
  for (const [n, p] of legacy.entries()) {
    const withPhotos = addPhotos(content.fromSections(p.sections), { cover: p.image, seed: n * 3 });
    const out = content.process(autolink.apply(withPhotos, ruleList));
    const doc = { ...p, content: out.html, toc: out.toc, wordCount: out.words, readMinutes: out.minutes, enriched: true, autoLink: true };
    delete doc.sections;
    await posts.put(doc);
  }
  return legacy.length;
}

module.exports = { addPhotos, upgradeLegacyPosts };
