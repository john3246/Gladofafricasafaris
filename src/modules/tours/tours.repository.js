const createContentRepository = require('../../db/contentRepository');
const seed = require('../../data/tours');

module.exports = createContentRepository('tours', seed);
