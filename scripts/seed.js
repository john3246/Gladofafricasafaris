/**
 * Loads the initial site content (src/data) into the database. Collections seed themselves automatically the
 * first time the site touches them, so this is only needed to pre-load or to reset a collection:
 *   node scripts/seed.js            -> seed any empty collection
 *   node scripts/seed.js --reset tours,faqs   -> DELETE those collections and seed them again from src/data
 */
require('dotenv').config();
const { initDb, state } = require('../src/db/pool');
const c = require('../src/store/collections');

(async () => {
  await initDb();
  if (!state.pool) throw new Error('No database connection. Set USE_DB=true and DATABASE_URL.');
  const reset = (process.argv.find((a) => a.startsWith('--reset=')) || process.argv[process.argv.indexOf('--reset') + 1] || '').split(',').filter((n) => c[n]);
  for (const name of reset) {
    await state.pool.query(`DELETE FROM cms_records WHERE collection=$1 OR key=$2`, [name, `seeded:${name}`]);
    console.log(`reset ${name}`);
  }
  for (const name of ['tours', 'destinations', 'posts', 'faqs', 'reviews', 'pages', 'settings']) console.log(`${name}: ${await c[name].count()} records`);
  await state.pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
