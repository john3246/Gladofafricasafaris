const { env } = require('./config');
const logger = require('./utils/logger');
const { initDb } = require('./db/pool');
const { initRedis } = require('./cache/redis');
const { createApp } = require('./app');

(async () => {
  await initDb();
  await initRedis();
  createApp().listen(env.port, () => logger.info(`Glad Of Africa running on ${env.siteUrl} (port ${env.port})`));
})();
