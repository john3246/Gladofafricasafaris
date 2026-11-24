/**
 * Audit log with IP address and location, and the live (self-refreshing) CMS data. Run against a THROWAWAY server:
 *   TEST_PORT=3079 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/audit-live-test.js
 */
require('dotenv').config();

const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
let cookie = '';
let fails = 0;
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };

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
const csrfOf = async (p) => ((await text(p)).match(/name="_csrf" value="([^"]+)"/) || [])[1];

(async () => {
  const geo = require('../src/services/geo');
  ok('private addresses are shown as the local network', geo.lookup('192.168.1.5').label === 'Local network' && geo.lookup('::1').label === 'Local network');
  const g = geo.lookup('8.8.8.8');
  ok('a public address resolves to a country without calling another service', /United States/.test(g.label), g.label);
  ok('device names are readable', geo.device('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36') === 'Chrome on Windows');

  // a failed login from a Kenyan-looking address, then a real one from Tanzania-range address
  const xff = { 'x-forwarded-for': '8.8.8.8' };
  await form('/admin/login', { _csrf: await csrfOf('/admin/login'), email: 'nobody@example.com', password: 'wrong', next: '/admin' }, xff);
  await form('/admin/login', { _csrf: await csrfOf('/admin/login'), email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, next: '/admin' }, xff);

  const dash = await text('/admin');
  ok('dashboard has the live panel', dash.includes('Live now') && dash.includes('data-live="/admin/live/panel"') && dash.includes('visitors on the site'));
  ok('live panel is served as a fragment and shows activity with place and address', await (async () => { const h = await text('/admin/live/panel'); return h.includes('Live now') && !h.includes('<html') && h.includes('8.8.8.8') && h.includes('United States'); })());

  const log = await text('/admin/audit');
  ok('audit log lists IP address, location and device columns', log.includes('IP address') && log.includes('Location') && log.includes('Device'));
  ok('login is recorded with the address and place', log.includes('8.8.8.8') && log.includes('United States') && log.includes('>login<'));
  ok('a failed login is recorded with the e-mail tried, and no password', log.includes('failed login') && log.includes('nobody@example.com') && !log.includes('wrong'));
  const rows = await text('/admin/audit/rows');
  ok('the audit rows refresh from their own address', rows.includes('<tr') && !rows.includes('<html') && rows.includes('8.8.8.8'));
  ok('the log page refreshes itself', log.includes('data-live="/admin/audit/rows'));

  // live visitors
  for (let i = 0; i < 3; i += 1) await fetch(B + '/destinations', { headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit Safari/604' } });
  const panel = await text('/admin/live/panel');
  ok('a visit appears in the live numbers straight away', /<p class="text-4xl[^>]*>[1-9]/.test(panel) && panel.includes('/destinations'), panel.slice(0, 120));

  // the fragment routes need a signed-in user
  cookie = '';
  const anon = await req('/admin/live/panel');
  ok('the live fragments are not public', anon.status === 302 || anon.status === 401);

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
