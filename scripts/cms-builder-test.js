/**
 * End-to-end test for the "nothing is locked" CMS features: tour categories, regions, custom fields,
 * custom pages built from sections, and the editable home page. Run against a THROWAWAY server:
 *   TEST_PORT=3079 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/cms-builder-test.js
 * It cleans up what it creates and restores the home page from its revision history.
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
const post = (p, body) => req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body).toString() });
const text = async (p) => (await req(p)).text();
const csrfOf = async (p) => ((await text(p)).match(/name="_csrf" value="([^"]+)"/) || (await text(p)).match(/data-csrf="([^"]+)"/) || [])[1];
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const has = (html, s) => html.includes(s);

(async () => {
  let csrf = await csrfOf('/admin/login');
  let r = await post('/admin/login', { _csrf: csrf, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, next: '/admin' });
  ok('login', r.status === 302);
  csrf = await csrfOf('/admin');

  // --- new CMS screens open
  for (const p of ['/admin/categories', '/admin/categories/new', '/admin/regions', '/admin/regions/new', '/admin/custom-fields', '/admin/custom-fields/new', '/admin/pages/new', '/admin/pages/home/edit', '/admin/categories/luxury/edit']) {
    r = await req(p); ok(`GET ${p}`, r.status === 200, `${r.status}`);
  }
  const pageForm = await text('/admin/pages/home/edit');
  ok('home page editor lists its sections', has(pageForm, 'Hero banner') && has(pageForm, 'data-block-type') && has(pageForm, 'Regions (big photo cards)'));

  // --- custom field for tours
  r = await post('/admin/custom-fields/new', { _csrf: csrf, label: 'Fitness level', key: 'fitness', appliesTo: 'tours', type: 'select', options: 'Easy\nModerate\nHard', showOnSite: '1' });
  ok('create custom field', r.status === 302, `${r.status}`);
  ok('tour form shows the custom field', has(await text('/admin/tours/new'), 'name="x_fitness"'));

  // --- tour with a brand-new level and tag and the custom value
  const tour = {
    _csrf: csrf, title: 'Builder Test Honeymoon', slug: 'builder-test-honeymoon', tier: 'Boutique', style: 'Private', priceFrom: '4200', tags: 'signature', tags__new: 'Honeymoon, Beach Break',
    image: '/images/hero.webp', description: 'A romantic test trip.', highlights: 'Sunset dhow', x_fitness: 'Hard', destinations: 'serengeti-national-park', status: 'published',
  };
  r = await post('/admin/tours/new', tour);
  ok('create tour with new level, tags and custom value', r.status === 302, `${r.status}`);
  let page = await text('/tours/builder-test-honeymoon');
  ok('tour page shows custom field', has(page, 'Fitness level') && has(page, 'Hard'));
  ok('tour page shows the new level', has(page, 'boutique'));
  ok('tag editor offers the new tag next time', has(await text('/admin/tours/builder-test-honeymoon/edit'), 'value="honeymoon"'));

  // --- categories picked by tag and by the new level
  r = await post('/admin/categories/new', { _csrf: csrf, name: 'Honeymoon Escapes', slug: 'honeymoon', ruleType: 'tag', ruleValue: 'honeymoon', showInMenu: '1', sort: '50', intro: 'Romantic trips.', status: 'published' });
  ok('create category by tag', r.status === 302, `${r.status}`);
  r = await post('/admin/categories/new', { _csrf: csrf, name: 'Boutique Stays', slug: 'boutique', ruleType: 'level', ruleValue: 'boutique', showInMenu: '0', status: 'published' });
  ok('create category by level', r.status === 302, `${r.status}`);
  r = await post('/admin/categories/new', { _csrf: csrf, name: 'Broken', slug: 'broken', ruleType: 'tag', ruleValue: '', status: 'published' });
  ok('category rule value required', r.status === 422, `${r.status}`);
  page = await text('/tanzania-safaris/honeymoon');
  ok('category page lists the tagged tour', has(page, 'Builder Test Honeymoon') && has(page, 'Honeymoon Escapes'));
  ok('level category lists the tour', has(await text('/tanzania-safaris/boutique'), 'Builder Test Honeymoon'));
  const home = await text('/');
  ok('menu gained the new category', has(home, '/tanzania-safaris/honeymoon') && !has(home, '/tanzania-safaris/boutique"'));
  ok('sitemap has the new category', has(await text('/sitemap.xml'), '/tanzania-safaris/honeymoon'));
  ok('every-tour category filter lists new level', has(await text('/admin/tours'), 'Boutique'));

  // --- region + destination in it
  r = await post('/admin/regions/new', { _csrf: csrf, title: 'Indian Ocean Islands', slug: 'islands', text: 'Sun and sea.', photo: 'stone-town', showInMenu: '1', showOnHome: '1', sort: '9', status: 'published' });
  ok('create region', r.status === 302, `${r.status}`);
  r = await post('/admin/destinations/new', { _csrf: csrf, name: 'Builder Test Island', slug: 'builder-test-island', circuit: 'islands', image: '/images/hero.webp', intro: 'An island.', status: 'published' });
  ok('create destination in the new region', r.status === 302, `${r.status}`);
  page = await text('/destinations');
  ok('destinations page has the new region section', has(page, 'id="islands"') && has(page, 'Builder Test Island'));
  ok('destinations menu has the new region', has(await text('/'), 'Indian Ocean Islands'));

  // --- custom page from sections
  const blocks = {
    'blocks[0][type]': 'hero', 'blocks[0][heading]': 'Meet <em>our team</em>', 'blocks[0][intro]': 'People who love Tanzania.', 'blocks[0][image]': '/images/hero.webp', 'blocks[0][buttons]': 'Get a quote | /get-a-quote',
    'blocks[1][type]': 'richtext', 'blocks[1][heading]': 'Who we are', 'blocks[1][body]': '<p>Guides, drivers and planners.</p>',
    'blocks[2][type]': 'tours', 'blocks[2][category]': 'honeymoon', 'blocks[2][layout]': 'grid', 'blocks[2][count]': '3', 'blocks[2][heading]': 'Romantic trips',
    'blocks[3][type]': 'features', 'blocks[3][heading]': 'Why us', 'blocks[3][items]': 'Local | Born in Arusha\nSafe | Licensed guides',
    'blocks[4][type]': 'destinations', 'blocks[4][region]': 'islands', 'blocks[4][heading]': 'Islands',
    'blocks[5][type]': 'html', 'blocks[5][body]': '<p id="custom-html-marker">raw</p>',
    'blocks[6][type]': 'faq', 'blocks[6][count]': '2', 'blocks[6][heading]': 'Quick answers',
    'blocks[7][type]': 'richtext', 'blocks[7][heading]': 'Hidden heading', 'blocks[7][hidden]': '1',
  };
  r = await post('/admin/pages/new', { _csrf: csrf, title: 'Our Team', slug: 'our-team', menu: 'top', menuLabel: 'Team', metaTitle: 'Our team', status: 'published', ...blocks });
  ok('create custom page', r.status === 302, `${r.status}`);
  r = await fetch(`${B}/our-team`);
  page = await r.text();
  ok('custom page is live at /our-team', r.status === 200);
  ok('hero, text, tours, features, destinations, html and faq render', ['Meet <em>our team</em>', 'Who we are', 'Builder Test Honeymoon', 'Born in Arusha', 'Builder Test Island', 'custom-html-marker', 'Quick answers'].every((s) => has(page, s)), 'some section missing');
  ok('hidden section is not shown', !has(page, 'Hidden heading'));
  ok('hero replaces the title banner', (page.match(/<h1/g) || []).length === 1);
  ok('top menu links the page', has(await text('/'), 'href="/our-team"') && has(await text('/'), 'Team'));
  ok('sitemap lists the page', has(await text('/sitemap.xml'), '/our-team'));
  r = await post('/admin/pages/new', { _csrf: csrf, title: 'Blog', slug: 'blog', status: 'published' });
  ok('reserved address rejected', r.status === 422, `${r.status}`);
  r = await post('/admin/pages/our-team/toggle', { _csrf: csrf });
  ok('unpublished page returns 404', (await fetch(`${B}/our-team`)).status === 404);
  ok('core page cannot be deleted', has(await text('/admin/pages'), 'action="/admin/pages/about/delete"') === false);
  r = await post('/admin/pages/about/delete', { _csrf: csrf });
  ok('delete of core page refused', (await fetch(`${B}/about-us`)).status === 200);

  // --- edit the home page, then restore it
  const before = await text('/');
  r = await post('/admin/pages/home', { _csrf: csrf, title: 'Home', slug: 'home', metaTitle: 'Custom home title', status: 'published',
    'blocks[0][type]': 'richtext', 'blocks[0][heading]': 'Brand new home heading', 'blocks[0][body]': '<p>Edited in the CMS.</p>', 'blocks[1][type]': 'regions', 'blocks[1][heading]': 'Where next' });
  ok('save home page', r.status === 302, `${r.status}`);
  const edited = await text('/');
  ok('home shows the new sections only', has(edited, 'Brand new home heading') && has(edited, 'Where next') && !has(edited, 'Climb') && has(edited, 'Custom home title'));
  ok('region card shows on home', has(edited, 'Indian Ocean Islands'));
  const hist = await text('/admin/pages/home/history');
  const restore = (hist.match(/action="(\/admin\/pages\/home\/restore\/[^"]+)"/) || [])[1];
  r = restore ? await post(restore, { _csrf: csrf }) : { status: 0 };
  ok('restore home page from history', r.status === 302, `${r.status}`);
  const after = await text('/');
  ok('home is back to the original sections', has(after, 'A safari built') && has(after, 'loved safaris') && !has(after, 'Brand new home heading'));
  ok('home section count unchanged', (before.match(/<section/g) || []).length === (after.match(/<section/g) || []).length);

  // --- clean up
  const del = async (p) => (await post(p, { _csrf: csrf })).status === 302;
  const cleaned = [
    await del('/admin/pages/our-team/delete'), await del('/admin/destinations/builder-test-island/delete'), await del('/admin/regions/islands/delete'),
    await del('/admin/tours/builder-test-honeymoon/delete'), await del('/admin/categories/honeymoon/delete'), await del('/admin/categories/boutique/delete'),
    await del('/admin/custom-fields/fitness/delete'),
  ];
  ok('clean up test content', cleaned.every(Boolean), JSON.stringify(cleaned));
  ok('deleted category page is gone', (await fetch(`${B}/tanzania-safaris/honeymoon`)).status === 404);
  ok('menu no longer has the deleted region', !has(await text('/'), 'Indian Ocean Islands'));

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
