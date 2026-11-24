const { accommodations, tours } = require('../../store/collections');
const data = require('../../data/accommodations.data');
const { keyOf } = require('./accommodations');

/** A stand-in photo of the area until you upload the lodge's own photo (CMS > Accommodations). */
const AREA_PHOTO = {
  Ngorongoro: '/images/destinations/ngorongoro-crater.webp',
  'Lake Manyara': '/images/destinations/lake-manyara-national-park.webp',
  Tarangire: '/images/destinations/tarangire-national-park.webp',
  Arusha: '/images/destinations/arusha-national-park.webp',
  Serengeti: '/images/destinations/serengeti-national-park.webp',
  Moshi: '/images/destinations/kilimanjaro-national-park.webp',
  Kilimanjaro: '/images/destinations/mount-kilimanjaro.webp',
  'Lake Victoria': '/images/destinations/serengeti-national-park.webp',
  'Lake Natron': '/images/destinations/mount-ol-donyo-lengai.webp',
  'Selous Game Reserve': '/images/destinations/nyerere-national-park.webp',
  'Ruaha National Park': '/images/destinations/ruaha-national-park.webp',
  'Lake Eyasi': '/images/destinations/lake-manyara-national-park.webp',
};

const slugOf = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const sentence = (s) => (/[.!?]$/.test(s) ? s : `${s}.`);
const upper = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** A short original description from the plain facts: kind, area and a couple of details. */
function blurb({ name, kind, region, facts }) {
  const where = region === 'Other' ? 'in Tanzania' : /^lake |national park|reserve/i.test(region) ? `at ${region}` : `in the ${region} area`;
  const lead = `${upper(kind || 'Place to stay')} ${where}.`;
  return [lead, ...facts.slice(0, 2).map((f) => sentence(upper(f)))].join(' ') + (facts.length ? '' : ` Ask us about ${name} and we will match it to your safari.`);
}

/** The region of an older record from the words in its name (itinerary lodges had none). */
function regionOf(name) {
  const n = name.toLowerCase();
  const rules = [[/hut|barafu|barranco|mweka|karanga|shira|horombo|kibo|mandara|miriakamba|machame|lava tower/, 'Kilimanjaro'], [/serengeti|ndutu|seronera|kogatende|lamai|mara/, 'Serengeti'],
    [/ngorongoro|crater|karatu|oldeani/, 'Ngorongoro'], [/tarangire|burunge/, 'Tarangire'], [/manyara|mto wa mbu/, 'Lake Manyara'], [/moshi|marangu|machame/, 'Moshi'], [/arusha|hotel/, 'Arusha'],
    [/natron|engaresero/, 'Lake Natron'], [/eyasi/, 'Lake Eyasi'], [/ruaha/, 'Ruaha National Park'], [/selous|nyerere/, 'Selous Game Reserve']];
  const hit = rules.find(([re]) => re.test(n));
  return hit ? hit[1] : '';
}

const GENERIC = new Set(['camp', 'lodge', 'safari', 'hotel', 'tented', 'the', 'and', 'camps', 'luxury', 'central', 'north', 'south', 'migration', 'wilderness', 'serengeti', 'ngorongoro', 'tarangire', 'manyara', 'arusha', 'lake', 'national', 'park', 'at', 'in']);
/** Name without the generic words ("Embalakai Ngorongoro Camp" and "Embalakai Ngorongoro" both become "embalakai"). */
const strongKey = (name) => name.toLowerCase().split(/[^a-z]+/).filter((t) => t && !GENERIC.has(t)).join(' ');

const DEST_REGION = [[/serengeti/, 'Serengeti'], [/ngorongoro/, 'Ngorongoro'], [/tarangire/, 'Tarangire'], [/manyara/, 'Lake Manyara'], [/kilimanjaro|moshi/, 'Kilimanjaro'], [/arusha/, 'Arusha']];

/** A place's region from the destinations of the safaris that stay there. */
function regionFromTours(doc, allTours) {
  const keys = new Set([keyOf(doc.name), ...(doc.aliases || [])]);
  for (const t of allTours) {
    if (!(t.itinerary || []).some((d) => keys.has(keyOf(String(d.accommodation || '').replace(/or similar.*$/i, '').replace(/meals?.*$/i, '').trim())))) continue;
    for (const slug of t.destinations || []) { const hit = DEST_REGION.find(([re]) => re.test(slug)); if (hit) return hit[1]; }
  }
  return '';
}

/**
 * One-time: adds the full lodge list. A lodge already in the CMS (from the itineraries) is completed, not duplicated;
 * descriptions and photos an editor wrote are never replaced.
 */
async function importAll() {
  const existing = await accommodations.list();
  const exact = new Map();
  const strong = new Map();
  existing.forEach((a) => {
    [keyOf(a.name), ...(a.aliases || [])].forEach((k) => exact.set(k, a));
    const sk = strongKey(a.name);
    if (sk) strong.set(sk, [...(strong.get(sk) || []), a]);
  });
  const recStrong = new Map();
  data.list.forEach((r) => recStrong.set(strongKey(r.name), (recStrong.get(strongKey(r.name)) || 0) + 1));
  let added = 0; let updated = 0;
  for (const rec of data.list) {
    const sk = strongKey(rec.name);
    const near = strong.get(sk) || [];
    const hit = exact.get(keyOf(rec.name)) || (near.length === 1 && recStrong.get(sk) === 1 ? near[0] : null);
    if (hit) {
      const aliases = [...new Set([...(hit.aliases || []), keyOf(rec.name)])];
      await accommodations.put({ ...hit, aliases, region: hit.region || rec.region, kind: hit.kind || rec.kind, facts: hit.facts && hit.facts.length ? hit.facts : rec.facts, description: hit.description || blurb(rec) });
      updated += 1;
    } else {
      await accommodations.put({ slug: slugOf(rec.name), name: rec.name, type: rec.kind, kind: rec.kind, region: rec.region, facts: rec.facts, description: blurb(rec), image: '', aliases: [keyOf(rec.name)], sort: 100 + rec.n });
      added += 1;
    }
  }
  // places from the itineraries that are still without a region or a description
  const allTours = await tours.list();
  for (const a of await accommodations.list()) {
    const region = a.region || regionOf(a.name) || regionFromTours(a, allTours) || 'Other';
    const kind = a.kind || a.type || 'Place to stay';
    const description = a.description || blurb({ name: a.name, kind, region, facts: a.facts || [] });
    if (region !== a.region || kind !== a.kind || description !== a.description) await accommodations.put({ ...a, region, kind, description });
  }
  return `${added} places added, ${updated} completed`;
}

module.exports = { importAll, blurb, regionOf, AREA_PHOTO, slugOf };
