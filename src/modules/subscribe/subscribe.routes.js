const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../utils/asyncHandler');
const { subscribers } = require('../../store/collections');
const { buildMeta } = require('../../seo/meta');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 6, standardHeaders: true, legacyHeaders: false });

/** Newsletter sign-up from the website footer. Stored in CMS > Subscribers. */
router.post('/subscribe', limiter, asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const valid = /^\S+@\S+\.\S+$/.test(email) && email.length <= 160;
  if (valid && !req.body.website && !(await subscribers.get(email))) {
    await subscribers.put({ email, name: String(req.body.name || '').trim().slice(0, 100), at: new Date().toISOString(), source: 'footer', sort: -Date.now() });
  }
  res.locals.seo = buildMeta({ title: 'Thank you for subscribing', description: 'Subscription confirmed.', noindex: true });
  res.status(valid ? 200 : 422).render('subscribe/views/done', { valid });
}));

module.exports = router;
