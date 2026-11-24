const { site, env } = require('../config');

const abs = (p) => (/^https?:/.test(p) ? p : `${env.siteUrl}${p}`);

const TITLE_MAX = 60;
const DESC_MIN = 145;
const DESC_MAX = 155;
// Short, honest closing phrases used only to bring a short description up to a useful length.
const FILLERS = ['Free quote from our Arusha team.', 'Expert local guides.', 'Tailor-made itineraries.', 'Book direct with Glad Of Africa.', 'Clear prices.', 'Get a quote.', 'Book now.', 'Free quote.'];

const clean = (s) => String(s || '').replace(/\s+/g, ' ').replace(/…/g, '').trim();
const cutWords = (s, max) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const at = Math.max(cut.lastIndexOf(' ', max), 0);
  return cut.slice(0, at).replace(/[\s,;:(\-–|&]+$/, '');
};

/** A title of at most 60 characters: the brand is added only when it fits; long titles are cut at a natural break. */
function fitTitle(raw) {
  const brand = site.shortName;
  let core = clean(raw).replace(new RegExp(`\\s*[|\\-–]\\s*${brand}\\s*$`, 'i'), '').trim();
  const withBrand = `${core} | ${brand}`;
  if (withBrand.length <= TITLE_MAX) return withBrand;
  if (core.length <= TITLE_MAX) return core;
  const breaks = [': ', ' | ', ' - ', ' – ', ', ', ' & '].map((b) => core.lastIndexOf(b, TITLE_MAX)).filter((i) => i >= 28);
  if (breaks.length) core = core.slice(0, Math.max(...breaks));
  else core = cutWords(core, TITLE_MAX);
  return core.length <= TITLE_MAX ? core : cutWords(core, TITLE_MAX);
}

/** A meta description of 145-155 characters: long ones are cut at a word, short ones get closing phrases. */
function fitDescription(raw, extras = []) {
  let d = clean(raw) || `${site.name}: ${site.tagline}.`;
  if (d.length > DESC_MAX) {
    const sentence = d.slice(0, DESC_MAX).match(/^(.{100,}[.!?])\s/);
    d = sentence ? sentence[1] : `${cutWords(d, DESC_MAX - 1)}.`;
  }
  if (d.length >= DESC_MIN) return d;
  if (d && !/[.!?]$/.test(d)) d += '.';
  const pool = [...extras.map(clean).filter(Boolean), ...FILLERS];
  // pick a few closing phrases that land the length inside the range (first fitting combination wins)
  const tryAdd = (cur, from, depth) => {
    if (cur.length >= DESC_MIN && cur.length <= DESC_MAX) return cur;
    if (depth === 0) return null;
    for (let i = from; i < pool.length; i += 1) {
      const next = `${cur}${cur ? ' ' : ''}${pool[i]}`;
      if (next.length > DESC_MAX) continue;
      const hit = tryAdd(next, i + 1, depth - 1);
      if (hit) return hit;
    }
    return null;
  };
  return tryAdd(d, 0, 6) || d;
}

/** Normalises per-page SEO data for the <head> partial: a title of at most 60 and a description of 145-155 characters. */
function buildMeta({ title, description, image, type = 'website', noindex = false, published, modified, extras = [] }) {
  return {
    title: fitTitle(title),
    description: fitDescription(description, extras),
    image: abs(image || site.defaultOgImage),
    type,
    noindex,
    published,
    modified,
  };
}

module.exports = { buildMeta, abs, fitTitle, fitDescription };
