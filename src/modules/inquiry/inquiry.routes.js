const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const { inquiryLimiter } = require('../../middleware/rateLimit');
const c = require('./inquiry.controller');

router.post('/inquiry', inquiryLimiter, asyncHandler(c.submit));

module.exports = router;
