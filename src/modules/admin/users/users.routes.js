const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const users = require('../auth/users.service');
const audit = require('../lib/audit');
const { flash } = require('../lib/flash');
const tokens = require('../auth/tokens.service');
const mailer = require('../../../services/mailer');
const { env, site } = require('../../../config');

const render = (res, view, data) => res.render(`admin/views/users/${view}`, { active: 'users', ROLES: users.ROLES, ...data });
const check = (b, needPass) => {
  const e = {};
  if (!b.name?.trim()) e.name = 'Name is required';
  if (!/^\S+@\S+\.\S+$/.test(b.email || '')) e.email = 'Enter a valid email';
  if ((needPass || b.pass) && (b.pass || '').length < 10) e.pass = 'Use at least 10 characters';
  return e;
};

router.get('/', asyncHandler(async (req, res) => render(res, 'list', { pageTitle: 'Users & Roles', items: await users.list(), invites: await tokens.pendingInvites() })));

/** One-time registration: the administrator invites an email address; the person chooses their own name and password. */
router.get('/invite', asyncHandler(async (req, res) => render(res, 'invite', { pageTitle: 'Invite a user', values: { role: 'editor' }, errors: {}, mailOk: await mailer.configured() })));

router.post('/invite', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const role = users.ROLES.includes(req.body.role) ? req.body.role : 'editor';
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address';
  else if (await users.byEmail(email)) errors.email = 'This person already has an account. Use "Create reset link" on their user page instead.';
  const mailOk = await mailer.configured();
  if (Object.keys(errors).length) return render(res.status(422), 'invite', { pageTitle: 'Invite a user', values: { email, role }, errors, mailOk });
  const token = await tokens.issue({ type: 'invite', email, role, createdBy: req.user.name });
  const url = `${env.siteUrl}/admin/register/${token}`;
  let emailed = null;
  if (req.body.send === '1' && mailOk) {
    emailed = await mailer.sendTemplate('user-invite', email, { name: '', firstName: '', email, company: site.name, website: env.siteUrl, inviteUrl: url, role: role === 'admin' ? 'an administrator' : 'an editor', invitedBy: req.user.name, expires: '3 days' });
  }
  await audit.record(req, 'invited', 'users', email, `${email} as ${role}${emailed && emailed.ok ? ' (emailed)' : ''}`);
  render(res, 'link', { pageTitle: 'Invitation ready', heading: 'Invitation ready', who: email, url, lifetime: '3 days', emailed });
}));

router.post('/invites/:id/revoke', asyncHandler(async (req, res) => {
  await tokens.revoke(req.params.id);
  await audit.record(req, 'cancelled an invitation', 'users', req.params.id.slice(0, 8), 'invitation');
  flash(req, 'success', 'Invitation cancelled. Its link no longer works.');
  res.redirect('/admin/users');
}));

/** Creates a one-time password link for someone who cannot sign in (works even when e-mail is not set up). */
router.post('/:id/reset-link', asyncHandler(async (req, res, next) => {
  const u = await users.byId(req.params.id);
  if (!u) return next();
  const token = await tokens.issue({ type: 'reset', userId: u.id, createdBy: req.user.name });
  const url = `${env.siteUrl}/admin/reset/${token}`;
  let emailed = null;
  if (req.body.send === '1' && (await mailer.configured())) {
    emailed = await mailer.sendTemplate('password-reset', u.email, { name: u.name, firstName: u.name.split(' ')[0], email: u.email, company: site.name, website: env.siteUrl, resetUrl: url, expires: '60 minutes' });
  }
  await audit.record(req, 'created a password reset link', 'users', u.id, u.email);
  render(res, 'link', { pageTitle: 'Reset link ready', heading: 'Password reset link ready', who: `${u.name} (${u.email})`, url, lifetime: '60 minutes', emailed });
}));

router.get('/new', (req, res) => render(res, 'form', { pageTitle: 'New user', item: { role: 'editor', active: true }, errors: {}, isNew: true }));

router.post('/new', asyncHandler(async (req, res) => {
  const errors = check(req.body, true);
  if (!Object.keys(errors).length) {
    try {
      const u = await users.create(req.body);
      await audit.record(req, 'created', 'users', u.id, u.email);
      flash(req, 'success', `User ${u.email} created.`);
      return res.redirect('/admin/users');
    } catch (e) { errors.email = e.message; }
  }
  render(res.status(422), 'form', { pageTitle: 'New user', item: req.body, errors, isNew: true });
}));

router.get('/:id', asyncHandler(async (req, res, next) => {
  const u = await users.byId(req.params.id);
  if (!u) return next();
  render(res, 'form', { pageTitle: `Edit ${u.name}`, item: u, errors: {}, isNew: false });
}));

router.post('/:id', asyncHandler(async (req, res, next) => {
  const u = await users.byId(req.params.id);
  if (!u) return next();
  const errors = check(req.body, false);
  const self = u.id === req.user.id;
  if (!Object.keys(errors).length) {
    try {
      await users.update(u.id, { ...req.body, role: self ? 'admin' : req.body.role, active: self ? true : req.body.active === '1' });
      await audit.record(req, 'updated', 'users', u.id, req.body.email);
      flash(req, 'success', 'User saved.');
      return res.redirect('/admin/users');
    } catch (e) { errors.email = e.message; }
  }
  render(res.status(422), 'form', { pageTitle: `Edit ${u.name}`, item: { ...u, ...req.body }, errors, isNew: false });
}));

router.post('/:id/delete', asyncHandler(async (req, res) => {
  const u = await users.byId(req.params.id);
  if (!u || u.id === req.user.id) {
    flash(req, 'error', 'You cannot delete your own account.');
  } else {
    await users.remove(u.id);
    await audit.record(req, 'deleted', 'users', u.id, u.email);
    flash(req, 'success', 'User deleted.');
  }
  res.redirect('/admin/users');
}));

module.exports = router;
