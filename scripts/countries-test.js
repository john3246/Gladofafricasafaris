/**
 * Which country brings clients: visits and quote requests by country, per safari and per offer, in the CMS.
 * Run against a THROWAWAY server:  TEST_PORT=3079 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/countries-test.js
 */
require('dotenv').config();

const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
let cookie = '';
let fails = 0;
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

const req = async (path, opt = {}) => {
  const res = await fetch(B + path, { redirect: 'manual', ...opt, headers: { cookie, ...(opt.headers || {}) } });
  for (const c of res.headers.getSetCookie?.() || []) {
    const [kv] = c.split(';');
    const [k] = kv.split('=');
    cookie = cookie.split('; ').filter((x) => x && !x.startsWith(`${k}=`)).concat(kv).join('; ');
  }
  return res;
};
const text = async (p, o) => (await req(p, o)).text();
const form = (p, body, headers = {}) => req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers }, body: new URLSearchParams(body).toString() });

(async () => {
  const SLUG = '8-days-experience-calving-season-in-tanzania';
  const fromUS = { 'x-forwarded-for': '8.8.8.8', 'user-agent': UA };
  const fromDE = { 'x-forwarded-for': '85.214.132.117', 'user-agent': UA };
  for (let i = 0; i < 4; i += 1) await fetch(`${B}/tours/${SLUG}`, { headers: fromUS });
  for (let i = 0; i < 2; i += 1) await fetch(`${B}/tours/${SLUG}`, { headers: fromDE });

  // a quote request from the United States, in Italian (the page language is kept)
  const page = await (await fetch(`${B}/it/book/${SLUG}`, { headers: fromUS })).text();
  const today = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10);
  const post = await fetch(`${B}/it/inquiry`, {
    method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...fromUS, origin: B, 'sec-fetch-site': 'same-origin', referer: 'https://www.google.com/' },
    body: new URLSearchParams({ name: 'Country Test', email: 'country@example.com', phone: '+1 555 0100', tourSlug: SLUG, startDate: today, adults: '2', children: '0', message: 'Hello from the country test', styles: 'Great Migration' }).toString(),
  });
  ok('a quote request from another country is accepted in Italian', post.status === 200 && (await post.text()).includes('Richiesta ricevuta'), String(post.status));
  void page;

  // CMS
  const csrf = (await text('/admin/login')).match(/name="_csrf" value="([^"]+)"/)[1];
  await form('/admin/login', { _csrf: csrf, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, next: '/admin' });
  const list = await text('/admin/inquiries');
  ok('the inquiries list has a Country column showing the country', list.includes('<th>Country</th>') && list.includes('United States'));
  const id = (list.match(/href="\/admin\/inquiries\/([^"]+)"/) || [])[1];
  const detail = await text(`/admin/inquiries/${id}`);
  ok('an inquiry shows its country, language and where the guest came from', detail.includes('United States') && detail.includes('wrote in IT') && detail.includes('google.com'));
  ok('no IP address is stored with the inquiry', !detail.includes('8.8.8.8'));

  const an = await text('/admin/analytics?days=30');
  ok('analytics shows which countries bring visitors and clients', an.includes('Which countries bring clients') && an.includes('United States') && an.includes('Germany'));
  const offers = await text('/admin/offers?days=30');
  ok('the Offers screen lists the 8-day calving safari with views and clients by country', offers.includes('8 Days Experience Calving Season in Tanzania') && offers.includes('United States (4)') && offers.includes('Germany (2)') && offers.includes('Calving season 2027'), offers.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(300, 700));
  ok('the Offers screen shows the quote request by country', /United States \(1\)/.test(offers));
  const csv = await text('/admin/inquiries/export.csv');
  ok('the CSV export has Country and Language columns', csv.split('\n')[0].includes('Country') && csv.includes('United States'));

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
