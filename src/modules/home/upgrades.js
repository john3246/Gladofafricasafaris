const { pages, tours, settings } = require('../../store/collections');
const WHY_US = require('../../data/whyus.block');

/**
 * One-time upgrades of content that lives in the database (see services/migrations.runOnce). Editors can change
 * everything these create from the CMS afterwards.
 */

const MIGRATION_PICKS = [
  '7-day-midrange-northern-serengeti-wildebeest-migration', // 7 days
  '8-day-northern-serengeti-mara-river-crossing-safari', // 8 days
  '9-days-serengeti-migration-big-cats-black-rhino-safari', // 9 days
];

/**
 * Home page, November 2026:
 *  - "About us" becomes "Why choose us" with the cover photo of the 12-Day Ultimate Tanzania Tour
 *  - "Your perfect safari" shows the 7, 8 and 9 day Great Migration safaris
 *  - "Our most loved safaris" shows four tours instead of six
 *  - reviews show six short reviews with a button to the full reviews page
 */
async function homeLayout() {
  const home = await pages.get('home');
  if (!home) return 'no home page yet';
  const flagship = await tours.get('12-day-ultimate-tanzania-trip');
  const why = { ...WHY_US, image: (flagship && flagship.image) || WHY_US.image };
  const blocks = (home.blocks || []).map((b) => {
    if (b.type === 'image-text' && /about us/i.test(b.eyebrow || '')) return { ...why };
    if (b.type === 'tours' && /bespoke/i.test(b.eyebrow || '')) {
      return { ...b, tourSlugs: MIGRATION_PICKS, eyebrow: b.eyebrow, buttons: ['View All Migration Safaris | /tanzania-safaris/migration'] };
    }
    if (b.type === 'tours' && b.category === 'best-selling') return { ...b, count: 4 };
    if (b.type === 'reviews') return { ...b, count: 6, buttons: ['Read all reviews | /reviews'] };
    return b;
  });
  await pages.put({ ...home, blocks });

  // the best-selling tours ticked for the home page: keep the first four by order
  const homeTours = (await tours.list()).filter((t) => t.bestSeller && t.bestSellerHome).sort((a, b) => (a.bestSellerOrder ?? 9999) - (b.bestSellerOrder ?? 9999));
  for (const t of homeTours.slice(4)) await tours.put({ ...t, bestSellerHome: false });
  return `${blocks.length} sections updated, ${Math.max(0, homeTours.length - 4)} tours taken off the home best-sellers`;
}

/** Top-bar links: adds Reviews and Accommodations to a saved list of top links (a list never saved uses the new defaults). */
async function topLinks() {
  const doc = await settings.get('site');
  if (!doc || !Array.isArray(doc.topLinks)) return 'using the defaults';
  const have = new Set(doc.topLinks.map((l) => l.href));
  const add = [{ label: 'Reviews', href: '/reviews' }, { label: 'Accommodations', href: '/accommodations' }].filter((l) => !have.has(l.href));
  if (add.length) await settings.put({ ...doc, topLinks: [...add, ...doc.topLinks] });
  return `${add.length} links added`;
}

/** Home page, Nov 2026: packages, climbs, destinations, travel guides and FAQ sections. The old sections are kept in "previousBlocks". */
async function homeSections() {
  const home = await pages.get('home');
  if (!home) return 'no home page yet';
  await pages.put({ ...home, previousBlocks: home.blocks || [], blocks: require('../../data/home.gm').map((x) => ({ ...x })), bestSellerBlockAdded: true });
  return 'home sections rebuilt';
}

/** Home page, Nov 2026 (second pass): a short, clean page. The first saved layout stays in "previousBlocks". */
async function homeMinimal() {
  const home = await pages.get('home');
  if (!home) return 'no home page yet';
  await pages.put({ ...home, previousBlocks: home.previousBlocks || home.blocks || [], blocks: require('../../data/home.gm').map((x) => ({ ...x })), bestSellerBlockAdded: true });
  return 'home page shortened';
}

module.exports = { homeLayout, topLinks, homeSections, homeMinimal, MIGRATION_PICKS };
