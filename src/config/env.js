require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  siteUrl: (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  useDb: process.env.USE_DB !== 'false',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  pageCacheTtl: Number(process.env.PAGE_CACHE_TTL) || 600,
};
env.isProd = env.nodeEnv === 'production';

module.exports = env;
