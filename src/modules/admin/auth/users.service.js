const { users } = require('../../../store/collections');
const { newId } = require('../../../store');
const { env } = require('../../../config');
const logger = require('../../../utils/logger');
const password = require('./password');

const ROLES = ['admin', 'editor'];
const DUMMY_HASH = password.hash('not-a-real-account');

const safe = (u) => (u ? { id: u.id, name: u.name, email: u.email, role: u.role, active: u.active !== false, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt } : null);

const list = async () => (await users.list()).map(safe);
const byId = async (id) => users.get(id);
const byEmail = async (email) => (await users.list()).find((u) => u.email === String(email).trim().toLowerCase()) || null;

async function create({ name, email, role, pass }) {
  if (await byEmail(email)) throw new Error('A user with that email already exists');
  const user = {
    id: newId('u'), name: name.trim(), email: email.trim().toLowerCase(),
    role: ROLES.includes(role) ? role : 'editor', active: true,
    passHash: password.hash(pass), createdAt: new Date().toISOString(),
  };
  await users.put(user);
  return safe(user);
}

async function update(id, { name, email, role, active, pass }) {
  const user = await users.get(id);
  if (!user) throw new Error('User not found');
  Object.assign(user, { name: name.trim(), email: email.trim().toLowerCase(), role: ROLES.includes(role) ? role : user.role, active });
  if (pass) { user.passHash = password.hash(pass); user.sv = (user.sv || 0) + 1; } // a new password signs out every other session
  await users.put(user);
  return safe(user);
}

const remove = (id) => users.remove(id);

/** Sets a new password and invalidates all existing sessions of that user. Returns the new session version. */
async function setPassword(id, pass) {
  const user = await users.get(id);
  if (!user) throw new Error('User not found');
  user.passHash = password.hash(pass);
  user.sv = (user.sv || 0) + 1;
  await users.put(user);
  return user.sv;
}

/** Checks credentials; returns the user or null. Inactive users cannot sign in. */
async function authenticate(email, pass) {
  const user = await byEmail(email);
  // Always do the hashing work so response time does not reveal whether an email has an account.
  const valid = password.verify(pass, user ? user.passHash : DUMMY_HASH);
  if (!user || user.active === false || !valid) return null;
  user.lastLoginAt = new Date().toISOString();
  await users.put(user);
  return user;
}

/** First boot: create the owner account from ADMIN_EMAIL / ADMIN_PASSWORD when no users exist. */
async function ensureOwner() {
  if ((await users.count()) > 0) return;
  if (!env.adminEmail || !env.adminPassword) {
    logger.warn('CMS: no admin user yet. Set ADMIN_EMAIL and ADMIN_PASSWORD, then restart.');
    return;
  }
  await create({ name: 'Administrator', email: env.adminEmail, role: 'admin', pass: env.adminPassword });
  logger.info(`CMS: owner account created for ${env.adminEmail}`);
}

module.exports = { list, byId, byEmail, create, update, remove, setPassword, authenticate, ensureOwner, ROLES };
