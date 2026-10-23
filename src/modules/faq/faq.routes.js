const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const c = require('./faq.controller');

router.get('/faqs', asyncHandler(c.index));

module.exports = router;
