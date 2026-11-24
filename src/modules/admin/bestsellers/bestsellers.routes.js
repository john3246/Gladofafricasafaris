const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const { tours, categories } = require('../../../store/collections');
const bestSellers = require('../../tours/bestsellers');
const audit = require('../lib/audit');
const { flash } = require('../lib/flash');

/**
 * CMS > Best-selling safaris: one table to choose which tours are best sellers, which of them also appear on the
 * home page, and in what order. Best sellers get their own public page (/tanzania-safaris/best-selling).
 */
router.get('/best-sellers', asyncHandler(async (req, res) => {
  const all = await tours.list();
  const rank = (t) => (t.bestSeller ? t.bestSellerOrder ?? 9998 : 100000);
  const items = all.slice().sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title, undefined, { numeric: true }));
  const page = await categories.get('best-selling');
  res.render('admin/views/bestsellers', {
    active: 'best-sellers', pageTitle: 'Best-selling safaris', items, page,
    counts: { best: all.filter((t) => t.bestSeller).length, home: all.filter((t) => t.bestSeller && t.bestSellerHome).length },
  });
}));

router.post('/best-sellers', asyncHandler(async (req, res) => {
  const changed = await bestSellers.save({ best: req.body.best, home: req.body.home, order: req.body.order || {} });
  await audit.record(req, 'updated', 'tours', 'best-sellers', `Best-selling safaris (${changed} tour${changed === 1 ? '' : 's'} changed)`);
  flash(req, 'success', changed ? `Best-selling safaris saved (${changed} tour${changed === 1 ? '' : 's'} updated). The website is updated.` : 'Nothing changed.');
  res.redirect('/admin/best-sellers');
}));

module.exports = router;
