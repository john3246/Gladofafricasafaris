const createContentRepository = require('../../db/contentRepository');
const seed = require('../../data/destinations');

module.exports = createContentRepository('destinations', seed);
