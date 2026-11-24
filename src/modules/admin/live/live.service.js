const { audit, inquiries } = require('../../../store/collections');
const analytics = require('../../../services/analytics');
const geo = require('../../../services/geo');

/** Adds the location and device to audit entries, for the log page and the live panel. */
function withWhere(entries) {
  return entries.map((e) => ({ ...e, where: e.ip ? geo.lookup(e.ip).label : '', device: geo.device(e.ua) }));
}

/** Everything the live panel on the dashboard shows, read at this moment. */
async function panel() {
  const [rt, all, fresh] = await Promise.all([analytics.realtime(), audit.list(), inquiries.list()]);
  return {
    rt,
    newInquiries: fresh.filter((i) => i.status === 'new').length,
    latest: withWhere(all.slice(0, 6)),
  };
}

module.exports = { withWhere, panel };
