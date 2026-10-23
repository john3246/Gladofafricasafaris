const rateLimit = require('express-rate-limit');

exports.inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please try again later or contact us on WhatsApp.',
});
