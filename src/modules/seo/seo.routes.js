const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { sitemap, robots } = require('./seo.controller');

router.get('/sitemap.xml', asyncHandler(sitemap));
router.get('/robots.txt', robots);

module.exports = router;
