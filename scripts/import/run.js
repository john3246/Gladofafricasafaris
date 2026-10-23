/** One-off migration: pulls real tours, destinations, posts, FAQs and images from the live WordPress site. */
const { importTours } = require('./importTours');
const { importDestinations } = require('./importDestinations');
const { importPosts, importFaq, importSiteImages } = require('./importContent');

(async () => {
  await importSiteImages();
  await importTours();
  await importDestinations();
  await importPosts();
  await importFaq();
  console.log('import complete');
})().catch((e) => { console.error(e); process.exit(1); });
