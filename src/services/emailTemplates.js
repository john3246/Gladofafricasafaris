const { emailtemplates, tours } = require('../store/collections');
const { env, site } = require('../config');
const seed = require('../data/emailtemplates.seed');

/** Placeholders an editor can use in a template, shown as help in the CMS. */
const PLACEHOLDERS = [
  ['name', 'full name'], ['firstName', 'first name'], ['email', 'guest email'], ['phone', 'guest phone'], ['tour', 'tour title, or "a tailor-made safari"'],
  ['tourUrl', 'link to the tour page'], ['bookUrl', 'link to the booking form for that tour'], ['dates', 'travel dates as the guest gave them'],
  ['startDate', 'first day'], ['endDate', 'last day'], ['duration', 'tour length'], ['travellers', 'total travellers'], ['adults', 'adults'],
  ['children', 'children'], ['styles', 'safari styles ticked'], ['message', 'guest message'], ['reference', 'request reference'],
  ['agent', 'name of the CMS user sending'], ['company', 'company name'], ['phoneCompany', 'company phone'], ['emailCompany', 'company email'],
  ['website', 'website address'], ['adminUrl', 'link to the request in the CMS'],
  ['resetUrl', 'password reset link (reset email)'], ['inviteUrl', 'registration link (invitation email)'], ['role', 'role being offered'],
  ['invitedBy', 'who sent the invitation'], ['expires', 'how long the link works'],
];

const fmtDate = (d) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '');

/** The values for every placeholder, built from a saved inquiry (and the tour it refers to). */
async function contextFor(inq, { agent = '', extra = {} } = {}) {
  const tour = inq.tourSlug ? (await tours.get(inq.tourSlug)) : null;
  const start = fmtDate(inq.startDate);
  const end = fmtDate(inq.endDate);
  let dates = inq.travelMonth || 'not given yet';
  if (start) dates = `${start}${end ? ` to ${end}` : ''}${inq.flexible ? ' (flexible)' : ''}`;
  const title = (tour && tour.title) || inq.tour || 'a tailor-made safari';
  return {
    name: inq.name || '', firstName: String(inq.name || '').split(' ')[0], email: inq.email || '', phone: inq.phone || 'not given',
    tour: title, tourUrl: tour ? `${env.siteUrl}/tours/${tour.slug}` : `${env.siteUrl}/tanzania-safaris`,
    bookUrl: tour ? `${env.siteUrl}/book/${tour.slug}` : `${env.siteUrl}/get-a-quote`,
    dates, startDate: start, endDate: end, duration: tour ? `${tour.days} day${tour.days > 1 ? 's' : ''}` : '',
    travellers: String(inq.travellers || 1), adults: String(inq.adults || inq.travellers || 1), children: String(inq.children || 0),
    styles: (inq.styles && inq.styles.length ? inq.styles.join(', ') : inq.tier && inq.tier !== 'not-sure' ? inq.tier : 'not specified'),
    message: inq.message || '(no message)', reference: String(inq.id || '').replace(/^q-/, '').toUpperCase().slice(-6),
    agent: agent || 'The team', company: site.name, phoneCompany: site.phone, emailCompany: site.email, website: env.siteUrl,
    adminUrl: `${env.siteUrl}/admin/inquiries/${inq.id}`,
    ...extra,
  };
}

const fill = (text, ctx) => String(text || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in ctx ? ctx[k] : ''));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Plain text -> branded HTML e-mail (paragraphs, line breaks and clickable links). */
function toHtml(text, subject) {
  const body = esc(text).split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, '<br>')}</p>`).join('')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#3e7b27">$1</a>');
  return `<!doctype html><html><body style="margin:0;background:#eef2ef;font-family:Arial,Helvetica,sans-serif;color:#1f2a22">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:#123524;color:#fff;padding:18px 24px;font-size:18px;font-weight:bold">${esc(site.name)}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.55"><h1 style="margin:0 0 16px;font-size:19px;color:#123524">${esc(subject)}</h1>${body}</td></tr>
<tr><td style="background:#f4f6f5;padding:14px 24px;font-size:12px;color:#5b665f">${esc(site.name)} &middot; ${esc(site.phone)} &middot; ${esc(site.email)}<br>${esc(env.siteUrl)}</td></tr>
</table></td></tr></table></body></html>`;
}

/** Loads a template and fills it. Returns null when the template is missing or switched off. */
async function render(key, ctx, { force = false } = {}) {
  const tpl = (await emailtemplates.get(key)) || seed.find((t) => t.key === key && t.system); // system mails still work if the record was lost
  if (!tpl || (tpl.enabled === false && !force)) return null;
  const subject = fill(tpl.subject, ctx).replace(/\s+/g, ' ').trim();
  const text = fill(tpl.body, ctx);
  return { subject, text, html: toHtml(text, subject), key };
}

/** All quick-reply templates for the inbox, already filled for one inquiry. */
async function repliesFor(inq, agent) {
  const ctx = await contextFor(inq, { agent });
  const list = (await emailtemplates.list()).filter((t) => t.kind === 'reply' && t.enabled !== false).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  return list.map((t) => ({ key: t.key, name: t.name.replace(/^Quick reply: /, ''), subject: fill(t.subject, ctx).trim(), body: fill(t.body, ctx) }));
}

/** Adds any built-in system template missing from the database (e.g. after an upgrade). Never touches edited ones. */
async function ensureSystemTemplates() {
  for (const t of seed.filter((x) => x.system)) if (!(await emailtemplates.get(t.key))) await emailtemplates.put({ ...t });
}

module.exports = { ensureSystemTemplates, PLACEHOLDERS, contextFor, fill, render, repliesFor, toHtml };
