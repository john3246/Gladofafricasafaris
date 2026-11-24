const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const { overview } = require('./dashboard.service');
const live = require('../live/live.service');

router.get('/', asyncHandler(async (req, res) => {
  res.render('admin/views/dashboard', { active: 'dashboard', pageTitle: 'Dashboard', live: await live.panel(), ...(await overview()) });
}));

module.exports = router;
