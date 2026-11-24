const { env } = require('./config');
const { problems } = require('./config/validate');
const logger = require('./utils/logger');
const { initDb } = require('./db/pool');
const { initRedis } = require('./cache/redis');
const pageCache = require('./cache/pageCache');
const { createApp } = require('./app');
const { ensureOwner } = require('./modules/admin/auth/users.service');
const { getSettings } = require('./services/settings.service');
const { pages } = require('./store/collections');
const homeSeed = require('./data/home.seed');
const { upgradeLegacyPosts } = require('./modules/blog/enrich');

(async () => {
  const unsafe = problems();
  if (unsafe.length && env.isProd) {
    unsafe.forEach((p) => logger.error(`Unsafe configuration: ${p}`));
    process.exit(1);
  }
  unsafe.forEach((p) => logger.warn(`Config: ${p}`));
  await initDb();
  await initRedis();
  await pageCache.flush().catch(() => {}); // a new release must never serve pages cached by the previous one
  await ensureOwner();
  await getSettings(); // loads CMS settings into the shared site config
  await require('./services/emailTemplates').ensureSystemTemplates(); // password-reset and invitation mails exist on upgraded databases too
  // Built-in catalogue data for databases created before these features: safari styles, the Best-selling category and starter picks.
  await require('./modules/tours/categories.service').ensureSystemCategories();
  const styled = await require('./modules/tours/styles').ensureTourStyles();
  const starters = await require('./modules/tours/bestsellers').ensureStarterSelection();
  await require('./modules/home/ensureHome').addBestSellers();
  if (styled || starters) logger.info(`Catalogue: gave ${styled} tours starting safari styles and marked ${starters} best sellers`);
  // Databases created before the page builder existed have no home-page document yet.
  if (!(await pages.get('home'))) await pages.put({ ...homeSeed, sort: 0 });
  const { runOnce } = require('./services/migrations');
  const { homeLayout, topLinks, homeSections, homeMinimal } = require('./modules/home/upgrades');
  await runOnce('home-why-us-2026-11', homeLayout);
  await runOnce('topbar-links-2026-11', topLinks);
  await runOnce('accommodations-2026-11', () => require('./modules/showcase/accommodations').seedFromItineraries());
  await runOnce('articles-2026-11', async () => {
    const { posts } = require('./store/collections');
    let n = 0;
    for (const p of require('./data/posts/more')) if (!(await posts.get(p.slug))) { await posts.put({ ...p, sort: 0, status: 'published' }); n += 1; }
    return `${n} articles added`;
  });
  await runOnce('calving-seo-2026-11', () => require('./modules/showcase/seoUpgrade').calving());
  await runOnce('articles-calving-2026-11', () => require('./modules/showcase/seoUpgrade').articles(require('./data/posts/calving')));
  await runOnce('legal-pages-2026-11', () => require('./modules/showcase/seoUpgrade').legalPages());
  await runOnce('lodge-gazetteer-2026-11', () => require('./modules/showcase/gazetteer').importAll());
  await runOnce('lodge-area-photos-2026-11', () => require('./modules/showcase/areaPhotos').assign());
  await runOnce('home-sections-2026-11', homeSections);
  await runOnce('home-minimal-2026-11', homeMinimal);
  await runOnce('offers-2026-11', () => require('./modules/showcase/seoUpgrade').offers());
  await runOnce('privacy-country-2026-11', () => require('./modules/showcase/seoUpgrade').privacyCountry());
  await runOnce('licence-2026-11', () => require('./modules/showcase/geoUpgrade').licence());
  await runOnce('wording-2026-11', () => require('./modules/showcase/geoUpgrade').wording());
  await runOnce('leopard-accommodations-2026-11', () => require('./modules/showcase/leopardImport').run());
  await runOnce('geo-finder-2026-11', () => require('./modules/showcase/geoUpgrade').geo());
  await runOnce('camping-tours-2026-11', () => require('./modules/showcase/seoUpgrade').campingTours());
  await runOnce('unique-covers-2026-11', () => require('./modules/showcase/coverfix').apply());
  const i18nStore = require('./i18n/store');
  await i18nStore.load();
  for (const l of ['it', 'fr', 'de']) for (const p of require('./i18n').TRANSLATED) if (!i18nStore.isComplete(l, p)) i18nStore.setStatus(l, p, 1, true); // the pages translated by hand
  const upgraded = await upgradeLegacyPosts(); // posts from before the rich editor get photos and internal links once
  if (upgraded) logger.info(`Blog: upgraded ${upgraded} older posts with photos and internal links`);
  createApp().listen(env.port, env.host, () => {
    require('./i18n/worker').startAuto();
    logger.info(`Glad Of Africa running on ${env.siteUrl} (${env.host || '0.0.0.0'}:${env.port})`);
  });
})();
