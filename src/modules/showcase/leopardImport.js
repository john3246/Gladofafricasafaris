/** Imports accommodation details and photos from Leopard Tours (used with their permission); each record keeps sourceUrl / sourceName for the backlink. Photos already in public/images/accommodations are reused, so this needs no network on the server. Your own edits are kept. */
const fs = require('fs');
const path = require('path');
const { accommodations } = require('../../store/collections');

const data = require('../../data/leopard-accommodations.json');
const ROOT = path.join(__dirname, '../../../public/images/accommodations');
const slugOf = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const REGION = { 'Arusha National Park': 'Arusha' };
const title = (s) => s.toLowerCase().replace(/(^|[\s(&'’-])([a-z])/g, (m, p, c) => p + c.toUpperCase()).replace(/\bBy\b/g, 'by').replace(/\bAt\b/g, 'at').replace(/\bOf\b/g, 'of');
const typeOf = (n) => (/camp/i.test(n) ? 'Tented camp' : /hotel|inn|suites|towers/i.test(n) ? 'Hotel' : /villa|farm|house|ranch/i.test(n) ? 'Villa or farm house' : 'Lodge');

async function download(url, file) {
  if (fs.existsSync(file)) return true;
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) return false;
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return true;
}

async function run() {
  let created = 0;
  for (const l of data) {
    const name = title(l.name.replace(/\s+/g, ' '));
    const slug = slugOf(name);
    const dir = path.join(ROOT, slug);
    fs.mkdirSync(dir, { recursive: true });
    const local = [];
    for (const [i, u] of l.imgs.entries()) {
      const ext = (path.extname(new URL(u).pathname) || '.jpg').toLowerCase();
      const f = `${i + 1}${ext}`;
      try { if (await download(u, path.join(dir, f))) local.push(`/images/accommodations/${slug}/${f}`); } catch { /* skip a failed photo */ }
    }
    const clean = (p) => p.replace(/^(Location|Accommodation|Facilities\s*&\s*Services)\s*:\s*/i, '').trim();
    const description = l.paras.slice(0, 3).map(clean).join(' ');
    const old = (await accommodations.get(slug)) || {};
    await accommodations.put({
      ...old, slug, name: old.name || name, region: old.region || REGION[l.region] || l.region, type: old.type || typeOf(name), kind: old.kind || typeOf(name),
      description: old.description || description, image: old.image || local[0] || '', gallery: (old.gallery && old.gallery.length) ? old.gallery : local.slice(1),
      facts: old.facts || [], aliases: old.aliases || [], sort: old.sort ?? 500 + created, status: old.status || 'published',
      sourceUrl: l.url, sourceName: 'Leopard Tours',
    });
    created += 1;
  }
  return `${created} accommodations imported`;
}
module.exports = { run };
