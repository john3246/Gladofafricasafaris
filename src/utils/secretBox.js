const crypto = require('crypto');
const { env } = require('../config');

/**
 * Encrypts small secrets (the mail-server password) before they are stored in the database.
 * AES-256-GCM with a key derived from the server's SESSION_SECRET, so a copy of the database alone reveals nothing.
 * Changing SESSION_SECRET makes stored secrets unreadable: the CMS then asks for the password again.
 */
const key = () => Buffer.from(crypto.hkdfSync('sha256', env.sessionSecret || 'unset', 'glad-of-africa', 'secret-box-v1', 32));

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

/** Returns the original text, or null when the value is missing, was tampered with or the secret changed. */
function decrypt(box) {
  try {
    const [v, iv, tag, data] = String(box || '').split('.');
    if (v !== 'v1') return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  } catch (_) {
    return null;
  }
}

module.exports = { encrypt, decrypt };
