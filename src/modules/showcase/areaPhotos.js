const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { accommodations, tours, destinations, posts } = require('../../store/collections');

const PUBLIC = path.join(__dirname, '..', '..', '..', 'public');
const md5 = (rel) => crypto.createHash('md5').update(fs.readFileSync(path.join(PUBLIC, rel))).digest('hex');

// destination slug -> region of the accommodations page
const DEST_REGION = [[/serengeti|ndutu/, 'Serengeti'], [/ngorongoro/, 'Ngorongoro'], [/tarangire/, 'Tarangire'], [/manyara/, 'Lake Manyara'],
  [/kilimanjaro|moshi|meru/, 'Kilimanjaro'], [/arusha/, 'Arusha'], [/lengai|natron/, 'Lake Natron'], [/ruaha/, 'Ruaha National Park'], [/nyerere|selous/, 'Selous Game Reserve']];
const regionsOf = (t) => {
  const out = new Set();
  for (const slug of t.destinations || []) for (const [re, r] of DEST_REGION) if (re.test(slug)) out.add(r);
  if (out.has('Kilimanjaro')) out.add('Moshi');
  if (out.has('Serengeti')) out.add('Lake Victoria');
  if (out.has('Lake Manyara')) out.add('Lake Eyasi');
  return out;
};

/**
 * Gives every accommodation without its own photo a different photo of its area, taken from the safari photos
 * already on the website (so there is nothing to license). A photo is not used on two cards while unused ones remain,
 * and never one that is the cover of a safari, destination or article. Own photos and links are never touched.
 */
async function assign() {
  const covers = new Set(['/images/hero.webp', '/images/og-default.webp']);
  [...(await tours.list()), ...(await destinations.list()), ...(await posts.list())].forEach((d) => d.image && covers.add(d.image));
  const coverHashes = new Set([...covers].filter((c) => fs.existsSync(path.join(PUBLIC, c))).map(md5));

  const allTours = await tours.list();
  const bySlug = new Map(allTours.map((t) => [t.slug, t]));
  const seen = new Set();
  const pool = []; // { url, regions:Set }
  const dir = path.join(PUBLIC, 'images', 'tours');
  for (const f of fs.readdirSync(dir).sort()) {
    if (!/\.webp$/.test(f)) continue;
    const url = `/images/tours/${f}`;
    const h = md5(url.slice(1));
    if (coverHashes.has(h) || seen.has(h)) continue;
    seen.add(h);
    const tour = bySlug.get(f.replace(/\.webp$/, '').replace(/-\d$/, ''));
    pool.push({ url, regions: tour ? regionsOf(tour) : new Set() });
  }

  const docs = (await accommodations.list()).filter((a) => !a.image && !a.imageUrl).sort((a, b) => (a.region || '').localeCompare(b.region || '') || a.name.localeCompare(b.name));
  const used = new Map(); // url -> times used
  let n = 0;
  for (const a of docs) {
    const fits = pool.filter((p) => p.regions.has(a.region));
    const choices = [fits, pool.filter((p) => !p.regions.size), pool];
    let pick = null;
    for (const list of choices) {
      const fresh = list.filter((p) => !used.has(p.url));
      if (fresh.length) { pick = fresh[(a.name.length * 7 + n) % fresh.length]; break; }
    }
    if (!pick) { const all = (fits.length ? fits : pool).slice().sort((x, y) => (used.get(x.url) || 0) - (used.get(y.url) || 0)); pick = all[0]; }
    if (!pick) continue;
    used.set(pick.url, (used.get(pick.url) || 0) + 1);
    await accommodations.put({ ...a, areaImage: pick.url });
    n += 1;
  }
  return `${n} places got an area photo; ${used.size} different photos used`;
}

module.exports = { assign };
