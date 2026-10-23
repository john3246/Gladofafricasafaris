const { Pool } = require('pg');
const { env } = require('../config');
const logger = require('../utils/logger');

/** `state.pool` stays null when USE_DB=false or the connection fails; repositories then use seed data. */
const state = { pool: null };

async function initDb() {
  if (!env.useDb) return logger.warn('USE_DB=false: serving content from src/data seed files');
  try {
    const pool = new Pool({ connectionString: env.databaseUrl, max: 10, connectionTimeoutMillis: 3000 });
    await pool.query('SELECT 1');
    state.pool = pool;
    logger.info('PostgreSQL connected');
  } catch (err) {
    logger.warn(`PostgreSQL unavailable (${err.message}); falling back to seed data`);
  }
}

module.exports = { state, initDb };
