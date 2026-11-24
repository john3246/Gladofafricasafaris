const { reviews } = require('../store/collections');
const { isLive } = require('../store/publicRepository');
const { getSettings } = require('./settings.service');

/** What the trust badges show: the licence line typed in Site Settings (nothing is invented) and the real review average. */
async function get() {
  const [list, s] = await Promise.all([reviews.list(), getSettings()]);
  const rated = list.filter(isLive).map((r) => Number(r.rating)).filter((n) => n > 0);
  return {
    license: String(s.licenseInfo || '').trim(),
    reviewCount: rated.length,
    average: rated.length ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1) : '',
  };
}

module.exports = { get };
