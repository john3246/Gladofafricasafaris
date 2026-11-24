const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const { collectRows } = require('../lib/seoAudit');

router.get('/seo', asyncHandler(async (req, res) => {
  const rows = await collectRows();
  const only = req.query.only === 'issues';
  res.render('admin/views/seo', {
    active: 'seo', pageTitle: 'SEO', rows: only ? rows.filter((r) => r.issues.length) : rows, only,
    total: rows.length, withIssues: rows.filter((r) => r.issues.length).length,
  });
}));

module.exports = router;
