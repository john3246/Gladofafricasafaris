/**
 * In-process test of e-mail templates and the mailer. Nothing is sent: SMTP_URL=json keeps messages in memory,
 * and the data lives in a throwaway folder. Run: node scripts/mail-unit-test.js
 */
const path = require('path');
const fs = require('fs');

const DATA = path.join(__dirname, '..', 'var', 'mail-unit-data');
fs.rmSync(DATA, { recursive: true, force: true });
Object.assign(process.env, { USE_DB: 'false', CMS_DATA_DIR: DATA, SMTP_URL: 'json', SITE_URL: 'https://example.test', NODE_ENV: 'test' });

const mailer = require('../src/services/mailer');
const templates = require('../src/services/emailTemplates');
const { saveSettings } = require('../src/services/settings.service');
const { emailtemplates } = require('../src/store/collections');

let fails = 0;
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const future = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const inquiry = {
  id: 'q-abc123xyz', name: 'Amélie <script>alert(1)</script> Durand', email: 'amelie@example.com', phone: '+33 1 23', tour: 'x', tourSlug: '8-day-great-migration-moments',
  startDate: future(90), endDate: future(97), flexible: true, adults: 2, children: 1, travellers: 3, styles: ['Luxury', 'Great Migration', 'Honeymoon & romance'], message: 'We love big cats.',
};

(async () => {
  // 1) placeholders come from the inquiry and the real tour
  const ctx = await templates.contextFor(inquiry, { agent: 'Neema' });
  ok('tour title comes from the tour slug', ctx.tour === '8-Day Great Migration Moments', ctx.tour);
  ok('dates include start, end and flexibility', /to .*\(flexible\)/.test(ctx.dates), ctx.dates);
  ok('tour length and links', ctx.duration === '8 days' && ctx.bookUrl === 'https://example.test/book/8-day-great-migration-moments' && ctx.tourUrl.endsWith('/tours/8-day-great-migration-moments'));
  ok('styles and travellers', ctx.styles === 'Luxury, Great Migration, Honeymoon & romance' && ctx.travellers === '3' && ctx.children === '1');
  ok('no tour falls back to a tailor-made safari', (await templates.contextFor({ name: 'A B', email: 'a@b.co' })).tour === 'a tailor-made safari');

  // 2) automatic mails: team + guest
  mailer.outbox.length = 0;
  await saveSettings({ notifyEmail: 'team@example.com, owner@example.com', mailBcc: 'archive@example.com', mailFromName: 'Glad Safaris', mailFromEmail: 'bookings@example.com', mailReplyTo: 'reply@example.com' });
  const sent = await mailer.notifyNewInquiry(inquiry);
  ok('both mails sent', sent.team && sent.guest && mailer.outbox.length === 2, JSON.stringify(sent));
  const [team, guest] = mailer.outbox;
  ok('team mail goes to every team address with BCC and guest as reply-to', team.to.length === 2 && team.bcc.length === 1 && team.replyTo[0].address === 'amelie@example.com', JSON.stringify([team.to, team.bcc, team.replyTo]));
  ok('team subject carries name and tour', team.subject.includes('8-Day Great Migration Moments') && team.subject.includes('Amélie'));
  ok('team mail lists dates, styles and CMS link', team.text.includes('Honeymoon & romance') && team.text.includes('/admin/inquiries/q-abc123xyz') && /\(flexible\)/.test(team.text));
  ok('guest mail goes to the guest from the configured sender', guest.to[0].address === 'amelie@example.com' && guest.from.address === 'bookings@example.com' && guest.from.name === 'Glad Safaris', JSON.stringify(guest.from));
  ok('guest reply-to is the configured address', guest.replyTo[0].address === 'reply@example.com');
  ok('guest mail greets by first name and shows the dates', guest.subject.startsWith('We received your safari request, Amélie') && guest.text.includes('Travel dates:'));
  ok('HTML is branded and escapes guest input', guest.html.includes('#123524') && !team.html.includes('<script>alert(1)') && team.html.includes('&lt;script&gt;'));
  ok('HTML has a plain-text twin', typeof guest.text === 'string' && guest.text.length > 50);

  // 3) switches and disabled templates
  mailer.outbox.length = 0;
  await saveSettings({ notifyTeam: false });
  await mailer.notifyNewInquiry(inquiry);
  ok('team alert can be switched off', mailer.outbox.length === 1 && mailer.outbox[0].to[0].address === 'amelie@example.com');
  mailer.outbox.length = 0;
  await saveSettings({ notifyTeam: true, autoReplyGuest: false });
  await mailer.notifyNewInquiry(inquiry);
  ok('guest auto-reply can be switched off', mailer.outbox.length === 1 && mailer.outbox[0].to.length === 2);
  mailer.outbox.length = 0;
  await saveSettings({ autoReplyGuest: true });
  const tpl = await emailtemplates.get('inquiry-guest');
  await emailtemplates.put({ ...tpl, enabled: false });
  await mailer.notifyNewInquiry(inquiry);
  ok('a disabled template is not sent', mailer.outbox.length === 1);
  await emailtemplates.put({ ...tpl, enabled: true, subject: 'Karibu {{firstName}}! {{tour}} on {{startDate}}' });
  mailer.outbox.length = 0;
  await mailer.notifyNewInquiry(inquiry);
  ok('an edited template is used immediately', mailer.outbox.some((m) => /^Karibu Amélie! 8-Day Great Migration Moments on \d/.test(m.subject)), mailer.outbox.map((m) => m.subject).join(' | '));

  // 4) quick replies and the test button
  const replies = await templates.repliesFor(inquiry, 'Neema');
  ok('six quick replies, filled in', replies.length === 6 && replies.every((r) => !r.body.includes('{{')), String(replies.length));
  ok('quick reply uses the agent and tour', replies.find((r) => r.key === 'reply-quote').body.includes('8-Day Great Migration Moments') && replies.find((r) => r.key === 'reply-thanks').body.includes('Neema'));
  mailer.outbox.length = 0;
  const test = await mailer.sendTest('me@example.com', 'inquiry-team', 'Neema');
  ok('test email sent with a TEST prefix', test.ok && mailer.outbox[0].subject.startsWith('[TEST]') && mailer.outbox[0].to[0].address === 'me@example.com');
  ok('reply from the inbox works', (await mailer.sendMail({ to: 'amelie@example.com', subject: 'Hi', text: 'Body' })).ok && mailer.outbox[mailer.outbox.length - 1].replyTo[0].address === 'reply@example.com');
  ok('status never exposes a password', JSON.stringify(await mailer.status()) === '{"configured":true,"test":true,"source":"server"}');

  fs.rmSync(DATA, { recursive: true, force: true });
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
