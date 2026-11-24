/** One-off migration: pulls real tours, destinations, posts, FAQs and images from the live WordPress site,
 *  then overlays the client's latest itinerary documents (content/packages). */
const { importTours } = require('./importTours');
const { importPackages } = require('./importPackages');
const { importDestinations } = require('./importDestinations');
const { importPosts, importFaq, importSiteImages } = require('./importContent');

(async () => {
  await importSiteImages();
  await importTours();
  importPackages();
  await importDestinations();
  await importPosts();
  await importFaq();
  console.log('import complete');
})().catch((e) => { console.error(e); process.exit(1); });
