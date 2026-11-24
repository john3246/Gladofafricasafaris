const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const { getSettings, saveSettings } = require('../../../services/settings.service');
const { emailtemplates } = require('../../../store/collections');
const mailer = require('../../../services/mailer');
const smtpConfig = require('../../../services/smtpConfig');
const audit = require('../lib/audit');
const { flash } = require('../lib/flash');

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** CMS > Email: sender, who is alerted, copies, on/off switches, connection status and a test button. */
router.get('/mail', asyncHandler(async (req, res) => {
  const [s, templates] = await Promise.all([getSettings(), emailtemplates.list()]);
  const from = await mailer.fromHeader();
  res.render('admin/views/settings/mail', { active: 'mail', pageTitle: 'Email', s, smtp: await mailer.status(), server: await smtpConfig.summary(), from, templates, siteEmail: require('../../../config').site.email });
}));

router.post('/mail', asyncHandler(async (req, res) => {
  const b = req.body;
  const bad = [b.mailFromEmail, b.mailReplyTo].filter((x) => x && !isEmail(String(x).trim()));
  const lists = [...mailer.list(b.notifyEmail), ...mailer.list(b.mailBcc)];
  if (bad.length) { flash(req, 'error', `"${bad[0]}" is not a valid email address.`); return res.redirect('/admin/mail'); }
  await saveSettings({
    mailFromName: String(b.mailFromName || '').trim().slice(0, 80),
    mailFromEmail: String(b.mailFromEmail || '').trim().toLowerCase(),
    mailReplyTo: String(b.mailReplyTo || '').trim().toLowerCase(),
    notifyEmail: mailer.list(b.notifyEmail).join(', '),
    mailBcc: mailer.list(b.mailBcc).join(', '),
    notifyTeam: b.notifyTeam === '1',
    autoReplyGuest: b.autoReplyGuest === '1',
  });
  await audit.record(req, 'updated', 'settings', 'mail', `Email settings (${lists.length} addresses)`);
  flash(req, 'success', 'Email settings saved.');
  res.redirect('/admin/mail');
}));

/** Mail-server login typed into the CMS. The password is stored encrypted and is never shown again. */
router.post('/mail/server', asyncHandler(async (req, res) => {
  const b = req.body;
  if (b.remove === '1') {
    await smtpConfig.remove();
    await audit.record(req, 'removed the mail server login', 'settings', 'mail', 'Email settings');
    flash(req, 'success', 'The saved mail server login was removed.');
    return res.redirect('/admin/mail');
  }
  const host = String(b.host || '').trim().toLowerCase();
  const port = Number(b.port) || 465;
  const security = b.security === 'starttls' ? 'starttls' : 'ssl';
  const user = String(b.user || '').trim();
  const password = String(b.password || '');
  const saved = await smtpConfig.summary();
  let problem = '';
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(host)) problem = 'Enter the mail server name, for example mail.yourdomain.com.';
  else if (port < 1 || port > 65535) problem = 'The port must be a number such as 465 or 587.';
  else if (!user) problem = 'Enter the mailbox login (usually the full email address).';
  else if (!password && !(saved && saved.hasPassword)) problem = 'Enter the mailbox password.';
  if (problem) { flash(req, 'error', problem); return res.redirect('/admin/mail'); }
  await smtpConfig.save({ host, port, security, user, password });
  await audit.record(req, password ? 'saved the mail server login (new password)' : 'saved the mail server login', 'settings', 'mail', `${user} @ ${host}:${port}`);
  flash(req, 'success', 'Mail server login saved. Use "Send a test email" to check it.');
  res.redirect('/admin/mail');
}));

router.post('/mail/test', asyncHandler(async (req, res) => {
  const to = String(req.body.to || '').trim();
  if (!isEmail(to)) { flash(req, 'error', 'Enter the address to send the test to.'); return res.redirect('/admin/mail'); }
  const result = await mailer.sendTest(to, String(req.body.template || 'inquiry-guest'), req.user.name);
  await audit.record(req, 'sent test email', 'settings', 'mail', result.ok ? `to ${to}` : `failed: ${result.reason}`);
  flash(req, result.ok ? 'success' : 'error', result.ok ? `Test email sent to ${to}. Check the inbox (and spam).` : `Test failed: ${result.reason}`);
  res.redirect('/admin/mail');
}));

module.exports = router;
