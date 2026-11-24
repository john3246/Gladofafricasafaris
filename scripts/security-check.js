/**
 * Security checks. Starts its own throwaway servers (file storage in var/sec-data), so it never touches real content:
 *   node scripts/security-check.js
 * 1) production refuses to start with unsafe settings, 2) production sends secure cookies and HSTS,
 * 3) the preview cookie cannot be forged, 4) cross-site form posts are refused, 5) basic headers.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'var', 'sec-data');
let fails = 0;
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const run = (port, extra) => spawn(process.execPath, ['src/server.js'], {
  cwd: ROOT,
  env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, PORT: String(port), USE_DB: 'false', CMS_DATA_DIR: DATA, ...extra },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const exited = (child, ms) => new Promise((resolve) => { const t = setTimeout(() => resolve(null), ms); child.on('exit', (code) => { clearTimeout(t); resolve(code); }); });

const PASS = 'Sec-Check-Password-123';
const GOOD = { NODE_ENV: 'production', SITE_URL: 'https://example.test', SESSION_SECRET: 'a'.repeat(48), ADMIN_EMAIL: 'sec@example.test', ADMIN_PASSWORD: PASS };

(async () => {
  fs.rmSync(DATA, { recursive: true, force: true });

  // 1) unsafe production settings stop the server
  for (const [name, bad] of [['no session secret', { SESSION_SECRET: '' }], ['short session secret', { SESSION_SECRET: 'short' }], ['http SITE_URL', { SITE_URL: 'http://example.test' }], ['weak admin password', { ADMIN_PASSWORD: 'password' }]]) {
    const child = run(3081, { ...GOOD, ...bad });
    const code = await exited(child, 15000);
    if (code === null) child.kill();
    ok(`production refuses to start: ${name}`, code === 1, `exit ${code}`);
  }

  // 2) a correct production setup starts, with secure cookies and HSTS
  const prod = run(3081, GOOD);
  const B = 'http://localhost:3081';
  for (let i = 0; i < 60; i += 1) { // a busy shared server can take a while to start
    try { if ((await fetch(`${B}/healthz`)).ok) break; } catch (_) { /* not up yet */ }
    await wait(1000);
  }
  const H = { 'x-forwarded-proto': 'https' }; // Render terminates TLS in front of the app
  let r = await fetch(`${B}/admin/login`, { headers: H });
  const loginHtml = await r.text();
  let cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).join('; ');
  const csrf = loginHtml.match(/name="_csrf" value="([^"]+)"/)[1];
  r = await fetch(`${B}/admin/login`, { method: 'POST', redirect: 'manual', headers: { ...H, cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ _csrf: csrf, email: GOOD.ADMIN_EMAIL, password: PASS, next: '/admin' }).toString() });
  const setCookies = r.headers.getSetCookie() || [];
  ok('login works in production', r.status === 302, `${r.status}`);
  ok('session cookie is Secure, HttpOnly and SameSite', setCookies.some((c) => /glad_admin=/.test(c) && /secure/i.test(c) && /httponly/i.test(c) && /samesite=lax/i.test(c)), setCookies.join(' | '));
  cookie = [...new Map(cookie.split('; ').concat(setCookies.map((c) => c.split(';')[0])).map((c) => [c.split('=')[0], c])).values()].join('; ');
  const dash = await fetch(`${B}/admin`, { headers: { ...H, cookie }, redirect: 'manual' }); // the preview cookie is issued on the first signed-in page
  const dashCookies = dash.headers.getSetCookie() || [];
  ok('preview cookie is Secure and HttpOnly', dashCookies.some((c) => /^glad_preview=/.test(c) && /secure/i.test(c) && /httponly/i.test(c)), dashCookies.join(' | '));
  cookie = [...new Map(cookie.split('; ').concat(dashCookies.map((c) => c.split(';')[0])).map((c) => [c.split('=')[0], c])).values()].join('; ');

  r = await fetch(`${B}/`, { headers: H });
  const h = r.headers;
  ok('HSTS header', /max-age=\d+/.test(h.get('strict-transport-security') || ''));
  ok('CSP blocks inline scripts and framing', /script-src 'self'/.test(h.get('content-security-policy') || '') && /frame-ancestors 'self'/.test(h.get('content-security-policy') || '') && /object-src 'none'/.test(h.get('content-security-policy') || ''));
  ok('nosniff and no X-Powered-By', h.get('x-content-type-options') === 'nosniff' && !h.get('x-powered-by'));
  r = await fetch(`${B}/admin`, { headers: { ...H, cookie }, redirect: 'manual' });
  ok('admin pages are never cached', /no-store/.test(r.headers.get('cache-control') || ''));
  ok('admin requires login', (await fetch(`${B}/admin/backup/export.json`, { headers: H, redirect: 'manual' })).status === 302);
  ok('error pages hide internals', !/at .*\.js:\d+/.test(await (await fetch(`${B}/no-such-page-xyz`, { headers: H })).text()));

  // 3) forged preview cookie does not unlock drafts or scheduled posts
  const tomorrow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const adminCsrf = (await (await fetch(`${B}/admin`, { headers: { ...H, cookie } })).text()).match(/data-csrf="([^"]+)"/)[1];
  r = await fetch(`${B}/admin/blog/new`, { method: 'POST', redirect: 'manual', headers: { ...H, cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ _csrf: adminCsrf, title: 'Sec Scheduled', slug: 'sec-scheduled', excerpt: 'x', content: '<p>secret plans</p>', image: '/images/hero.webp', published: tomorrow, status: 'published' }).toString() });
  ok('create scheduled post', r.status === 302, `${r.status}`);
  const forged = ['glad_preview=1', `glad_preview=${Date.now() + 1e9}.${'0'.repeat(32)}`, 'glad_preview=1.abc'];
  for (const f of forged) {
    r = await fetch(`${B}/blog/sec-scheduled?preview=1`, { headers: { ...H, cookie: f } });
    ok(`forged cookie rejected (${f.slice(0, 22)})`, r.status === 404, `${r.status}`);
  }
  r = await fetch(`${B}/blog/sec-scheduled?preview=1`, { headers: { ...H, cookie } });
  ok('real preview cookie works', r.status === 200 && (await r.text()).includes('secret plans'), `${r.status}`);

  // 4) cross-site form posts are refused, same-site posts pass
  r = await fetch(`${B}/subscribe`, { method: 'POST', redirect: 'manual', headers: { ...H, origin: 'https://evil.example', 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=a%40b.co' });
  ok('cross-site POST refused', r.status === 403, `${r.status}`);
  r = await fetch(`${B}/subscribe`, { method: 'POST', redirect: 'manual', headers: { ...H, origin: `${B}`, 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=sec%40example.test' });
  ok('same-site POST accepted', r.status < 400, `${r.status}`);
  // a browser form on this site arrives as same-origin, even when the Origin header is the string "null"
  r = await fetch(`${B}/subscribe`, { method: 'POST', redirect: 'manual', headers: { ...H, origin: 'null', 'sec-fetch-site': 'same-origin', 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=nullorigin%40example.test' });
  ok('a real browser form (Origin: null, Sec-Fetch-Site: same-origin) is accepted', r.status < 400, `${r.status}`);
  r = await fetch(`${B}/subscribe`, { method: 'POST', redirect: 'manual', headers: { ...H, origin: 'null', 'sec-fetch-site': 'cross-site', 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=a%40b.co' });
  ok('a browser post from another site is refused', r.status === 403, `${r.status}`);
  r = await fetch(`${B}/subscribe`, { method: 'POST', redirect: 'manual', headers: { ...H, origin: 'null', 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=a%40b.co' });
  ok('Origin: null without browser proof is refused', r.status === 403, `${r.status}`);
  ok('referrer policy keeps the site name for same-origin posts', (await fetch(`${B}/`, { headers: H })).headers.get('referrer-policy') === 'strict-origin-when-cross-origin');
  r = await fetch(`${B}/admin/blog/sec-scheduled/delete`, { method: 'POST', redirect: 'manual', headers: { ...H, cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: 'x=1' });
  ok('admin POST without CSRF token refused', r.status === 403, `${r.status}`);

  // 5) login brute force is rate limited
  let limited = false;
  for (let i = 0; i < 14 && !limited; i += 1) {
    const rr = await fetch(`${B}/admin/login`, { method: 'POST', redirect: 'manual', headers: { ...H, cookie: cookie.split('; ').filter((c) => c.startsWith('glad_admin')).join('; '), 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ _csrf: adminCsrf, email: 'nobody@example.test', password: 'wrong-password-1' }).toString() });
    limited = rr.status === 429;
  }
  ok('repeated bad logins are rate limited (429)', limited);

  prod.kill();
  await exited(prod, 3000);
  fs.rmSync(DATA, { recursive: true, force: true });
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
