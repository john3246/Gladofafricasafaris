const crypto = require('crypto');
const { authtokens } = require('../../../store/collections');

/**
 * One-time links: password reset (60 minutes) and registration invitations (3 days).
 * Only a SHA-256 hash of the token is stored, so a database copy cannot be used to take over an account.
 */
const TTL = { reset: 60 * 60 * 1000, invite: 3 * 24 * 60 * 60 * 1000 };
const hash = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

async function purgeExpired() {
  const now = Date.now();
  for (const t of await authtokens.list()) if (t.expiresAt < now) await authtokens.remove(t.id);
}

/** Creates a link token. Returns the raw token (shown or e-mailed once, never stored). */
async function issue({ type, userId = '', email = '', role = '', createdBy = '' }) {
  await purgeExpired();
  if (type === 'reset') for (const t of await authtokens.list()) if (t.type === 'reset' && t.userId === userId) await authtokens.remove(t.id);
  if (type === 'invite') for (const t of await authtokens.list()) if (t.type === 'invite' && t.email === email) await authtokens.remove(t.id);
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  await authtokens.put({ id: hash(token), type, userId, email, role, createdBy, createdAt: now, expiresAt: now + TTL[type] });
  return token;
}

/** The token's record when it exists, matches the type and has not expired; otherwise null. */
async function find(token, type) {
  if (!/^[\w-]{40,64}$/.test(String(token || ''))) return null;
  const rec = await authtokens.get(hash(token));
  return rec && rec.type === type && rec.expiresAt > Date.now() ? rec : null;
}

const consume = (token) => authtokens.remove(hash(token));

/** True when a reset link for this user was created in the last minute (stops mail-bombing an address). */
async function recentReset(userId) {
  const since = Date.now() - 60000;
  return (await authtokens.list()).some((t) => t.type === 'reset' && t.userId === userId && t.createdAt > since);
}

/** Invitations still waiting to be used (for the Users screen). */
async function pendingInvites() {
  const now = Date.now();
  return (await authtokens.list()).filter((t) => t.type === 'invite' && t.expiresAt > now).sort((a, b) => b.createdAt - a.createdAt);
}

const revoke = (id) => authtokens.remove(id);

module.exports = { issue, find, consume, recentReset, pendingInvites, revoke, TTL };
