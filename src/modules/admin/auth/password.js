const crypto = require('crypto');

/** scrypt password hashing: stored as "scrypt$<salt>$<hash>". */
const hash = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
};

const verify = (password, stored = '') => {
  const [scheme, salt, key] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !key) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(key, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
};

module.exports = { hash, verify };
