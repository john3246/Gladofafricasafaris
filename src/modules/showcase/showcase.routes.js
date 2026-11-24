const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const c = require('./showcase.controller');

router.get('/reviews', asyncHandler(c.reviews));
router.get('/accommodations', asyncHandler(c.accommodations));
router.get('/accommodations/:slug', asyncHandler(c.accommodation));
router.get('/experiences', asyncHandler(c.experiences));
router.get('/group-safaris', (req, res) => res.redirect(301, '/tanzania-safaris/group'));
router.get('/offers', asyncHandler(c.offers));
router.get('/travel-insurance', asyncHandler(c.insurance));

module.exports = router;
