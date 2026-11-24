const { secrets } = require('../store/collections');
const { events } = require('../store');
const { encrypt, decrypt } = require('../utils/secretBox');

/**
 * Mail-server login entered in CMS > Email settings. It lives in its own collection (never in `settings`, which is
 * visible to every public template and part of backups) and the password is stored encrypted.
 */
const KEY = 'smtp';
let cache;
events.on('change', (name) => { if (name === 'secrets') cache = undefined; });

async function load() {
  if (cache === undefined) cache = (await secrets.get(KEY)) || null;
  return cache;
}

/** Ready-to-use connection options, or null when nothing (usable) has been saved in the CMS. */
async function get() {
  const c = await load();
  const pass = c && decrypt(c.passEnc);
  if (!c || !c.host || !c.user || !pass) return null;
  const port = Number(c.port) || 465;
  const ssl = c.security === 'ssl' || (!c.security && port === 465);
  return { host: c.host, port, secure: ssl, requireTLS: !ssl, auth: { user: c.user, pass } };
}

/** What the CMS may show: everything except the password. */
async function summary() {
  const c = await load();
  if (!c) return null;
  return { host: c.host, port: c.port, security: c.security, user: c.user, hasPassword: Boolean(c.passEnc), readable: Boolean(decrypt(c.passEnc)), updatedAt: c.updatedAt };
}

/** Saves the connection. An empty password keeps the saved one; `clearPassword` removes it. */
async function save({ host, port, security, user, password, clearPassword }) {
  const current = (await secrets.get(KEY)) || {};
  const passEnc = clearPassword ? '' : password ? encrypt(password) : current.passEnc || '';
  await secrets.put({ key: KEY, host, port: Number(port), security, user, passEnc, updatedAt: new Date().toISOString() });
}

const remove = () => secrets.remove(KEY);

module.exports = { get, summary, save, remove };
