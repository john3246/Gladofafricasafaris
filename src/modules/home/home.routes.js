const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const c = require('./home.controller');

router.get('/', asyncHandler(c.index));

module.exports = router;
