const crypto = require('crypto');
const cookieSession = require('cookie-session');
const { env } = require('../../../config');
const usersService = require('./users.service');

/** Signed, HttpOnly cookie session (8h). No server-side session store needed. */
const session = cookieSession({
  name: 'glad_admin',
  keys: [env.sessionSecret || 'missing-secret'],
  maxAge: 8 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd,
});

/** Per-session CSRF token, exposed to templates and required on every state-changing request. */
function csrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrf = req.session.csrf;
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const sent = (req.body && req.body._csrf) || req.query._csrf || req.get('x-csrf-token') || '';
  const ok = sent.length === req.session.csrf.length && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(req.session.csrf));
  if (!ok) return res.status(403).render('admin/views/error', { layout: 'admin/views/layout-bare', message: 'Your session expired or the form was invalid. Go back and try again.' });
  next();
}

/** Loads the signed-in user (re-checked on each request so role/active changes apply at once). */
async function requireAuth(req, res, next) {
  const user = req.session.uid ? await usersService.byId(req.session.uid) : null;
  if (!user || user.active === false || (req.session.sv || 0) !== (user.sv || 0)) {
    req.session = null;
    return res.redirect(`/admin/login?next=${encodeURIComponent(req.originalUrl)}`);
  }
  req.user = user;
  res.locals.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.locals.isAdmin = user.role === 'admin';
  next();
}

const requireAdmin = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).render('admin/views/error', { message: 'Only administrators can open this section.' });

module.exports = { session, csrf, requireAuth, requireAdmin };
