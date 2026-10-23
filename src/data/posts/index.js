const fs = require('fs');
const path = require('path');

/** Real posts imported from the live site (./imported/*.json) + SEO guides written for search intent. */
const imported = fs
  .readdirSync(path.join(__dirname, 'imported'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(__dirname, 'imported', f), 'utf8')));

const guides = [
  require('./migration-calendar'),
  require('./tanzania-safari-cost'),
  require('./ndutu-calving'),
  require('./best-time-to-visit'),
  require('./luxury-vs-budget'),
];

module.exports = [...imported, ...guides]
  .sort((a, b) => b.published.localeCompare(a.published))
  .map((p, i) => ({ ...p, sort: i }));
