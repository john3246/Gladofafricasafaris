/**
 * End-to-end smoke test for the CMS against a RUNNING server.
 * Usage: PORT=3000 node scripts/cms-smoke-test.js   (reads ADMIN_EMAIL / ADMIN_PASSWORD from .env)
 * It creates and deletes its own test content and restores the settings it touches.
 */
require('dotenv').config();

const B = `http://localhost:${process.env.TEST_PORT || process.env.PORT || 3000}`;
let cookie = '';
let fails = 0;

const jar = (res) => {
  for (const c of res.headers.getSetCookie?.() || []) {
    const [kv] = c.split(';');
    const [k] = kv.split('=');
    cookie = cookie.split('; ').filter((x) => x && !x.startsWith(`${k}=`)).concat(kv).join('; ');
  }
};
const req = async (path, opt = {}) => {
  const res = await fetch(B + path, { redirect: 'manual', ...opt, headers: { cookie, ...(opt.headers || {}) } });
  jar(res);
  return res;
};
const form = (o) => new URLSearchParams(o).toString();
const post = (p, body) => req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: typeof body === 'string' ? body : form(body) });
const csrfOf = async (p) => {
  const t = await (await req(p)).text();
  return (t.match(/name="_csrf" value="([^"]+)"/) || t.match(/data-csrf="([^"]+)"/) || [])[1];
};
const ok = (name, cond, info = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`);
  if (!cond) fails += 1;
};

const DEFAULT_SETTINGS = {
  phone: '+255-695-108-009', email: 'info@gladofafricasafari.com', whatsapp: '', street: '402 Sakina', city: 'Arusha',
  facebook: 'https://www.facebook.com/gladofafricasafari', instagram: '', tiktok: '', youtube: '', x: '',
  heroLine1: 'Tanzania Safaris,', heroLine2: 'Beyond the Ordinary', heroImage: '/images/hero.webp', notifyEmail: '',
  heroText: "Venture deep into the Serengeti, witness the Great Migration, and experience Africa's untamed wilderness with expert guides, handpicked camps, and journeys crafted for lasting memories.",
  footerText: 'We offer Kilimanjaro treks, wildlife safaris, and Zanzibar beach holidays in Tanzania with a dedicated team committed to quality service and safety.',
};

(async () => {
  let r = await req('/admin');
  ok('unauthenticated /admin redirects to login', r.status === 302 && r.headers.get('location').startsWith('/admin/login'));
  let csrf = await csrfOf('/admin/login');
  r = await post('/admin/login', { _csrf: csrf, email: process.env.ADMIN_EMAIL, password: 'wrong-password-xx', next: '/admin' });
  ok('bad password rejected', r.status === 401);
  r = await post('/admin/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  ok('login without CSRF token blocked', r.status === 403);
  csrf = await csrfOf('/admin/login');
  r = await post('/admin/login', { _csrf: csrf, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, next: '/admin' });
  ok('login succeeds', r.status === 302 && r.headers.get('location') === '/admin', r.status);
  csrf = await csrfOf('/admin');

  const screens = ['/admin', '/admin/tours', '/admin/tours/new', '/admin/destinations', '/admin/blog', '/admin/faqs', '/admin/reviews', '/admin/pages',
    '/admin/pages/about/edit', '/admin/media', '/admin/media?tab=site', '/admin/media/json', '/admin/inquiries', '/admin/customers', '/admin/users',
    '/admin/users/new', '/admin/audit', '/admin/seo', '/admin/settings', '/admin/menus', '/admin/search?q=serengeti',
    '/admin/tours/8-day-great-migration-moments/edit', '/admin/destinations/serengeti-national-park/edit', '/admin/blog/tanzania-safari-cost/edit',
    '/admin/tours?filter=luxury&q=fly'];
  for (const p of screens) { r = await req(p); ok(`GET ${p}`, r.status === 200, r.status); }

  // Tour lifecycle
  const slug = 'cms-test-tour';
  const tour = {
    _csrf: csrf, title: 'CMS Test Safari', slug, tier: 'midrange', style: 'Private', priceFrom: '1999', tags: 'migration', image: '/images/hero.webp',
    gallery: '/images/hero.webp', summary: '', description: 'First paragraph about the test safari.\n\nSecond paragraph.', highlights: 'Lions\nElephants',
    'itinerary[0][title]': 'Arrive', 'itinerary[0][text]': 'Meet the team.', 'itinerary[0][accommodation]': 'Test Lodge',
    'itinerary[1][title]': 'Safari day', 'itinerary[1][text]': 'Game drive.', includes: 'Park fees', excludes: 'Flights',
    destinations: 'serengeti-national-park', status: 'published',
  };
  r = await post('/admin/tours/new', tour);
  ok('create tour', r.status === 302, `${r.status}`);
  r = await req(`/tours/${slug}`);
  let html = await r.text();
  ok('new tour live on public site', r.status === 200 && html.includes('CMS Test Safari') && html.includes('Test Lodge') && html.includes('1,999'), `${r.status}`);
  html = await (await req('/tanzania-safaris/migration')).text();
  ok('new tour listed in migration category', html.includes('CMS Test Safari'));
  html = await (await req('/sitemap.xml')).text();
  ok('new tour in sitemap', html.includes(`/tours/${slug}`));
  r = await post('/admin/tours/new', tour);
  ok('duplicate slug rejected', r.status === 422);
  r = await post(`/admin/tours/${slug}`, { ...tour, title: 'CMS Test Safari EDITED', priceFrom: '2500' });
  ok('edit tour', r.status === 302);
  html = await (await req(`/tours/${slug}`)).text();
  ok('edit visible publicly', html.includes('EDITED') && html.includes('2,500'));
  await post(`/admin/tours/${slug}/toggle`, { _csrf: csrf });
  r = await req(`/tours/${slug}`);
  ok('draft hidden from public (404)', r.status === 404, `${r.status}`);
  html = await (await req(`/admin/tours/${slug}/history`)).text();
  ok('version history recorded', html.includes('CMS Test Safari'));
  await post(`/admin/tours/${slug}/delete`, { _csrf: csrf });
  r = await req(`/tours/${slug}`);
  ok('deleted tour gone', r.status === 404);
  html = await (await req('/admin/audit')).text();
  ok('audit log lists deleted item as restorable', html.includes('Restore as draft') && html.includes('CMS Test Safari'));
  r = await post('/admin/tours/new', { _csrf: csrf, title: '', slug: 'Bad Slug!' });
  ok('validation errors returned (422)', r.status === 422);

  // Blog, FAQ, review
  r = await post('/admin/blog/new', { _csrf: csrf, title: 'CMS Test Post', slug: 'cms-test-post', category: 'Planning', published: '2026-10-01', image: '/images/hero.webp', excerpt: 'Excerpt text', content: '<h2>Heading</h2><p>Body paragraph.</p>', status: 'published' });
  ok('create blog post', r.status === 302);
  html = await (await req('/blog/cms-test-post')).text();
  ok('blog post public', html.includes('Body paragraph.'));
  await post('/admin/blog/cms-test-post/delete', { _csrf: csrf });
  r = await post('/admin/faqs/new', { _csrf: csrf, q: 'Is the CMS test question live?', a: 'Yes it is.', group: 'General', status: 'published' });
  ok('create FAQ', r.status === 302);
  html = await (await req('/faqs')).text();
  ok('FAQ on public page', html.includes('Is the CMS test question live?'));
  await post(r.headers.get('location').replace('/edit', '/delete'), { _csrf: csrf });
  r = await post('/admin/reviews/new', { _csrf: csrf, name: 'Test Guest', text: 'Wonderful trip, truly.', rating: '5', status: 'published' });
  ok('create review', r.status === 302);
  html = await (await req('/about-us')).text();
  ok('review on public About page', html.includes('Wonderful trip, truly.'));
  await post(r.headers.get('location').replace('/edit', '/delete'), { _csrf: csrf });

  // Pages and settings
  r = await post('/admin/pages/terms', { _csrf: csrf, title: 'Terms & Conditions', subtitle: '', body: '<p>Edited terms body.</p>', metaTitle: 'Terms', metaDescription: 'Terms desc', noindex: '0', status: 'published' });
  ok('edit page', r.status === 302);
  html = await (await req('/terms-and-conditions')).text();
  ok('page edit public', html.includes('Edited terms body.'));
  { // put the original page back from its revision history so the test leaves real content untouched
    const h = await (await req('/admin/pages/terms/history')).text();
    const back = (h.match(/action="(\/admin\/pages\/terms\/restore\/[^"]+)"/) || [])[1];
    r = back ? await post(back, { _csrf: csrf }) : { status: 0 };
    ok('terms page restored from history', r.status === 302, `${r.status}`);
  }
  const test = { ...DEFAULT_SETTINGS, phone: '+255 700 000 111', email: 'hello@example.com', instagram: 'https://instagram.com/glad', heroLine1: 'TEST HERO LINE,', heroLine2: 'Changed in the CMS', footerText: 'Footer from CMS.' };
  r = await post('/admin/settings', { _csrf: csrf, ...test });
  ok('save settings', r.status === 302, `${r.status}`);
  html = await (await req('/')).text();
  ok('settings reflected on home (hero, phone, footer, instagram)', html.includes('TEST HERO LINE,') && html.includes('+255 700 000 111') && html.includes('Footer from CMS.') && html.includes('Instagram'));
  r = await post('/admin/menus', { _csrf: csrf, topLinks: 'Journal | /blog\nContact | /contact-us', footerLinks: 'Terms | /terms-and-conditions' });
  ok('save menus', r.status === 302);
  html = await (await req('/')).text();
  ok('menus reflected', html.includes('Journal'));
  await post('/admin/settings', { _csrf: csrf, ...DEFAULT_SETTINGS });
  await post('/admin/menus', { _csrf: csrf, topLinks: 'Blog | /blog\nAbout Us | /about-us\nFAQs | /faqs', footerLinks: 'Terms And Conditions | /terms-and-conditions\nPrivacy & Policy | /privacy-policy\nContact Channels | /contact-us\nAbout Us | /about-us\nTravel Blog & Tips | /blog\nGet a Quote | /get-a-quote' });

  // Public quote form -> admin inbox
  r = await fetch(`${B}/inquiry`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ travelMonth: 'August 2030', name: 'Cms Tester', email: 'cms.tester@example.com', tour: '12-Day Ultimate Tanzania Trip', message: 'Testing the inbox', travellers: '2', tier: 'midrange' }) });
  ok('public quote form accepted', r.status === 200);
  html = await (await req('/admin/inquiries')).text();
  const m = html.match(/href="\/admin\/inquiries\/(q-[^"]+)"/);
  ok('inquiry appears in admin inbox', !!m);
  const id = m && m[1];
  r = await post(`/admin/inquiries/${id}/status`, { _csrf: csrf, status: 'replied' });
  ok('change inquiry status', r.status === 302);
  await post(`/admin/inquiries/${id}/note`, { _csrf: csrf, note: 'Called the guest.' });
  html = await (await req(`/admin/inquiries/${id}`)).text();
  ok('note saved', html.includes('Called the guest.'));
  html = await (await req('/admin/inquiries/export.csv')).text();
  ok('CSV export', html.includes('cms.tester@example.com'));
  html = await (await req('/admin/customers')).text();
  ok('customer listed', html.includes('cms.tester@example.com'));
  html = await (await req('/admin')).text();
  ok('dashboard shows inquiry', html.includes('Cms Tester'));
  await post(`/admin/inquiries/${id}/delete`, { _csrf: csrf });

  // Media upload (1x1 PNG -> WebP)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const fd = new FormData();
  fd.append('files', new Blob([png], { type: 'image/png' }), 'pixel.png');
  r = await fetch(`${B}/admin/media/upload?_csrf=${csrf}`, { method: 'POST', headers: { cookie, 'x-requested-with': 'fetch' }, body: fd });
  const up = await r.json();
  ok('upload image', up.saved && up.saved.length === 1, JSON.stringify(up));
  if (up.saved?.[0]) {
    r = await fetch(B + up.saved[0].url);
    ok('uploaded image served publicly', r.status === 200 && r.headers.get('content-type') === 'image/webp');
    await post(`/admin/media/${up.saved[0].id}/delete`, { _csrf: csrf });
    r = await fetch(B + up.saved[0].url);
    ok('deleted image gone', r.status === 404);
  }

  // --- New screens
  for (const p of ['/admin/analytics', '/admin/analytics?days=90', '/admin/bookings', '/admin/bookings/new', '/admin/redirects', '/admin/subscribers', '/admin/backup', '/admin/profile',
    '/admin/search/json?q=serengeti', '/admin/tours?sort=2&dir=desc', '/admin/tours/export.csv', '/admin/redirects/export.csv']) {
    r = await req(p); ok(`GET ${p}`, r.status === 200, `${r.status}`);
  }

  // --- Bookings (created from an inquiry) + dashboard numbers
  await fetch(`${B}/inquiry`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ travelMonth: 'August 2030', name: 'Booking Tester', email: 'booking.tester@example.com', tour: '8-Day Great Migration Moments', message: 'Book me', travellers: '3', tier: 'midrange' }) });
  html = await (await req('/admin/inquiries?q=booking.tester')).text();
  const qid = (html.match(/href="\/admin\/inquiries\/(q-[^"]+)"/) || [])[1];
  await post(`/admin/inquiries/${qid}/details`, { _csrf: csrf, value: '7200', assignee: '' });
  html = await (await req(`/admin/bookings/new?inquiry=${qid}`)).text();
  ok('booking form pre-filled from inquiry', html.includes('Booking Tester') && html.includes('booking.tester@example.com') && html.includes('7200'));
  r = await post('/admin/bookings/new', { _csrf: csrf, customerName: 'Booking Tester', email: 'booking.tester@example.com', phone: '', inquiryId: qid, tour: '8-Day Great Migration Moments', travelDate: '2030-07-20', travellers: '3', notes: '', total: '7200', paid: '1000', status: 'confirmed' });
  ok('create booking (auto reference)', r.status === 302 && /BK-10\d\d/.test(r.headers.get('location')), r.headers.get('location'));
  const bref = (r.headers.get('location').match(/(BK-\d+)/) || [])[1];
  r = await post('/admin/bookings/new', { _csrf: csrf, customerName: 'X', email: 'x@example.com', travelDate: '2030-01-01', total: '100', paid: '500', status: 'pending' });
  ok('paid > total rejected', r.status === 422);
  html = await (await req('/admin')).text();
  ok('dashboard shows booking, revenue and upcoming departure', html.includes(bref) && html.includes('$1,000') && html.includes('Upcoming departures'));
  html = await (await req(`/admin/inquiries/${qid}`)).text();
  ok('inquiry links to its booking', html.includes(bref));
  r = await post(`/admin/bookings/${bref}/delete`, { _csrf: csrf });
  await post(`/admin/inquiries/${qid}/delete`, { _csrf: csrf });

  // --- Bulk actions + CSV + sorting (on a tour this test creates, never on real content)
  const t1 = 'cms-bulk-test-tour';
  r = await post('/admin/tours/new', { _csrf: csrf, title: 'CMS Bulk Test Tour', slug: t1, tier: 'midrange', priceFrom: '1000', image: '/images/hero.webp', status: 'published' });
  ok('create bulk-test tour', r.status === 302, `${r.status}`);
  r = await post('/admin/tours/bulk', { _csrf: csrf, action: 'unpublish', keys: t1 });
  r = await req(`/tours/${t1}`); ok('bulk unpublish hides tour', r.status === 404);
  r = await post('/admin/tours/bulk', { _csrf: csrf, action: 'publish', keys: t1 });
  r = await req(`/tours/${t1}`); ok('bulk publish restores tour', r.status === 200);
  html = await (await req(`/admin/tours/${t1}/edit`)).text(); const before = Number((html.match(/name="priceFrom"[^>]*value="(\d+)"/) || [])[1]);
  await post('/admin/tours/bulk', { _csrf: csrf, action: 'price', percent: '10', keys: t1 });
  html = await (await req(`/admin/tours/${t1}/edit`)).text(); const after = Number((html.match(/name="priceFrom"[^>]*value="(\d+)"/) || [])[1]);
  ok('bulk price +10%', after === Math.round((before * 1.1) / 10) * 10, `${before} -> ${after}`);
  await post('/admin/tours/bulk', { _csrf: csrf, action: 'price', percent: '-9.09090909', keys: t1 });
  html = await (await req(`/admin/tours/${t1}/edit`)).text(); await post(`/admin/tours/${t1}`, { _csrf: csrf, ...Object.fromEntries([['title', 'CMS Bulk Test Tour'], ['tier', 'midrange'], ['priceFrom', String(before)], ['image', '/images/hero.webp'], ['status', 'published']]) });
  html = await (await req('/admin/tours/export.csv')).text(); ok('tours CSV export', html.includes('Great Migration Moments') && html.includes('Price from'));
  await post(`/admin/tours/${t1}/delete`, { _csrf: csrf });
  html = await (await req('/admin/tours?sort=2&dir=desc')).text(); ok('sortable list renders', html.includes('▼'));

  // --- Redirects, 404 tracking, analytics
  r = await fetch(`${B}/product/8-day-great-migration-moments/`, { redirect: 'manual' }); ok('seeded old WordPress URL redirects (301)', r.status === 301 && r.headers.get('location') === '/tours/8-day-great-migration-moments', `${r.status} ${r.headers.get('location')}`);
  r = await post('/admin/redirects/new', { _csrf: csrf, from: 'Old-Test-Page/', to: '/about-us', code: '301', enabled: '1', note: 'test' }); ok('create redirect', r.status === 302);
  r = await fetch(`${B}/old-test-page`, { redirect: 'manual' }); ok('custom redirect works', r.status === 301 && r.headers.get('location') === '/about-us');
  r = await post('/admin/redirects/new', { _csrf: csrf, from: '/same', to: '/same', code: '301', enabled: '1' }); ok('self-redirect rejected', r.status === 422);
  await fetch(`${B}/this-page-does-not-exist-xyz`);
  html = await (await req('/admin/analytics')).text(); ok('404 listed under broken links', html.includes('/this-page-does-not-exist-xyz'));
  ok('analytics counted page views', /Page views/.test(html) && !/<p class="text-2xl font-bold">0<\/p>/.test(html.split('Visitors')[0]));
  await post('/admin/analytics/404/dismiss', { _csrf: csrf, path: '/this-page-does-not-exist-xyz' });
  html = await (await req('/admin/redirects?q=old-test')).text(); const rid = (html.match(/\/admin\/redirects\/(rd-[^/]+)\/edit/) || [])[1]; if (rid) await post(`/admin/redirects/${rid}/delete`, { _csrf: csrf });

  // --- Newsletter + subscribers
  r = await fetch(`${B}/subscribe`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ email: 'News.Letter@Example.com' }) }); ok('newsletter sign-up', r.status === 200);
  r = await fetch(`${B}/subscribe`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ email: 'not-an-email' }) }); ok('invalid newsletter email rejected', r.status === 422);
  html = await (await req('/admin/subscribers')).text(); ok('subscriber in admin (lower-cased)', html.includes('news.letter@example.com'));
  await post('/admin/subscribers/bulk', { _csrf: csrf, action: 'delete', keys: 'news.letter@example.com' });

  // --- Maintenance mode, announcement bar, indexing, GA
  const base = { ...DEFAULT_SETTINGS };
  await post('/admin/settings', { _csrf: csrf, ...base, maintenance: '1', announceOn: '1', announceText: 'Test announcement', gaId: 'G-TEST12345', noindex: '1' });
  r = await fetch(`${B}/`); ok('maintenance mode shows 503 to visitors', r.status === 503);
  r = await req('/'); html = await r.text(); ok('signed-in user still sees the site', r.status === 200 && html.includes('Test announcement') && html.includes('G-TEST12345') && html.includes('noindex'));
  html = await (await req('/robots.txt')).text(); ok('robots honours noindex setting', html.includes('Disallow: /'));
  await post('/admin/settings', { _csrf: csrf, ...base });
  r = await fetch(`${B}/`); ok('maintenance mode switched off', r.status === 200);

  // --- Backup, profile, inquiry reply fallback
  html = await (await req('/admin/backup/export.json')).text(); const bk = JSON.parse(html); ok('backup export is valid JSON with collections', bk.app === 'glad-of-africa-cms' && bk.collections.tours.length > 40 && !JSON.stringify(bk).includes('passHash'));
  const fd2 = new FormData(); fd2.append('file', new Blob([html], { type: 'application/json' }), 'b.json'); fd2.append('only', 'faqs');
  r = await fetch(`${B}/admin/backup/import?_csrf=${csrf}`, { method: 'POST', headers: { cookie }, body: fd2, redirect: 'manual' }); ok('backup restore (faqs only)', r.status === 302);
  r = await post('/admin/profile', { _csrf: csrf, name: 'Administrator', currentPass: '', newPass: 'short', confirmPass: 'short' }); ok('profile: weak new password rejected', r.status === 422);
  await fetch(`${B}/inquiry`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ travelMonth: 'August 2030', name: 'Reply Tester', email: 'reply.tester@example.com', tour: 'x', message: 'hi', travellers: '1', tier: 'budget' }) });
  html = await (await req('/admin/inquiries?q=reply.tester')).text(); const rq = (html.match(/href="\/admin\/inquiries\/(q-[^"]+)"/) || [])[1];
  r = await post(`/admin/inquiries/${rq}/reply`, { _csrf: csrf, subject: 'Hello', body: 'Test body' }); ok('email reply without SMTP fails gracefully', r.status === 302);
  html = await (await req(`/admin/inquiries/${rq}`)).text(); ok('reply form + templates on inquiry page', html.includes('Reply by email') && html.includes('Acknowledge'));
  await post(`/admin/inquiries/${rq}/delete`, { _csrf: csrf });

  // Users and roles
  r = await post('/admin/users/new', { _csrf: csrf, name: 'Editor One', email: 'editor1@example.com', role: 'editor', pass: 'long-enough-pass-1' });
  ok('create editor', r.status === 302);
  const adminCookie = cookie;
  cookie = '';
  csrf = await csrfOf('/admin/login');
  r = await post('/admin/login', { _csrf: csrf, email: 'editor1@example.com', password: 'long-enough-pass-1', next: '/admin' });
  ok('editor can sign in', r.status === 302);
  r = await req('/admin/tours');
  ok('editor can open tours', r.status === 200);
  r = await req('/admin/users');
  ok('editor blocked from users (403)', r.status === 403, `${r.status}`);
  r = await req('/admin/settings');
  ok('editor blocked from settings (403)', r.status === 403, `${r.status}`);
  cookie = adminCookie;
  csrf = await csrfOf('/admin');
  html = await (await req('/admin/users')).text();
  const uid = (html.match(/href="\/admin\/users\/(u-[^"]+)"[^>]*>Editor One/) || [])[1];
  if (uid) { r = await post(`/admin/users/${uid}/delete`, { _csrf: csrf }); ok('delete editor', r.status === 302); }

  r = await post('/admin/logout', { _csrf: csrf });
  r = await req('/admin');
  ok('logout ends session', r.status === 302);
  r = await fetch(`${B}/`);
  ok('public home still fine', r.status === 200);
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
