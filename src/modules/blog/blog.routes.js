const router = require('express').Router();
const asyncHandler = require('../../utils/asyncHandler');
const c = require('./blog.controller');

router.get('/blog', asyncHandler(c.index));
router.get('/blog/:slug', asyncHandler(c.show));

module.exports = router;
