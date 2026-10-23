const Redis = require('ioredis');
const { env } = require('../config');
const logger = require('../utils/logger');

const state = { client: null };

async function initRedis() {
  if (!env.useDb || !env.redisUrl) return;
  const client = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null });
  client.on('error', () => {});
  try {
    await client.connect();
    state.client = client;
    logger.info('Redis connected');
  } catch (err) {
    client.disconnect();
    logger.warn(`Redis unavailable (${err.message}); page cache disabled`);
  }
}

module.exports = { state, initRedis };
