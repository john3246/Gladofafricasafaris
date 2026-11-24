const nodemailer = require('nodemailer');
const { env, site } = require('../config');
const logger = require('../utils/logger');
const { getSettings } = require('./settings.service');
const templates = require('./emailTemplates');
const smtpConfig = require('./smtpConfig');

/**
 * Outgoing e-mail. The mail-server login comes from CMS > Email settings (password stored encrypted) or, as a fallback,
 * from the server's SMTP_URL. Sender name, addresses, copies and templates are edited in CMS > Email.
 * SMTP_URL=json keeps messages in memory instead of sending them (local testing).
 */
let cached = { sig: '', transport: null };
const outbox = []; // only filled in "json" test mode
const OPTIONS = { connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 };

/** The connection to use right now: the CMS login if one is saved, otherwise SMTP_URL, otherwise none. */
async function getTransport() {
  const cms = await smtpConfig.get();
  const sig = cms ? `cms:${JSON.stringify(cms)}` : env.smtpUrl ? `env:${env.smtpUrl}` : '';
  if (!sig) return null;
  if (cached.sig !== sig) {
    let transport;
    if (cms) transport = nodemailer.createTransport({ ...cms, ...OPTIONS });
    else if (env.smtpUrl === 'json') transport = nodemailer.createTransport({ jsonTransport: true });
    else transport = nodemailer.createTransport(env.smtpUrl, OPTIONS);
    cached = { sig, transport };
  }
  return cached.transport;
}

const configured = async () => Boolean(await getTransport());
const list = (v) => String(v || '').split(/[,;\n]/).map((s) => s.trim()).filter((s) => /^[^\s@]+@[^\s@]+$/.test(s));
const bareAddress = (s) => (/<([^>]+)>/.exec(s) || [])[1] || String(s || '').trim();

/** "Name <address>": the address must be one the mail account may send as (usually its own mailbox). */
async function fromHeader() {
  const s = await getSettings();
  const address = s.mailFromEmail || bareAddress(env.mailFrom) || site.email;
  const name = s.mailFromName || String(env.mailFrom || '').replace(/<.*$/, '').trim() || site.name;
  return { name, address };
}

/** What the CMS shows about the connection (never the password). */
async function status() {
  const cms = await smtpConfig.get();
  if (cms) return { configured: true, source: 'cms', host: cms.host, port: String(cms.port), secure: cms.secure, user: cms.auth.user };
  if (!env.smtpUrl) return { configured: false };
  if (env.smtpUrl === 'json') return { configured: true, test: true, source: 'server' };
  try {
    const u = new URL(env.smtpUrl);
    return { configured: true, source: 'server', host: u.hostname, port: u.port || (u.protocol === 'smtps:' ? '465' : '587'), secure: u.protocol === 'smtps:', user: decodeURIComponent(u.username) };
  } catch (_) {
    return { configured: true, source: 'server', invalid: true };
  }
}

/** Sends one message. Returns { ok, reason }. */
async function send({ to, subject, text, html, replyTo, bcc }) {
  const t = await getTransport();
  if (!t) return { ok: false, reason: 'E-mail is not set up yet. Enter the mail server login in CMS > Email settings, or use "Open in mail app".' };
  try {
    const from = await fromHeader();
    const info = await t.sendMail({ from: { name: from.name, address: from.address }, to, subject, text, html: html || templates.toHtml(text, subject), replyTo, bcc: bcc && bcc.length ? bcc : undefined });
    if (env.smtpUrl === 'json' && info.message) outbox.push(JSON.parse(info.message));
    return { ok: true };
  } catch (err) {
    logger.warn(`E-mail failed: ${err.message}`);
    return { ok: false, reason: err.message };
  }
}

/** Reply typed in the CMS inbox. */
async function sendMail({ to, subject, text, replyTo }) {
  const s = await getSettings();
  return send({ to, subject, text, replyTo: replyTo || s.mailReplyTo || s.notifyEmail || site.email, bcc: list(s.mailBcc) });
}

/** Renders a CMS template (e.g. "password-reset") for one recipient and sends it. */
async function sendTemplate(key, to, ctx) {
  const mail = await templates.render(key, ctx);
  if (!mail) return { ok: false, reason: 'That email template is switched off or missing.' };
  const s = await getSettings();
  return send({ ...mail, to, replyTo: s.mailReplyTo || s.notifyEmail || site.email });
}

/** New quote request: alert the team and (if switched on) acknowledge the guest, both from CMS templates. */
async function notifyNewInquiry(inq) {
  if (!(await getTransport())) return { team: false, guest: false };
  const s = await getSettings();
  const ctx = await templates.contextFor(inq);
  const result = { team: false, guest: false };
  if (s.notifyTeam !== false) {
    const mail = await templates.render('inquiry-team', ctx);
    const to = list(s.notifyEmail);
    if (mail) result.team = (await send({ ...mail, to: to.length ? to : [site.email], replyTo: inq.email, bcc: list(s.mailBcc) })).ok;
  }
  if (s.autoReplyGuest !== false) {
    const mail = await templates.render('inquiry-guest', ctx);
    if (mail) result.guest = (await send({ ...mail, to: inq.email, replyTo: s.mailReplyTo || s.notifyEmail || site.email })).ok;
  }
  return result;
}

/** Test button in CMS > Email: checks the login first, then sends a real message with a chosen template. */
async function sendTest(to, templateKey, agent) {
  const t = await getTransport();
  if (!t) return { ok: false, reason: 'No mail server login is saved yet.' };
  if (env.smtpUrl !== 'json' || (await smtpConfig.get())) {
    try { await t.verify(); } catch (err) { return { ok: false, reason: `Could not log in to the mail server: ${err.message}` }; }
  }
  const sample = { id: 'q-sample', name: 'Sample Guest', email: to, phone: '+1 555 0100', tour: '8-Day Great Migration Moments', tourSlug: '8-day-great-migration-moments',
    startDate: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10), endDate: new Date(Date.now() + 127 * 86400000).toISOString().slice(0, 10),
    travellers: 2, adults: 2, children: 0, styles: ['Luxury', 'Great Migration'], message: 'This is a sample request created by the test button.' };
  const extra = { resetUrl: `${env.siteUrl}/admin/reset/sample-link`, inviteUrl: `${env.siteUrl}/admin/register/sample-link`, role: 'editor', invitedBy: agent || 'An administrator', expires: '60 minutes' };
  const mail = await templates.render(templateKey || 'inquiry-guest', await templates.contextFor(sample, { agent, extra }), { force: true });
  if (!mail) return { ok: false, reason: 'That template does not exist.' };
  return send({ ...mail, subject: `[TEST] ${mail.subject}`, to });
}

module.exports = { notifyNewInquiry, sendMail, sendTemplate, send, sendTest, configured, status, fromHeader, outbox, list };
