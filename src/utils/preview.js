const crypto = require('crypto');
const { env } = require('../config');

/**
 * "Preview" cookie that lets signed-in CMS users see drafts, scheduled posts and the site during maintenance mode.
 * The value is an expiry time signed with the session secret, so visitors cannot forge it by typing a cookie by hand.
 */
const NAME = 'glad_preview';
const TTL_MS = 8 * 3600 * 1000;

const sign = (exp) => crypto.createHmac('sha256', env.sessionSecret || 'unset').update(`preview.${exp}`).digest('hex').slice(0, 32);

function token() {
  const exp = Date.now() + TTL_MS;
  return `${exp}.${sign(exp)}`;
}

/** True when the request carries a valid, unexpired preview cookie. */
function isPreview(req) {
  const m = new RegExp(`(?:^|;\\s*)${NAME}=([^;]+)`).exec(req.headers.cookie || '');
  if (!m) return false;
  const [exp, mac] = decodeURIComponent(m[1]).split('.');
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  const good = Buffer.from(sign(exp));
  const got = Buffer.from(mac);
  return good.length === got.length && crypto.timingSafeEqual(good, got);
}

const cookieOptions = { httpOnly: true, sameSite: 'lax', maxAge: TTL_MS, secure: env.isProd };

module.exports = { NAME, token, isPreview, cookieOptions };
