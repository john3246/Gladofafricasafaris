const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const live = require('./live.service');

/** HTML fragments the CMS refreshes on its own (public/js/admin-live.js): no page reload, always the current data. */
router.get('/live/panel', asyncHandler(async (req, res) => {
  res.render('admin/views/partials/live-panel', { layout: false, live: await live.panel() });
}));

/** The number of new quote requests, checked on every CMS page so a notice appears when one arrives. */
router.get('/live/badge', asyncHandler(async (req, res) => {
  const { newInquiries } = await live.panel();
  res.type('html').send(`<span data-alert="${newInquiries}"></span>`);
}));

module.exports = router;
