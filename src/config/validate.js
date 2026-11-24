const env = require('./env');

const PLACEHOLDERS = ['choose-a-long-unique-password', 'generate-a-long-random-string', 'changeme', 'password', 'admin'];

/**
 * Refuses to start a production server with unsafe settings (a forgotten session secret would let anyone
 * forge an admin login cookie). Development is never blocked; it only gets warnings.
 * @returns {string[]} problems found
 */
function problems() {
  const out = [];
  const secret = process.env.SESSION_SECRET || '';
  if (secret.length < 32 || PLACEHOLDERS.includes(secret)) out.push('SESSION_SECRET must be a random string of at least 32 characters.');
  if (!/^https:\/\//.test(env.siteUrl)) out.push('SITE_URL must be your public https:// address (it builds canonical links, the sitemap and cookies).');
  if (env.useDb && !env.databaseUrl) out.push('DATABASE_URL is missing while USE_DB is on: content would be lost on every restart.');
  const pass = env.adminPassword;
  if (pass && (pass.length < 12 || PLACEHOLDERS.includes(pass.toLowerCase()))) out.push('ADMIN_PASSWORD must be at least 12 characters and not a placeholder.');
  return out;
}

module.exports = { problems };
