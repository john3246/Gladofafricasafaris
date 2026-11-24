const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const c = require('./pages.controller');

// Catch-all for single-segment CMS pages. app.js mounts this after every other public router.
router.get('/:slug', asyncHandler(c.custom));

module.exports = router;
