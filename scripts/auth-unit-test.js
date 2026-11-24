/**
 * In-process tests for the building blocks of password reset, invitations and the CMS-held mail login:
 * secret encryption, one-time tokens and the mail-server settings. Throwaway data, nothing is sent.
 * Run: node scripts/auth-unit-test.js
 */
const path = require('path');
const fs = require('fs');

const DATA = path.join(__dirname, '..', 'var', 'auth-unit-data');
fs.rmSync(DATA, { recursive: true, force: true });
Object.assign(process.env, { USE_DB: 'false', CMS_DATA_DIR: DATA, SMTP_URL: 'json', SITE_URL: 'https://example.test', NODE_ENV: 'test', SESSION_SECRET: 'unit-test-secret-0123456789-0123456789' });

const { encrypt, decrypt } = require('../src/utils/secretBox');
const smtpConfig = require('../src/services/smtpConfig');
const mailer = require('../src/services/mailer');
const tokens = require('../src/modules/admin/auth/tokens.service');
const users = require('../src/modules/admin/auth/users.service');
const { authtokens, secrets, users: userStore } = require('../src/store/collections');

let fails = 0;
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };

(async () => {
  // --- encryption
  const box = encrypt('p@ss word!');
  ok('secret round-trips', decrypt(box) === 'p@ss word!');
  ok('ciphertext hides the secret and differs each time', !box.includes('p@ss') && encrypt('p@ss word!') !== box);
  const parts = box.split('.');
  ok('tampered ciphertext is rejected', decrypt([parts[0], parts[1], parts[2], `${parts[3][0] === 'A' ? 'B' : 'A'}${parts[3].slice(1)}`].join('.')) === null);
  ok('garbage and empty values are rejected', decrypt('') === null && decrypt('nonsense') === null && decrypt(undefined) === null);

  // --- mail server login kept by the CMS
  ok('nothing saved at first', (await smtpConfig.get()) === null && (await smtpConfig.summary()) === null);
  await smtpConfig.save({ host: 'mail.example.test', port: 465, security: 'ssl', user: 'info@example.test', password: 'S3cret-Mailbox-Pass' });
  const raw = await secrets.get('smtp');
  ok('password is stored encrypted, not in clear text', raw && !JSON.stringify(raw).includes('S3cret-Mailbox-Pass') && raw.passEnc.startsWith('v1.'));
  const cfg = await smtpConfig.get();
  ok('connection options are rebuilt for the mailer', cfg.host === 'mail.example.test' && cfg.secure === true && cfg.auth.pass === 'S3cret-Mailbox-Pass' && cfg.requireTLS === false);
  ok('summary never contains the password', !JSON.stringify(await smtpConfig.summary()).includes('S3cret') && (await smtpConfig.summary()).hasPassword === true);
  await smtpConfig.save({ host: 'mail.example.test', port: 587, security: 'starttls', user: 'info@example.test', password: '' });
  const kept = await smtpConfig.get();
  ok('an empty password keeps the saved one; STARTTLS options', kept.auth.pass === 'S3cret-Mailbox-Pass' && kept.secure === false && kept.requireTLS === true && kept.port === 587);
  const st = await mailer.status();
  ok('mailer uses the CMS login and reports it without the password', st.source === 'cms' && st.host === 'mail.example.test' && st.user === 'info@example.test' && !JSON.stringify(st).includes('S3cret'));
  ok('mail counts as configured', (await mailer.configured()) === true);
  const [v, iv, tag, data] = encrypt('x').split('.'); // flip the first byte of the ciphertext: always detected
  await secrets.put({ ...(await secrets.get('smtp')), passEnc: [v, iv, tag, `${data[0] === 'A' ? 'B' : 'A'}${data.slice(1)}`].join('.') });
  ok('an unreadable saved password disables the login instead of crashing', (await smtpConfig.get()) === null && (await smtpConfig.summary()).readable === false);
  await smtpConfig.remove();
  ok('after removing, the server file setting applies again', (await mailer.status()).source === 'server' && (await mailer.configured()));

  // --- one-time tokens
  const u = await users.create({ name: 'Test Person', email: 'person@example.test', role: 'editor', pass: 'a-long-first-password' });
  const t1 = await tokens.issue({ type: 'reset', userId: u.id, createdBy: 'Admin' });
  ok('token is long and url-safe', /^[\w-]{43}$/.test(t1));
  const stored = (await authtokens.list())[0];
  ok('only a hash of the token is stored', !JSON.stringify(stored).includes(t1) && stored.id.length === 64);
  ok('valid token is found with the right type only', (await tokens.find(t1, 'reset')).userId === u.id && (await tokens.find(t1, 'invite')) === null);
  ok('malformed tokens are rejected', (await tokens.find('short', 'reset')) === null && (await tokens.find('../../etc/passwd', 'reset')) === null && (await tokens.find('', 'reset')) === null);
  ok('a recent reset is detected (anti mail-bombing)', (await tokens.recentReset(u.id)) === true && (await tokens.recentReset('nobody')) === false);
  const t2 = await tokens.issue({ type: 'reset', userId: u.id });
  ok('a new reset link cancels the previous one', (await tokens.find(t1, 'reset')) === null && (await tokens.find(t2, 'reset')) !== null);
  await tokens.consume(t2);
  ok('a used link stops working', (await tokens.find(t2, 'reset')) === null);
  const inv = await tokens.issue({ type: 'invite', email: 'new@example.test', role: 'admin', createdBy: 'Boss' });
  const rec = await tokens.find(inv, 'invite');
  ok('invitation carries email and role', rec.email === 'new@example.test' && rec.role === 'admin' && rec.expiresAt - rec.createdAt === tokens.TTL.invite);
  ok('pending invitations are listed', (await tokens.pendingInvites()).length === 1);
  const inv2 = await tokens.issue({ type: 'invite', email: 'new@example.test', role: 'editor' });
  ok('re-inviting the same address replaces the old link', (await tokens.find(inv, 'invite')) === null && (await tokens.pendingInvites()).length === 1 && (await tokens.find(inv2, 'invite')).role === 'editor');
  const old = await tokens.issue({ type: 'invite', email: 'old@example.test', role: 'editor' });
  const oldRec = await authtokens.get((await tokens.pendingInvites()).find((t) => t.email === 'old@example.test').id);
  await authtokens.put({ ...oldRec, expiresAt: Date.now() - 1000 });
  ok('an expired link is refused', (await tokens.find(old, 'invite')) === null);
  await tokens.revoke((await tokens.pendingInvites())[0].id);
  ok('an invitation can be cancelled', (await tokens.pendingInvites()).length === 0);

  // --- password change ends old sessions
  const before = (await userStore.get(u.id)).sv || 0;
  const after = await users.setPassword(u.id, 'another-long-password-1');
  ok('a new password raises the session version', after === before + 1);
  ok('the new password works, the old one does not', !!(await users.authenticate('person@example.test', 'another-long-password-1')) && (await users.authenticate('person@example.test', 'a-long-first-password')) === null);
  ok('admin-set password also raises the session version', (await (async () => { await users.update(u.id, { name: 'Test Person', email: 'person@example.test', role: 'editor', active: true, pass: 'third-long-password-12' }); return (await userStore.get(u.id)).sv; })()) === after + 1);

  fs.rmSync(DATA, { recursive: true, force: true });
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
