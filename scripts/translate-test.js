/**
 * The translator end to end, against a fake Claude API (no money spent): the CMS reads every page, finds the English
 * sentences that have no translation, sends them to the API, saves the answers, and the Italian pages are then complete.
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/translate-test.js
 */
require('dotenv').config();
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const MOCK = 3998;
const APP = 3077;
const B = `http://127.0.0.1:${APP}`;
let fails = 0;
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const calls = [];
const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const r = JSON.parse(body || '{}');
    calls.push({ url: req.url, key: req.headers['x-api-key'] || String(req.headers.authorization || '').replace('Bearer ', ''), headers: Object.keys(req.headers).join(','), model: r.model });
    const lang = /into (Italian|French|German)/.exec(r.system || '');
    const tag = lang ? { Italian: 'IT', French: 'FR', German: 'DE' }[lang[1]] : '??';
    const items = JSON.parse(r.messages[0].content);
    const out = {};
    items.forEach((i) => { out[i.id] = i.id === items[0].id && items.length > 1 && process.env.MOCK_BREAK_TAGS ? 'broken' : `[${tag}] ${i.text}`; });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ id: 'msg_test', type: 'message', role: 'assistant', model: r.model, content: [{ type: 'text', text: JSON.stringify(out) }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 100, output_tokens: 100 } }));
  });
});

let cookie = '';
const get = async (p, opt) => { for (let i = 0; ; i += 1) { try { return await fetch(B + p, opt); } catch (e) { if (i >= 4) throw e; await sleep(400); } } }; // a busy server may drop an idle connection
const req = async (p, opt = {}) => {
  const res = await get(p, { redirect: 'manual', ...opt, headers: { cookie, ...(opt.headers || {}) } });
  for (const c of res.headers.getSetCookie?.() || []) {
    const [kv] = c.split(';');
    const [k] = kv.split('=');
    cookie = cookie.split('; ').filter((x) => x && !x.startsWith(`${k}=`)).concat(kv).join('; ');
  }
  return res;
};
const text = async (p, o) => (await req(p, o)).text();
const form = (p, body) => req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body).toString() });

(async () => {
  await new Promise((r) => mock.listen(MOCK, r));
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-tr-'));
  const app = spawn(process.execPath, ['src/server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(APP), USE_DB: 'false', REDIS_URL: '', NODE_ENV: 'development', CMS_DATA_DIR: data, ANTHROPIC_API_KEY: 'sk-test-key', I18N_API_BASE: `http://127.0.0.1:${MOCK}`, SMTP_URL: 'json' },
    stdio: ['ignore', fs.openSync(path.join(__dirname, '..', 'var', 'tr-app.log'), 'w'), fs.openSync(path.join(__dirname, '..', 'var', 'tr-app.log'), 'a')],
  });
  try {
    for (let i = 0; i < 60; i += 1) { try { if ((await fetch(`${B}/healthz`)).ok) break; } catch (_) { /* not up yet */ } await sleep(500); }

    // sign in
    const csrf = (await text('/admin/login')).match(/name="_csrf" value="([^"]+)"/)[1];
    await form('/admin/login', { _csrf: csrf, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, next: '/admin' });
    const page = await text('/admin/translations');
    ok('the Translations screen opens and shows the three languages', page.includes('Translations') && page.includes('Italian') && page.includes('French') && page.includes('German'));
    ok('the translator knows the key came from the server settings', page.includes('API key saved'));
    const token = (await text('/admin')).match(/data-csrf="([^"]+)"/)[1];

    // a blog article in Italian before translation: English text, so not offered to search engines
    const before = await get('/it/blog/what-to-pack-for-a-tanzania-safari');
    const beforeHtml = await before.text();
    ok('an untranslated article is held back from search engines', /noindex/.test(beforeHtml.match(/<meta name="robots" content="[^"]*"/)[0]), String(before.status));

    // 1. read every page
    await form('/admin/translations/scan', { _csrf: token });
    for (let i = 0; i < 120; i += 1) { await sleep(1000); const h = await text('/admin/translations/job'); if (!/Working/.test(h)) break; }
    const after = await text('/admin/translations?lang=it&filter=missing');
    const waiting = Number((after.match(/(\d+) waiting/) || [])[1] || 0);
    ok('reading the site finds sentences that wait for translation', waiting > 300, String(waiting));

    // 2. translate
    await form('/admin/translations/run', { _csrf: token });
    for (let i = 0; i < 300; i += 1) { await sleep(1000); const h = await text('/admin/translations/job'); if (!/Working/.test(h)) break; }
    ok('the fake API was called with the key and the chosen model', calls.length > 5 && calls.every((c) => c.key === 'sk-test-key' && /claude/.test(c.model || '')), JSON.stringify(calls[0]));
    const done = await text('/admin/translations?lang=it&filter=ai');
    ok('translated sentences are listed as made by the translator', /Translated by the translator|translator/.test(done) && /\[IT\]/.test(done));

    // 3. the Italian article is now complete and indexable
    const art = await get('/it/blog/what-to-pack-for-a-tanzania-safari');
    const html = await art.text();
    ok('after translation the article is offered to search engines with its alternates', !/noindex/.test(html.match(/<meta name="robots" content="[^"]*"/)[0]) && /hreflang="it"/.test(html) && /\[IT\]/.test(html), String(art.headers.get('x-i18n-coverage')));
    const tour = await (await get('/it/tours/6-days-ndutu-safari')).text();
    ok('the itinerary of a safari is translated day by day', (tour.match(/\[IT\]/g) || []).length > 20);
    const sm = await (await get('/sitemap.xml')).text();
    ok('the sitemap now lists the translated article in Italian', sm.includes('/it/blog/what-to-pack-for-a-tanzania-safari'));

    // 4. a hand edit wins and is marked
    const edit = after.match(/name="t\[([a-f0-9]{20})\]"/);
    if (edit) {
      await form('/admin/translations/save', { _csrf: token, lang: 'it', filter: 'all', page: '1', [`t[${edit[1]}]`]: 'Testo corretto a mano' });
      const humans = await text('/admin/translations?lang=it&filter=human');
      ok('a hand-edited translation is saved and marked as edited by hand', humans.includes('Testo corretto a mano') && humans.includes('edited by hand'));
    }

    // 5. new content is picked up: a new FAQ becomes a waiting sentence
    const made = await await form('/admin/faqs/new', { _csrf: token, q: 'Zebra stripe question for the test?', a: 'Because zebras are striped.', group: 'General', status: 'published', slug: 'zebra-test' });
    const onSite = await text('/faqs');
    await form('/admin/translations/scan', { _csrf: token });
    for (let i = 0; i < 120; i += 1) { await sleep(1000); if (!/Working/.test(await text('/admin/translations/job'))) break; }
    const q = await text('/admin/translations?lang=fr&filter=missing&q=Zebra%20stripe');
    const all = await text('/admin/translations?lang=fr&filter=all&q=Zebra%20stripe');
    console.log('debug: in all =', all.includes('Zebra stripe'), (await text('/admin/translations/job')).replace(/<[^>]+>/g, ' ').replace(/s+/g, ' ').slice(0, 200));
    ok('new content shows up as waiting for translation', q.includes('Zebra stripe question') || q.includes('zebras are striped'), `create ${made.status}, on site ${onSite.includes('Zebra stripe')}`);
  } finally {
    app.kill();
    mock.close();
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
