const { regions, pages } = require('../store/collections');
const { events } = require('../store');
const { isLive } = require('../store/publicRepository');
const categoriesService = require('../modules/tours/categories.service');
const destinationsService = require('../modules/destinations/destinations.service');
const toursService = require('../modules/tours/tours.service');
const experiences = require('../modules/showcase/experiences');

const WATCHED = new Set(['tours', 'destinations', 'regions', 'categories', 'pages', 'settings']);
const TTL = 300000;
let cache = { at: 0, value: null };
events.on('change', (name) => { if (WATCHED.has(name)) cache.at = 0; });

const bySort = (a, b) => (a.sort ?? 0) - (b.sort ?? 0);
const BUILT_IN = new Set(['home', 'about', 'terms', 'privacy']);

async function build() {
  const [cats, regionList, dests, signature, pageList, experienceList] = await Promise.all([
    categoriesService.list(), regions.list(), destinationsService.list(), toursService.signature(5), pages.list(), experiences.list(),
  ]);
  const customPages = pageList.filter((p) => isLive(p) && !BUILT_IN.has(p.slug)).sort(bySort);
  return {
    tourStyles: cats.filter((c) => c.showInMenu).map((c) => ({ label: c.menuLabel || c.name, href: `/tanzania-safaris/${c.slug}` })),
    destinationGroups: regionList.filter((r) => isLive(r) && r.showInMenu).sort(bySort).map((r) => ({
      title: r.title,
      href: `/destinations#${r.slug}`,
      items: dests.filter((d) => d.circuit === r.slug).sort(bySort).map((d) => ({ label: d.name, href: `/destinations/${d.slug}` })),
    })).filter((g) => g.items.length),
    // Custom pages the editor chose to show in the top menu and/or footer.
    topPages: customPages.filter((p) => ['top', 'both'].includes(p.menu)).map((p) => ({ label: p.menuLabel || p.title.replace(/<[^>]+>/g, ''), href: `/${p.slug}` })),
    footerPages: customPages.filter((p) => ['footer', 'both'].includes(p.menu)).map((p) => ({ label: p.menuLabel || p.title.replace(/<[^>]+>/g, ''), href: `/${p.slug}` })),
    signature,
    experiences: experienceList.map((e) => ({ label: e.name, href: e.href, count: e.count })),
  };
}

/** Everything the header, mega menus and footer need from CMS content; cached and cleared when that content changes. */
async function get() {
  if (!cache.value || Date.now() - cache.at > TTL) cache = { at: Date.now(), value: await build() };
  return cache.value;
}

module.exports = { get };
