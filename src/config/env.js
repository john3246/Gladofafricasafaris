require('dotenv').config();

const isProd = (process.env.NODE_ENV || 'development') === 'production';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  port: Number(process.env.PORT) || 3000,
  // Interface to listen on. On a server behind nginx set HOST=127.0.0.1 so the app is reachable only through the proxy.
  host: process.env.HOST || undefined,
  siteUrl: (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  useDb: process.env.USE_DB !== 'false',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  pageCacheTtl: Number(process.env.PAGE_CACHE_TTL) || 600,
  // CMS
  sessionSecret: process.env.SESSION_SECRET || (isProd ? '' : 'dev-only-session-secret-change-me'),
  adminEmail: (process.env.ADMIN_EMAIL || '').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  // Optional e-mail alerts for new quote requests, e.g. smtps://user:pass@smtp.example.com
  smtpUrl: process.env.SMTP_URL || '',
  mailFrom: process.env.MAIL_FROM || 'Glad Of Africa <info@gladofafricasafari.com>',
};

module.exports = env;
