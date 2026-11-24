const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const users = require('../auth/users.service');
const password = require('../auth/password');
const { users: store } = require('../../../store/collections');
const audit = require('../lib/audit');
const { flash } = require('../lib/flash');

/** "My profile": every signed-in user can change their own name and password. */
router.get('/profile', (req, res) => {
  res.render('admin/views/users/profile', { active: 'profile', pageTitle: 'My profile', errors: {}, values: { name: req.user.name } });
});

router.post('/profile', asyncHandler(async (req, res) => {
  const errors = {};
  const name = String(req.body.name || '').trim();
  if (!name) errors.name = 'Your name is required';
  const wantsPass = Boolean(req.body.newPass);
  if (wantsPass) {
    if (!password.verify(req.body.currentPass || '', req.user.passHash)) errors.currentPass = 'Current password is incorrect';
    if (req.body.newPass.length < 10) errors.newPass = 'Use at least 10 characters';
    if (req.body.newPass !== req.body.confirmPass) errors.confirmPass = 'The two passwords do not match';
  }
  if (Object.keys(errors).length) return res.status(422).render('admin/views/users/profile', { active: 'profile', pageTitle: 'My profile', errors, values: { name } });
  const sv = (req.user.sv || 0) + (wantsPass ? 1 : 0);
  await store.put({ ...req.user, name, sv, ...(wantsPass ? { passHash: password.hash(req.body.newPass) } : {}) });
  req.session.sv = sv; // keep this browser signed in; every other session of the user ends
  await audit.record(req, wantsPass ? 'changed own password' : 'updated own profile', 'users', req.user.id, req.user.email);
  flash(req, 'success', wantsPass ? 'Profile and password updated.' : 'Profile updated.');
  res.redirect('/admin/profile');
}));

module.exports = router;
module.exports.users = users;
