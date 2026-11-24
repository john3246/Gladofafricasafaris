const { tours, categories } = require('../../store/collections');
const { isLive } = require('../../store/publicRepository');

/**
 * Best-selling safaris: tours the team marks in CMS > Best-selling safaris.
 * Marked tours get their own page (/tanzania-safaris/best-selling), a badge on their card, and the ones also ticked
 * "Show on home page" fill the home page's best-selling section.
 */
const byOrder = (a, b) => (a.bestSellerOrder ?? 9999) - (b.bestSellerOrder ?? 9999) || a.title.localeCompare(b.title);

async function list({ homeOnly = false } = {}) {
  const live = (await tours.list()).filter((t) => isLive(t) && t.bestSeller === true);
  return (homeOnly ? live.filter((t) => t.bestSellerHome === true) : live).sort(byOrder);
}

/** Saves the CMS table: which tours are best sellers, which show on the home page, and their order. */
async function save({ best = [], home = [], order = {} }) {
  const isBest = new Set([].concat(best));
  const isHome = new Set([].concat(home));
  let changed = 0;
  for (const t of await tours.list()) {
    const o = Number(order[t.slug]);
    const next = { ...t };
    if (isBest.has(t.slug)) {
      next.bestSeller = true;
      next.bestSellerHome = isHome.has(t.slug);
      if (Number.isFinite(o) && String(order[t.slug]).trim() !== '') next.bestSellerOrder = o; else delete next.bestSellerOrder;
    } else {
      delete next.bestSeller; delete next.bestSellerHome; delete next.bestSellerOrder;
    }
    if (JSON.stringify(next) !== JSON.stringify(t)) { await tours.put(next); changed += 1; }
  }
  return changed;
}

// A first selection so the page and the home section are not empty on day one. The team changes it in the CMS.
const STARTERS = ['12-day-ultimate-tanzania-trip', '6-day-tanzania-big-five-big-cat-group-safari', '7-days-central-serengeti-safari',
  '6-days-northern-serengeti-mara-river-crossing-tour', '6-day-mount-kilimanjaro-machame-route', '9-day-get-to-know-tanzania'];

/** Runs once (remembered on the category): marks the starter tours as best sellers. */
async function ensureStarterSelection() {
  const cat = await categories.get('best-selling');
  if (!cat || cat.seeded) return 0;
  const all = await tours.list();
  if (all.some((t) => t.bestSeller === true)) { await categories.put({ ...cat, seeded: true }); return 0; }
  let n = 0;
  for (const slug of STARTERS) {
    const t = all.find((x) => x.slug === slug);
    if (!t) continue;
    await tours.put({ ...t, bestSeller: true, bestSellerHome: n < 4, bestSellerOrder: n + 1 }); // the first four also fill the home page
    n += 1;
  }
  await categories.put({ ...(await categories.get('best-selling')), seeded: true });
  return n;
}

module.exports = { list, save, ensureStarterSelection };
