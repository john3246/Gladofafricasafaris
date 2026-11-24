/**
 * End-to-end test of the quote / booking form and the e-mail screens in the CMS.
 * Run against a THROWAWAY server: TEST_PORT=3079 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/cms-form-test.js
 * Start that server with SMTP_URL=json to also exercise the "sending" paths without sending anything.
 */
require('dotenv').config();

const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
let cookie = '';
let fails = 0;
const req = async (path, opt = {}) => {
  const res = await fetch(B + path, { redirect: 'manual', ...opt, headers: { cookie, ...(opt.headers || {}) } });
  for (const c of res.headers.getSetCookie?.() || []) {
    const [kv] = c.split(';');
    const [k] = kv.split('=');
    cookie = cookie.split('; ').filter((x) => x && !x.startsWith(`${k}=`)).concat(kv).join('; ');
  }
  return res;
};
const post = (p, body) => req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: body instanceof URLSearchParams ? body.toString() : new URLSearchParams(body).toString() });
const text = async (p) => (await req(p)).text();
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const has = (h, s) => h.includes(s);
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const SLUG = '8-day-great-migration-moments';
const pretty = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

(async () => {
  // --- the public form
  let form = await text('/get-a-quote');
  ok('form has a tour selector with every tour', has(form, 'name="tourSlug"') && (form.match(/<option value="[a-z0-9-]+" data-days=/g) || []).length >= 40);
  ok('form has start date, end date, flexible, month buttons, adults and children', ['name="startDate"', 'name="endDate"', 'name="flexible"', 'name="travelMonth"', 'name="adults"', 'name="children"'].every((s) => has(form, s)));
  ok('booking form no longer asks for a safari style', !has(form, 'name="styles"') && !has(form, 'Safari styles that interest you'));
  ok('one calendar for the dates, with a plain-date fallback', has(form, 'data-range') && has(form, 'data-native') && has(form, '/vendor/flatpickr/flatpickr.min.js'));
  ok('twelve month buttons for guests without dates', (form.match(/name="travelMonth" value="[A-Z][a-z]+ 20\d\d"/g) || []).length === 12);
  ok('adults and children use steppers', (form.match(/data-stepper/g) || []).length === 2);
  ok('calendar assets are served', (await fetch(`${B}/vendor/flatpickr/flatpickr.min.js`)).status === 200 && (await fetch(`${B}/vendor/flatpickr/flatpickr.min.css`)).status === 200);
  ok('nothing preselected on the general form', !/<option value="[a-z0-9-]+"[^>]*selected/.test(form.split('name="tourSlug"')[1].split('</select>')[0]));
  ok('quote-form script is served', (await fetch(`${B}/js/quote-form.js`)).status === 200);

  // --- booking links carry the tour slug
  const tourPage = await text(`/tours/${SLUG}`);
  ok('tour page Book buttons use the slug', has(tourPage, `href="/book/${SLUG}"`) && !has(tourPage, 'get-a-quote?tour='));
  const book = await text(`/book/${SLUG}`);
  ok('/book/<slug> preselects that tour', new RegExp(`<option value="${SLUG}"[^>]*selected`).test(book));
  ok('/book/<slug> shows the tour summary and is noindex', has(book, 'Your chosen safari') && has(book, 'noindex') && has(book, '8-Day Great Migration Moments'));
  ok('unknown booking slug is 404', (await fetch(`${B}/book/no-such-tour`)).status === 404);
  ok('older ?tour=<slug> links preselect', new RegExp(`<option value="${SLUG}"[^>]*selected`).test(await text(`/get-a-quote?tour=${SLUG}`)));
  ok('older ?tour=<title> links still preselect', new RegExp(`<option value="${SLUG}"[^>]*selected`).test(await text('/get-a-quote?tour=8-Day%20Great%20Migration%20Moments')));

  // --- validation
  const base = { name: 'Form Tester', email: 'form.tester@example.com', phone: '+255 700', tourSlug: SLUG, adults: '2', children: '1', message: 'Hello' };
  const send = (extra) => { const p = new URLSearchParams(base); Object.entries(extra).forEach(([k, v]) => [].concat(v).forEach((x) => p.append(k, x))); return fetch(`${B}/inquiry`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: p.toString() }); };
  let r = await send({});
  ok('no dates and no month is refused', r.status === 422 && has(await r.text(), 'Choose your travel dates'), String(r.status));
  r = await send({ startDate: day(-3) });
  ok('a start date in the past is refused', r.status === 422 && has(await r.text(), 'in the past'));
  r = await send({ startDate: day(40), endDate: day(35) });
  ok('end before start is refused', r.status === 422 && has(await r.text(), 'before the start date'));
  r = await send({ startDate: 'not-a-date' });
  ok('a garbage date is refused', r.status === 422);
  r = await send({ startDate: day(40), adults: '0' });
  ok('zero adults is refused', r.status === 422);
  r = await send({ startDate: day(40), email: 'nope' });
  const bad = await r.text();
  ok('refused form keeps what the guest typed', r.status === 422 && has(bad, 'value="Form Tester"') && new RegExp(`<option value="${SLUG}"[^>]*selected`).test(bad));
  r = await send({ travelMonth: 'August 2030', styles: ['Luxury'] });
  ok('a month instead of dates is accepted', r.status === 200);

  // --- a complete request with several styles
  r = await send({ startDate: day(60), endDate: day(67), flexible: '1', styles: ['Luxury', 'Great Migration', 'Honeymoon & romance', 'Walking safari'] });
  const thanks = await r.text();
  ok('complete request accepted and summarised', r.status === 200 && has(thanks, 'Asante, Form Tester') && has(thanks, '8-Day Great Migration Moments') && has(thanks, day(60)));

  // --- the CMS inbox shows it
  let t = await text('/admin/login');
  let csrf = t.match(/name="_csrf" value="([^"]+)"/)[1];
  r = await post('/admin/login', { _csrf: csrf, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, next: '/admin' });
  ok('login', r.status === 302);
  csrf = (await text('/admin')).match(/data-csrf="([^"]+)"/)[1];
  const inbox = await text('/admin/inquiries');
  const id = [...inbox.matchAll(/href="\/admin\/inquiries\/(q-[^"]+)"/g)].map((m) => m[1])[0];
  const detail = await text(`/admin/inquiries/${id}`);
  ok('inquiry shows the tour link, dates, adults/children and every style', has(detail, `href="/tours/${SLUG}"`) && has(detail, pretty(day(60))) && has(detail, '(flexible)') && has(detail, '2 adults, 1 child') && has(detail, 'Walking safari') && has(detail, 'Honeymoon &amp; romance'));
  ok('quick replies come from the templates', has(detail, 'data-template="reply-quote"') && has(detail, 'data-template="reply-booking-confirmed"') && has(detail, 'Edit templates'));
  ok('replies are filled for this guest', has(detail, 'Hello Form') && !has(detail.split('id="templates"')[1].split('</script>')[0], '{{'));
  ok('inbox list shows dates and styles', has(inbox, day(60)) && has(inbox, 'Luxury, Great Migration'));
  ok('CSV export has the new columns', has(await text('/admin/inquiries/export.csv'), 'Start date') && has(await text('/admin/inquiries/export.csv'), 'Honeymoon & romance'));

  // --- email screens
  const mail = await text('/admin/mail');
  ok('Email settings page', has(mail, 'From name') && has(mail, 'Send a test email') && has(mail, 'Mail server login'));
  r = await post('/admin/mail', { _csrf: csrf, mailFromName: 'Glad Safaris', mailFromEmail: 'bookings@example.com', mailReplyTo: 'reply@example.com', notifyEmail: 'a@example.com, b@example.com', mailBcc: '', notifyTeam: '1', autoReplyGuest: '1' });
  ok('save email settings', r.status === 302);
  ok('email settings persisted', has(await text('/admin/mail'), 'value="Glad Safaris"') && has(await text('/admin/mail'), 'a@example.com, b@example.com'));
  r = await post('/admin/mail', { _csrf: csrf, mailFromEmail: 'not-an-address' });
  ok('invalid sender address refused', r.status === 302 && has(await text('/admin/mail'), 'is not a valid email address'));
  const tpls = await text('/admin/email-templates');
  ok('templates list: automatic and quick replies', has(tpls, 'New request: alert to your team') && has(tpls, 'Quick reply: Quote sent'));
  const edit = await text('/admin/email-templates/reply-thanks/edit');
  ok('template editor lists the placeholders', has(edit, '{{firstName}}') && has(edit, '{{bookUrl}}') && has(edit, '{{dates}}'));
  r = await post('/admin/email-templates/new', { _csrf: csrf, name: 'Quick reply: Payment details', kind: 'reply', enabled: '1', subject: 'Payment for {{tour}}', body: 'Hello {{firstName}}, pay here for {{dates}}.' });
  ok('add your own quick reply', r.status === 302, String(r.status));
  ok('new template appears as a button', has(await text(`/admin/inquiries/${id}`), 'Payment details'));
  r = await post('/admin/email-templates/reply-payment-details/delete', { _csrf: csrf });
  ok('delete the custom template', r.status === 302);
  r = await post('/admin/email-templates/inquiry-guest/delete', { _csrf: csrf });
  ok('the two automatic templates cannot be deleted', has(await text('/admin/email-templates'), 'New request: automatic reply to the guest'));
  const settingsForm = await text('/admin/settings');
  ok('quote-form styles are editable in Site Settings', has(settingsForm, 'name="tripStyles"') && has(settingsForm, 'Walking safari'));
  const without = await fetch(`${B}/admin/mail`, { redirect: 'manual' });
  ok('email pages need a login', without.status === 302);

  // --- test button + reply, only meaningful when the server runs with SMTP_URL=json
  r = await post('/admin/mail/test', { _csrf: csrf, to: 'tester@example.com', template: 'inquiry-guest' });
  const afterTest = await text('/admin/mail');
  ok('test email reports its outcome', r.status === 302 && (has(afterTest, 'Test email sent') || has(afterTest, 'SMTP_URL is not set')));
  r = await post(`/admin/inquiries/${id}/reply`, { _csrf: csrf, subject: 'Hello', body: 'Thanks for your request' });
  ok('reply from the inbox responds', r.status === 302);

  // --- clean up
  // only the requests this test created (matched by its own email address)
  for (const i of [...(await text('/admin/inquiries')).matchAll(/href="\/admin\/inquiries\/(q-[^"]+)"/g)].map((m) => m[1])) {
    if (has(await text(`/admin/inquiries/${i}`), 'form.tester@example.com')) await post(`/admin/inquiries/${i}/delete`, { _csrf: csrf });
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
