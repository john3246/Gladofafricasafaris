/**
 * End-to-end test of one-time registration, password reset and the mail-server login screen.
 * Run against a THROWAWAY server started with SMTP_URL=json:
 *   TEST_PORT=3079 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/cms-auth-test.js
 */
require('dotenv').config();

const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
let fails = 0;
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const has = (h, s) => h.includes(s);

/** A browser: its own cookie jar. */
function browser() {
  let cookie = '';
  const req = async (path, opt = {}) => {
    const res = await fetch(B + path, { redirect: 'manual', ...opt, headers: { cookie, ...(opt.headers || {}) } });
    for (const c of res.headers.getSetCookie?.() || []) {
      const [kv] = c.split(';');
      const [k] = kv.split('=');
      cookie = cookie.split('; ').filter((x) => x && !x.startsWith(`${k}=`)).concat(kv).join('; ');
    }
    return res;
  };
  const text = async (p) => (await req(p)).text();
  const csrf = async (p) => ((await text(p)).match(/name="_csrf" value="([^"]+)"/) || [])[1];
  const post = (p, body) => req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body).toString() });
  const login = async (email, password) => post('/admin/login', { _csrf: await csrf('/admin/login'), email, password, next: '/admin' });
  return { req, text, csrf, post, login };
}

const linkOf = (html, kind) => (html.match(new RegExp(`value="(https?://[^"]*/admin/${kind}/[\\w-]+)"`)) || [])[1];
const pathOf = (url) => new URL(url).pathname;

(async () => {
  const admin = browser();
  ok('admin login', (await admin.login(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD)).status === 302);
  const acsrf = (await admin.text('/admin')).match(/data-csrf="([^"]+)"/)[1];

  const dash = await admin.text('/admin');
  ok('dashboard renders (and shows the email health check)', has(dash, 'Welcome back') && has(dash, 'Email alerts for new quote requests'));

  // --- login page and forgot-password page
  const anon = browser();
  ok('login page links to "Forgot your password?"', has(await anon.text('/admin/login'), 'href="/admin/forgot"'));
  const forgot = await anon.text('/admin/forgot');
  ok('forgot page shows the email form', has(forgot, 'Email me a reset link') && has(forgot, 'name="email"'));
  const fToken = await anon.csrf('/admin/forgot');
  let r = await anon.post('/admin/forgot', { _csrf: fToken, email: 'nobody-here@example.test' });
  const unknown = await r.text();
  r = await anon.post('/admin/forgot', { _csrf: fToken, email: process.env.ADMIN_EMAIL });
  const known = await r.text();
  ok('same answer for unknown and known emails (no account guessing)', has(unknown, 'If there is an account for') && has(known, 'If there is an account for') && !has(known, 'not found'));
  ok('forgot POST without CSRF token is refused', (await anon.post('/admin/forgot', { email: 'x@example.test' })).status === 403);

  // --- invitations
  r = await admin.post('/admin/users/invite', { _csrf: acsrf, email: 'invited.editor@example.test', role: 'editor', send: '1' });
  const inviteHtml = await r.text();
  const inviteUrl = linkOf(inviteHtml, 'register');
  ok('invitation shows a one-time link', r.status === 200 && !!inviteUrl, String(r.status));
  ok('invitation email was sent through the mail system', has(inviteHtml, 'The email was sent'));
  ok('pending invitation is listed', has(await admin.text('/admin/users'), 'invited.editor@example.test') && has(await admin.text('/admin/users'), 'Waiting to register'));
  r = await admin.post('/admin/users/invite', { _csrf: acsrf, email: process.env.ADMIN_EMAIL, role: 'editor' });
  ok('inviting an existing user is refused', r.status === 422 && has(await r.text(), 'already has an account'));
  r = await admin.post('/admin/users/invite', { _csrf: acsrf, email: 'not-an-email', role: 'editor' });
  ok('invalid invite address is refused', r.status === 422);

  // --- registering with the link
  const person = browser();
  const regPath = pathOf(inviteUrl);
  const regPage = await person.text(regPath);
  ok('registration page shows the invited email and role', has(regPage, 'invited.editor@example.test') && has(regPage, 'an editor'));
  const rc = await person.csrf(regPath);
  r = await person.post(regPath, { _csrf: rc, name: 'Invited Editor', pass: 'short', confirm: 'short' });
  ok('a short password is refused', r.status === 422 && has(await r.text(), 'at least 12'));
  r = await person.post(regPath, { _csrf: rc, name: 'Invited Editor', pass: 'a-good-password-123', confirm: 'a-different-one-456' });
  ok('mismatching passwords are refused', r.status === 422 && has(await r.text(), 'do not match'));
  r = await person.post(regPath, { _csrf: rc, name: '', pass: 'a-good-password-123', confirm: 'a-good-password-123' });
  ok('a missing name is refused', r.status === 422);
  r = await person.post(regPath, { _csrf: rc, name: 'Invited Editor', pass: 'a-good-password-123', confirm: 'a-good-password-123' });
  ok('registration succeeds and sends the person to sign in', r.status === 302 && r.headers.get('location') === '/admin/login?done=registered');
  ok('login page confirms the new account', has(await person.text('/admin/login?done=registered'), 'Your account is ready'));
  ok('the new account can sign in', (await person.login('invited.editor@example.test', 'a-good-password-123')).status === 302);
  ok('the new editor can open content but not user management', (await person.req('/admin/tours')).status === 200 && (await person.req('/admin/users')).status === 403 && (await person.req('/admin/mail')).status === 403);
  ok('the registration link works only once', (await anon.req(regPath)).status === 410);
  ok('the invitation is no longer pending', !has(await admin.text('/admin/users'), 'Waiting to register'));

  // --- cancelling an invitation
  r = await admin.post('/admin/users/invite', { _csrf: acsrf, email: 'cancelled@example.test', role: 'admin' });
  const cancelUrl = linkOf(await r.text(), 'register');
  const list = await admin.text('/admin/users');
  const inviteId = (list.match(/\/admin\/users\/invites\/([a-f0-9]{64})\/revoke/) || [])[1];
  r = await admin.post(`/admin/users/invites/${inviteId}/revoke`, { _csrf: acsrf });
  ok('an invitation can be cancelled', r.status === 302 && (await anon.req(pathOf(cancelUrl))).status === 410);
  ok('garbage and unknown tokens return 410', (await anon.req('/admin/register/not-a-real-token-not-a-real-token-123456')).status === 410 && (await anon.req('/admin/reset/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).status === 410);

  // --- password reset (admin creates the link; same page the emailed link opens)
  const uid = (await admin.text('/admin/users')).match(/href="\/admin\/users\/(u-[^"]+)"[^>]*>Invited Editor/)[1];
  ok('user page offers a reset link', has(await admin.text(`/admin/users/${uid}`), 'Create reset link'));
  r = await admin.post(`/admin/users/${uid}/reset-link`, { _csrf: acsrf, send: '1' });
  const resetHtml = await r.text();
  const resetUrl = linkOf(resetHtml, 'reset');
  ok('reset link is created and emailed', r.status === 200 && !!resetUrl && has(resetHtml, 'The email was sent'));
  const resetPath = pathOf(resetUrl);
  const rp = await anon.text(resetPath);
  ok('reset page asks for a new password', has(rp, 'Choose a new password'));
  const resetCsrf = await anon.csrf(resetPath);
  r = await anon.post(resetPath, { _csrf: resetCsrf, pass: 'too-short', confirm: 'too-short' });
  ok('reset refuses a short password', r.status === 422);
  r = await anon.post(resetPath, { _csrf: resetCsrf, pass: 'brand-new-password-77', confirm: 'brand-new-password-77' });
  ok('reset succeeds and returns to sign in', r.status === 302 && r.headers.get('location') === '/admin/login?done=reset');
  ok('old sessions of that user are signed out by the reset', (await person.req('/admin/tours')).status === 302);
  const fresh = browser();
  ok('the old password no longer works', (await fresh.login('invited.editor@example.test', 'a-good-password-123')).status === 401);
  ok('the new password works', (await fresh.login('invited.editor@example.test', 'brand-new-password-77')).status === 302 && (await fresh.req('/admin/tours')).status === 200);
  ok('the reset link works only once', (await anon.req(resetPath)).status === 410);
  const personForgot = browser();
  await personForgot.post('/admin/forgot', { _csrf: await personForgot.csrf('/admin/forgot'), email: 'invited.editor@example.test' });
  ok('"forgot password" for a real address does not crash', (await personForgot.req('/admin/forgot')).status === 200);

  // --- changing your own password signs out other browsers
  const second = browser();
  await second.login('invited.editor@example.test', 'brand-new-password-77');
  const profileCsrf = (await fresh.text('/admin/profile')).match(/name="_csrf" value="([^"]+)"/)[1];
  r = await fresh.post('/admin/profile', { _csrf: profileCsrf, name: 'Invited Editor', currentPass: 'brand-new-password-77', newPass: 'yet-another-password-88', confirmPass: 'yet-another-password-88' });
  ok('changing your own password keeps this browser signed in', r.status === 302 && (await fresh.req('/admin/tours')).status === 200);
  ok('...and signs out your other browsers', (await second.req('/admin/tours')).status === 302);

  // --- mail server login screen
  const mailPage = await admin.text('/admin/mail');
  ok('mail page has the mail server login form', has(mailPage, 'Mail server login') && has(mailPage, 'name="password"') && has(mailPage, 'Send a test email'));
  const SECRET = 'My-Mailbox-Password-9!';
  r = await admin.post('/admin/mail/server', { _csrf: acsrf, host: 'mail.example.test', port: '465', security: 'ssl', user: 'info@example.test', password: SECRET });
  const afterSave = await admin.text('/admin/mail');
  ok('mail login is saved', r.status === 302 && has(afterSave, 'value="mail.example.test"') && has(afterSave, 'saved here') && has(afterSave, 'info@example.test on mail.example.test:465'));
  ok('the password is never shown back', !has(afterSave, SECRET) && !has(afterSave, 'S3cret') && has(afterSave, 'saved, leave empty to keep'));
  ok('the password is not in the page cookies or settings backup', !has(await admin.text('/admin/backup/export.json'), SECRET) && !has(await admin.text('/admin/settings'), SECRET));
  r = await admin.post('/admin/mail/server', { _csrf: acsrf, host: 'bad host!', port: '465', security: 'ssl', user: 'x@example.test', password: 'x' });
  ok('an invalid server name is refused', r.status === 302 && has(await admin.text('/admin/mail'), 'Enter the mail server name'));
  r = await admin.post('/admin/mail/server', { _csrf: acsrf, host: 'mail.example.test', port: '99999', security: 'ssl', user: 'x@example.test', password: 'x' });
  ok('an invalid port is refused', has(await admin.text('/admin/mail'), 'The port must be'));
  r = await admin.post('/admin/mail/server', { _csrf: acsrf, host: 'smtp.other.test', port: '587', security: 'starttls', user: 'info@example.test', password: '' });
  ok('saving with an empty password keeps the old one', has(await admin.text('/admin/mail'), 'smtp.other.test') && has(await admin.text('/admin/mail'), 'STARTTLS') && has(await admin.text('/admin/mail'), 'saved, leave empty to keep'));
  ok('the audit log records it without the password', !has(await admin.text('/admin/audit'), SECRET) && has(await admin.text('/admin/audit'), 'saved the mail server login'));
  r = await admin.post('/admin/mail/server', { _csrf: acsrf, remove: '1' });
  ok('the saved login can be removed', r.status === 302 && !has(await admin.text('/admin/mail'), 'saved here'));
  ok('only administrators open the mail page', (await fresh.req('/admin/mail')).status === 403);

  // --- clean up
  await admin.post(`/admin/users/${uid}/delete`, { _csrf: acsrf });
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
