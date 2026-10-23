const router = require('express').Router();
const c = require('./pages.controller');

router.get('/about-us', c.show('about'));
router.get('/terms-and-conditions', c.show('terms'));
router.get('/privacy-policy', c.show('privacy'));
router.get(['/contact-us', '/get-a-quote'], c.contact);

module.exports = router;
