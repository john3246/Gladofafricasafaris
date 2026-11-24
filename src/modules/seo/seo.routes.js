const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { sitemap, robots, llms, llmsFull, toursJson } = require('./seo.controller');

router.get('/sitemap.xml', asyncHandler(sitemap));
router.get('/robots.txt', robots);
router.get('/llms.txt', asyncHandler(llms));
router.get('/llms-full.txt', asyncHandler(llmsFull));
router.get('/tours.json', asyncHandler(toursJson));

module.exports = router;
