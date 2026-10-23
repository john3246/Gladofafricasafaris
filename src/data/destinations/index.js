const fs = require('fs');
const path = require('path');

module.exports = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')))
  .sort((a, b) => a.sort - b.sort);
