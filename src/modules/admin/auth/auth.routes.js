const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../../utils/asyncHandler');
const usersService = require('./users.service');
const audit = require('../lib/audit');

// one "failed login" line per address per minute, so a password-guessing script cannot flood the log
const lastFail = new Map();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).render('admin/views/auth/login', { layout: 'admin/views/layout-bare', error: 'Too many attempts. Try again in 15 minutes.', notice: '', next: '/admin', email: '' }),
});

const safeNext = (n) => (typeof n === 'string' && n.startsWith('/admin') && !n.startsWith('//') ? n : '/admin');

const NOTICES = { reset: 'Your password was changed. Sign in with the new one.', registered: 'Your account is ready. Sign in with the password you just chose.' };

router.get('/login', (req, res) => {
  if (req.session.uid) return res.redirect('/admin');
  res.render('admin/views/auth/login', { layout: 'admin/views/layout-bare', error: '', notice: NOTICES[req.query.done] || '', next: safeNext(req.query.next), email: '' });
});

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const user = await usersService.authenticate(req.body.email || '', req.body.password || '');
  if (!user) {
    const key = req.ip; const now = Date.now();
    if (now - (lastFail.get(key) || 0) > 60000) {
      lastFail.set(key, now);
      if (lastFail.size > 500) lastFail.clear();
      await audit.record({ user: { name: 'Unknown visitor' }, ip: req.ip, ua: req.get('user-agent') }, 'failed login', 'users', 'login', `Tried the e-mail ${String(req.body.email || '').slice(0, 80)}`);
    }
    return res.status(401).render('admin/views/auth/login', { layout: 'admin/views/layout-bare', error: 'Incorrect email or password.', notice: '', next: safeNext(req.body.next), email: req.body.email || '' });
  }
  req.session = { uid: user.id, csrf: req.session.csrf, sv: user.sv || 0 };
  await audit.record({ user, ip: req.ip, ua: req.get('user-agent') }, 'login', 'users', user.id, user.email);
  res.redirect(safeNext(req.body.next));
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const who = req.session && req.session.uid ? await require('../../../store/collections').users.get(req.session.uid) : null;
  if (who) await audit.record({ user: who, ip: req.ip, ua: req.get('user-agent') }, 'logout', 'users', who.id, who.email);
  req.session = null;
  res.redirect('/admin/login');
}));

module.exports = router;
