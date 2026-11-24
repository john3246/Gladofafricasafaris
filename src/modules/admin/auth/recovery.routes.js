const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../../../utils/asyncHandler');
const { env, site } = require('../../../config');
const usersService = require('./users.service');
const tokens = require('./tokens.service');
const mailer = require('../../../services/mailer');
const audit = require('../lib/audit');
const logger = require('../../../utils/logger');

/**
 * Pages for people who are not signed in yet: "forgot password", choosing a new password from an e-mailed link,
 * and one-time registration from an invitation link. Links work once and expire; answers never reveal whether an
 * e-mail address has an account.
 */
const MIN_PASSWORD = 12;
const VIEW = 'admin/views/auth';
const show = (res, view, data = {}, status = 200) => res.status(status).render(`${VIEW}/${view}`, { layout: 'admin/views/layout-bare', error: '', ...data });

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => show(res, 'forgot', { state: 'form', email: '', error: 'Too many attempts. Try again in 15 minutes.' }, 429),
});

const passwordErrors = (b) => {
  const e = {};
  if (String(b.pass || '').length < MIN_PASSWORD) e.pass = `Use at least ${MIN_PASSWORD} characters (a few words make a good password)`;
  if (b.pass !== b.confirm) e.confirm = 'The two passwords do not match';
  return e;
};

router.get('/forgot', asyncHandler(async (req, res) => show(res, 'forgot', { state: (await mailer.configured()) ? 'form' : 'unavailable', email: '' })));

router.post('/forgot', limiter, asyncHandler(async (req, res) => {
  if (!(await mailer.configured())) return show(res, 'forgot', { state: 'unavailable', email: '' });
  const email = String(req.body.email || '').trim().toLowerCase().slice(0, 160);
  const user = /^\S+@\S+\.\S+$/.test(email) ? await usersService.byEmail(email) : null;
  if (user && user.active !== false && !(await tokens.recentReset(user.id))) {
    const token = await tokens.issue({ type: 'reset', userId: user.id });
    const ctx = { name: user.name, firstName: user.name.split(' ')[0], email: user.email, company: site.name, website: env.siteUrl, resetUrl: `${env.siteUrl}/admin/reset/${token}`, expires: '60 minutes' };
    // not awaited, so the response takes the same time whether or not the address has an account
    mailer.sendTemplate('password-reset', user.email, ctx).then((r) => { if (!r.ok) logger.warn(`Password reset mail failed: ${r.reason}`); });
    await audit.record({ user, ip: req.ip, ua: req.get('user-agent') }, 'requested a password reset', 'users', user.id, user.email);
  }
  show(res, 'forgot', { state: 'sent', email });
}));

router.get('/reset/:token', asyncHandler(async (req, res) => {
  const rec = await tokens.find(req.params.token, 'reset');
  if (!rec) return show(res, 'link-invalid', {}, 410);
  show(res, 'reset', { token: req.params.token, errors: {}, min: MIN_PASSWORD });
}));

router.post('/reset/:token', limiter, asyncHandler(async (req, res) => {
  const rec = await tokens.find(req.params.token, 'reset');
  if (!rec) return show(res, 'link-invalid', {}, 410);
  const errors = passwordErrors(req.body);
  if (Object.keys(errors).length) return show(res, 'reset', { token: req.params.token, errors, min: MIN_PASSWORD }, 422);
  const user = await usersService.byId(rec.userId);
  if (!user || user.active === false) return show(res, 'link-invalid', {}, 410);
  await usersService.setPassword(user.id, req.body.pass);
  await tokens.consume(req.params.token);
  await audit.record({ user, ip: req.ip, ua: req.get('user-agent') }, 'reset password with an e-mailed link', 'users', user.id, user.email);
  res.redirect('/admin/login?done=reset');
}));

router.get('/register/:token', asyncHandler(async (req, res) => {
  const rec = await tokens.find(req.params.token, 'invite');
  if (!rec) return show(res, 'link-invalid', {}, 410);
  show(res, 'register', { token: req.params.token, invite: rec, errors: {}, values: {}, min: MIN_PASSWORD });
}));

router.post('/register/:token', limiter, asyncHandler(async (req, res) => {
  const rec = await tokens.find(req.params.token, 'invite');
  if (!rec) return show(res, 'link-invalid', {}, 410);
  const name = String(req.body.name || '').trim().slice(0, 80);
  const errors = passwordErrors(req.body);
  if (name.length < 2) errors.name = 'Please enter your name';
  if (!Object.keys(errors).length && (await usersService.byEmail(rec.email))) errors.name = 'An account with this email already exists. Sign in, or use "Forgot your password?".';
  if (Object.keys(errors).length) return show(res, 'register', { token: req.params.token, invite: rec, errors, values: { name }, min: MIN_PASSWORD }, 422);
  const created = await usersService.create({ name, email: rec.email, role: rec.role, pass: req.body.pass });
  await tokens.consume(req.params.token);
  await audit.record({ user: { id: created.id, name: created.name }, ip: req.ip, ua: req.get('user-agent') }, `registered with an invitation from ${rec.createdBy || 'an administrator'}`, 'users', created.id, created.email);
  res.redirect('/admin/login?done=registered');
}));

module.exports = router;
