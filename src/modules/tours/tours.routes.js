const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const c = require('./tours.controller');

router.get('/tanzania-safaris', asyncHandler(c.index));
router.get('/tanzania-safaris/:category', asyncHandler(c.category));
router.get('/tours/:slug', asyncHandler(c.show));

module.exports = router;
