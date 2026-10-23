const createContentRepository = require('../../db/contentRepository');
const seed = require('../../data/posts');

module.exports = createContentRepository('posts', seed);
