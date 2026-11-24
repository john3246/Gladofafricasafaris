const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const c = require('./pages.controller');

router.get('/about-us', asyncHandler(c.show('about')));
router.get('/terms-and-conditions', asyncHandler(c.show('terms')));
router.get('/privacy-policy', asyncHandler(c.show('privacy')));

module.exports = router;
