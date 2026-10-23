const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const c = require('./destinations.controller');

router.get('/destinations', asyncHandler(c.index));
router.get('/destinations/:slug', asyncHandler(c.show));

module.exports = router;
