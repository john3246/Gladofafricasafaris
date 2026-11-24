const router = require('express').Router();
const analytics = require('../../services/analytics');

/** Contact-button clicks (WhatsApp, phone, e-mail, quote form started), sent by public/js/track.js. No personal data. */
router.post('/t/e', (req, res) => {
  analytics.trackEvent(String((req.body && req.body.e) || ''));
  res.status(204).end();
});

module.exports = router;
