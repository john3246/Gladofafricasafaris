const { accommodations, tours } = require('../../store/collections');
const { isLive } = require('../../store/publicRepository');

/**
 * Accommodations: the lodges, camps and hotels named in the safari itineraries. The first list is built from those
 * itineraries; after that the team edits it in CMS > Accommodations (add a description and a photo, or remove one).
 */
const GENERIC_WORDS = new Set(['lodge', 'camp', 'campsite', 'safari', 'hotel', 'luxury', 'central', 'western', 'northern', 'southern', 'eastern', 'serengeti',
  'ngorongoro', 'tarangire', 'manyara', 'arusha', 'area', 'near', 'or', 'and', 'similar', 'optional', 'the', 'a', 'of', 'in', 'at', 'crater', 'rim', 'highlands',
  'mto', 'wa', 'mbu', 'ndutu', 'mid-range', 'midrange', 'budget', 'standard', 'private', 'tented', 'mobile']);
const HUT_WORDS = /\b(hut|huts|barafu|barranco|mweka|karanga|shira|horombo|kibo|saddle|miriakamba|mandara|simba|lava tower|machame camp)\b/i;

/** "Safari Haven Migration Camp or similar, Meals: Dinner" -> "Safari Haven Migration Camp"; generic placeholders -> "". */
function cleanName(raw) {
  let s = String(raw || '').replace(/(meals?(\s*plan)?\s*:.*)$/i, '').replace(/\(.*?\)/g, '').replace(/\bor similar\b/gi, '').replace(/\s+/g, ' ').replace(/^[\s,/-]+|[\s,/-]+$/g, '');
  if (!s || s.length < 4) return '';
  // names ending in "Meals" (text glued on) or a bare place are not lodges
  s = s.replace(/Meals?$/i, '').trim();
  if (!/(lodge|camp|campsite|hotel|hut|villa|resort|inn|house)/i.test(s)) return ''; // an area, not a place to sleep
  if (/\s(in|at)\s|^(public|budget|designated)\b/i.test(s)) return ''; // a description ("Public campsite in Mto wa Mbu"), not a named place
  const tokens = s.toLowerCase().split(/[^a-z]+/).filter((t) => t && !GENERIC_WORDS.has(t));
  return tokens.length ? s : '';
}

const keyOf = (name) => name.toLowerCase().replace(/\bsafari\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const slugOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function typeOf(name) {
  if (HUT_WORDS.test(name)) return 'Kilimanjaro hut or camp';
  if (/campsite/i.test(name)) return 'Public campsite';
  if (/hotel/i.test(name)) return 'Hotel';
  if (/camp/i.test(name)) return 'Tented camp';
  if (/lodge/i.test(name)) return 'Safari lodge';
  return 'Lodge or camp';
}

/** Every real accommodation found in the itineraries, with the names it appears under. */
async function deriveFromItineraries() {
  const found = new Map();
  for (const t of await tours.list()) {
    for (const d of t.itinerary || []) {
      const name = cleanName(d.accommodation);
      if (!name) continue;
      const k = keyOf(name);
      const rec = found.get(k) || { name, aliases: new Set(), uses: 0 };
      rec.aliases.add(k);
      rec.uses += 1;
      const caps = (x) => (x.match(/[A-Z]/g) || []).length;
      if (caps(name) > caps(rec.name) || (caps(name) === caps(rec.name) && name.length > rec.name.length)) rec.name = name; // keep the best-written spelling
      found.set(k, rec);
    }
  }
  return [...found.values()].sort((a, b) => b.uses - a.uses);
}

/** One-time: creates the accommodation records from the itineraries (the team edits them afterwards). */
async function seedFromItineraries() {
  let n = 0;
  for (const rec of await deriveFromItineraries()) {
    const slug = slugOf(rec.name);
    if (!slug || (await accommodations.get(slug))) continue;
    await accommodations.put({ slug, name: rec.name, type: typeOf(rec.name), description: '', image: '', aliases: [...rec.aliases], sort: n });
    n += 1;
  }
  return `${n} accommodations created from the itineraries`;
}

const REGION_ORDER = require('../../data/accommodations.data').REGIONS;

/** The safaris whose itinerary names this place. */
function toursUsing(a, liveTours) {
  const keys = new Set([keyOf(a.name), ...(a.aliases || [])]);
  return liveTours.filter((t) => (t.itinerary || []).some((d) => { const n = cleanName(d.accommodation); return n && keys.has(keyOf(n)); }))
    .map((t) => ({ slug: t.slug, title: t.title, days: t.days }));
}

const safeUrl = (u) => (/^https:\/\/[^\s"'<>]+$/.test(String(u || '')) ? u : '');
/** Own photo (uploaded or linked) first, then the area photo given to every place, then the region's stand-in. */
const withPhoto = (a) => {
  const own = a.image || safeUrl(a.imageUrl);
  return { ...a, hasOwnPhoto: Boolean(own), gallery: (a.gallery || []).filter(Boolean), image: own || a.areaImage || require('./gazetteer').AREA_PHOTO[a.region] || '/images/destinations/serengeti-national-park.webp' };
};

/** Every live accommodation, numbered, with its region, photo and the safaris that use it, plus the region filter. */
async function page() {
  const [docs, allTours] = await Promise.all([accommodations.list(), tours.list()]);
  const liveTours = allTours.filter(isLive);
  const rank = (r) => { const i = REGION_ORDER.indexOf(r); return i === -1 ? 99 : i; };
  const items = docs.filter(isLive).sort((x, y) => (x.order ?? 1e6) - (y.order ?? 1e6) || rank(x.region) - rank(y.region) || x.name.localeCompare(y.name))
    .map((a, i) => ({ ...withPhoto(a), n: i + 1, region: a.region || 'Other', tours: toursUsing(a, liveTours) }));
  const counts = new Map();
  items.forEach((a) => counts.set(a.region, (counts.get(a.region) || 0) + 1));
  const regions = [...counts.entries()].map(([name, count]) => ({ name, count, id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
  return { items, regions };
}

/** One accommodation for its own page, with its safaris and neighbours in the same region. */
async function bySlug(slug) {
  const doc = await accommodations.get(slug);
  if (!isLive(doc)) return null;
  const all = await page();
  const item = all.items.find((x) => x.slug === slug);
  return item ? { item, near: all.items.filter((x) => x.region === item.region && x.slug !== slug).slice(0, 3) } : null;
}

module.exports = { cleanName, keyOf, deriveFromItineraries, seedFromItineraries, page, bySlug, typeOf };
