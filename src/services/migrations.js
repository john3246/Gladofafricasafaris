const { migrations } = require('../store/collections');
const logger = require('../utils/logger');

/**
 * One-time data upgrades for a database that already holds content (home page layout, menus, new articles).
 * Each upgrade has a name and runs once; its name is remembered, so editors can change or delete the result
 * afterwards without it coming back at the next restart.
 */
async function runOnce(name, fn) {
  if (await migrations.get(name)) return false;
  const result = await fn();
  await migrations.put({ key: name, at: new Date().toISOString(), result: typeof result === 'string' ? result : '' });
  logger.info(`Upgrade "${name}" applied${typeof result === 'string' && result ? `: ${result}` : ''}`);
  return true;
}

module.exports = { runOnce };
