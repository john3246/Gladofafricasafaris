const helmet = require('helmet');

module.exports = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.googletagmanager.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com'],
      frameSrc: ["'self'", 'https://www.google.com', 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://player.vimeo.com'],
      formAction: ["'self'"],
    },
  },
  // Same-origin form posts then carry a real Origin header; other sites only learn this site's name, never the page.
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
});
