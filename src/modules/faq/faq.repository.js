const createContentRepository = require('../../db/contentRepository');
const seed = require('../../data/faqs.json').map((f, i) => ({ ...f, slug: `faq-${i + 1}`, sort: i }));

module.exports = createContentRepository('faqs', seed);
