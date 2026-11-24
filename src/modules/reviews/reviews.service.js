const { reviews } = require('../../store/collections');
const { isLive } = require('../../store/publicRepository');

/** Published guest reviews, in the order set in CMS > Testimonials & Reviews. */
module.exports = { list: async () => (await reviews.list()).filter(isLive) };
