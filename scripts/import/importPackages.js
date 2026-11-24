const fs = require('fs');
const path = require('path');
const { parsePackage } = require('./parsePackage');
const { classify } = require('./classify');
const { shortSummary } = require('./text');
const PACKAGES = require('./packages.config');

const ROOT = path.join(__dirname, '..', '..');
const TOURS = path.join(ROOT, 'src', 'data', 'tours');
const SOURCE = path.join(ROOT, 'content', 'packages');

const read = (slug) => JSON.parse(fs.readFileSync(path.join(TOURS, `${slug}.json`), 'utf8'));

/** Overlays the client's itinerary documents on the tours imported from the live site. */
function importPackages() {
  // The documents carry no inclusions list, so new tours reuse the standard one from a comparable live tour.
  const standard = read('8-day-northern-serengeti-mara-river-crossing-safari');

  for (const p of PACKAGES) {
    const doc = parsePackage(fs.readFileSync(path.join(SOURCE, p.file), 'utf8'));
    if (!doc.priceFrom || !doc.itinerary.length) throw new Error(`${p.file}: price or itinerary missing`);

    let tour;
    if (p.update) {
      const old = read(p.slug);
      const gallery = [...new Set([...(old.gallery || []), ...(p.addGallery || [])])].slice(0, 6);
      tour = { ...old, gallery };
    } else {
      const base = { slug: p.slug, title: p.title, itinerary: doc.itinerary, description: doc.description };
      tour = {
        ...base, ...classify(base, p.tags), tier: p.tier, style: p.style,
        image: p.image, gallery: p.gallery, badge: '', highlights: [],
        includes: standard.includes, excludes: standard.excludes,
        ...(p.destinations ? { destinations: p.destinations } : {}),
      };
    }
    Object.assign(tour, {
      description: doc.description,
      itinerary: doc.itinerary,
      days: doc.itinerary.length,
      priceFrom: doc.priceFrom,
      priceWas: null,
      priceConfirmed: true,
      summary: shortSummary(doc.description[0]),
      metaDescription: shortSummary(doc.description[0]).slice(0, 155),
    });
    if (!p.update) tour.metaTitle = `${tour.title} | Glad Of Africa`;
    fs.writeFileSync(path.join(TOURS, `${p.slug}.json`), `${JSON.stringify(tour, null, 1)}\n`);
    console.log(`  package ${p.update ? 'updated' : 'new    '} ${p.slug} ${tour.days}d $${tour.priceFrom} [${tour.tier}] dests:${tour.destinations.length}`);
  }
}

module.exports = { importPackages };
