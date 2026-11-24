const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { inquiryLimiter } = require('../../middleware/rateLimit');
const c = require('./inquiry.controller');

router.get(['/contact-us', '/get-a-quote'], asyncHandler(c.contact));
router.get('/book/:slug', asyncHandler(c.book));
router.post('/inquiry', inquiryLimiter, asyncHandler(c.submit));

module.exports = router;
