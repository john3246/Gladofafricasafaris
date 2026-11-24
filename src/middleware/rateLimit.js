const rateLimit = require('express-rate-limit');

// Failed submissions (a mistyped date, a missing field) are not counted, so honest guests are never locked out
// while they correct the form. Outside production the limit is relaxed so automated tests can run.
exports.inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 6 : 200,
  skipFailedRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please try again later or contact us on WhatsApp.',
});
