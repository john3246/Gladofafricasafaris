const { events } = require('../store');
const pageCache = require('./pageCache');

const PUBLIC = new Set(['tours', 'destinations', 'posts', 'faqs', 'reviews', 'pages', 'settings', 'categories', 'regions', 'customfields']);

/** CMS edits to public content clear the Redis page cache so visitors see changes immediately. */
events.on('change', (name) => {
  if (PUBLIC.has(name)) pageCache.flush().catch(() => {});
});
