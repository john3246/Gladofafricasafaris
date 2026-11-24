/**
 * End-to-end test of safari styles (filter), best-selling safaris (CMS screen, own page, home section, badge),
 * the cache headers for CSS/JS and the CMS layout fixes. Run against a THROWAWAY server:
 *   TEST_PORT=3079 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/cms-catalog-test.js
 */
require('dotenv').config();

const http = require('http');
const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
/** A plain HTTP request (like a browser's conditional request); returns the status code. */
const statusWith = (path, headers) => new Promise((resolve, reject) => { http.get(B + path, { headers }, (r) => { r.resume(); resolve(r.statusCode); }).on('error', reject); });
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
const text = async (p) => (await req(p)).text();
const post = (p, body) => req(p, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: body instanceof URLSearchParams ? body.toString() : new URLSearchParams(body).toString() });
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const has = (h, s) => h.includes(s);
const cardSlugs = (html) => [...html.matchAll(/<article class="card-tour"[\s\S]*?href="\/tours\/([a-z0-9-]+)"/g)].map((m) => m[1]);

(async () => {
  // --- static files are always re-checked (a release must reach returning visitors)
  const css = await fetch(`${B}/css/app.css`);
  const js = await fetch(`${B}/js/board-filter.js`);
  ok('CSS and JavaScript are revalidated on every visit', /must-revalidate/.test(css.headers.get('cache-control') || '') && /must-revalidate/.test(js.headers.get('cache-control') || ''), css.headers.get('cache-control'));
  ok('CSS and JS answer "not modified" cheaply', (await statusWith('/css/app.css', { 'If-None-Match': css.headers.get('etag') })) === 304);

  // --- safari styles on the public listing
  const list = await text('/tanzania-safaris');
  const styleBoxes = (list.match(/data-style-filter value="[^"]+"/g) || []).length;
  ok('listing has a Safari style filter with several styles', has(list, 'Safari style') && styleBoxes >= 8, String(styleBoxes));
  ok('style filter shows counts', /data-style-filter value="Luxury"[^>]*>\s*<span[^>]*>Luxury<\/span><span[^>]*>\d+<\/span>/.test(list));
  ok('old fixed "Trip type" filter is gone', !has(list, 'Trip type') && !has(list, 'data-tier-filter'));
  ok('cards carry their styles for the filter', (list.match(/data-styles="[^"]+"/g) || []).length >= 30);
  ok('filter script handles styles, clear and empty results', has(await text('/js/board-filter.js'), 'data-style-filter') && has(await text('/js/board-filter.js'), 'data-clear-filters'));
  ok('category pages have the filter too', has(await text('/tanzania-safaris/migration'), 'data-style-filter'));
  const styled = (list.match(/data-styles="[^"]*Great Migration[^"]*"/g) || []).length;
  ok('migration safaris were given the Great Migration style', styled >= 3, String(styled));

  // --- sign in
  let t = await text('/admin/login');
  let csrf = t.match(/name="_csrf" value="([^"]+)"/)[1];
  let r = await post('/admin/login', { _csrf: csrf, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, next: '/admin' });
  ok('login', r.status === 302);
  csrf = (await text('/admin')).match(/data-csrf="([^"]+)"/)[1];

  // --- tour editor
  const edit = await text('/admin/tours/8-day-great-migration-moments/edit');
  ok('tour editor has safari styles to tick, ticked from the inference', has(edit, 'name="styles"') && /name="styles" value="Great Migration"[^>]*checked/.test(edit));
  ok('tour editor has the best-seller switches', has(edit, 'name="bestSeller"') && has(edit, 'name="bestSellerHome"') && has(edit, 'name="bestSellerOrder"'));
  ok('safari styles are managed in Site Settings', has(await text('/admin/settings'), 'the filter on the safaris page'));

  // --- the best-selling category and starter selection
  const cats = await text('/admin/categories');
  ok('Best-selling Safaris category exists and cannot be deleted', has(cats, 'Best-selling Safaris') && !has(cats, 'action="/admin/categories/best-selling/delete"'));
  const page0 = await text('/tanzania-safaris/best-selling');
  const starters = cardSlugs(page0);
  ok('own page lists the starter best sellers in order', r.status && starters.length >= 4 && starters[0] === '12-day-ultimate-tanzania-trip', starters.join(','));
  ok('own page has its own heading and SEO text', has(page0, 'Our best-selling Tanzania safaris') && has(page0, '<title>Best-Selling Tanzania Safaris'));
  ok('menu lists the best-selling page first', (await text('/')).indexOf('/tanzania-safaris/best-selling') < (await text('/')).indexOf('/tanzania-safaris/luxury'));
  ok('best-seller cards carry the badge', (page0.match(/Best seller<\/span>/g) || []).length === starters.length);
  const home0 = await text('/');
  ok('home page has the best-selling section with those tours', has(home0, 'Our most <em>loved safaris</em>') && has(home0, 'See all best-selling safaris'));
  ok('sitemap includes the best-selling page', has(await text('/sitemap.xml'), '/tanzania-safaris/best-selling'));

  // --- the dedicated CMS screen
  const screen = await text('/admin/best-sellers');
  ok('best-sellers screen lists the tours with switches', has(screen, 'Best-selling safaris') && has(screen, 'name="best"') && has(screen, 'name="home"') && has(screen, 'name="order[') && has(screen, 'data-find'));
  ok('screen is in the sidebar', has(screen, 'href="/admin/best-sellers"'));
  const p = new URLSearchParams({ _csrf: csrf });
  ['8-day-great-migration-moments', '9-day-get-to-know-tanzania', '5-day-ndutu-calving-season-ngorongoro-crater-safari'].forEach((s) => p.append('best', s));
  p.append('home', '9-day-get-to-know-tanzania');
  p.append('order[8-day-great-migration-moments]', '2');
  p.append('order[9-day-get-to-know-tanzania]', '1');
  p.append('order[5-day-ndutu-calving-season-ngorongoro-crater-safari]', '3');
  r = await post('/admin/best-sellers', p);
  ok('saving the selection works', r.status === 302);
  const page1 = await text('/tanzania-safaris/best-selling');
  ok('own page now shows exactly the chosen safaris in the chosen order', cardSlugs(page1).join(',') === '9-day-get-to-know-tanzania,8-day-great-migration-moments,5-day-ndutu-calving-season-ngorongoro-crater-safari', cardSlugs(page1).join(','));
  const home1 = await text('/');
  const from = home1.indexOf('Our most <em>loved safaris</em>');
  const homeBest = home1.slice(from, home1.indexOf('</section>', from));
  ok('home section shows only the tour ticked for the home page', cardSlugs(homeBest).join(',') === '9-day-get-to-know-tanzania', cardSlugs(homeBest).join(','));
  ok('the screen remembers the choice', has(await text('/admin/best-sellers'), 'value="9-day-get-to-know-tanzania" class="h-4 w-4 accent-forest-500" checked'));
  const afterEdit = await text('/admin/tours/9-day-get-to-know-tanzania/edit');
  ok('tour editor shows the same flags', /name="bestSeller"[^>]*checked/.test(afterEdit) && has(afterEdit, 'value="1"'));
  r = await post('/admin/categories/best-selling/delete', { _csrf: csrf });
  ok('built-in category refuses deletion', (await text('/tanzania-safaris/best-selling')).includes('Our best-selling') );
  r = await post('/admin/best-sellers', { _csrf: csrf });
  const emptyPage = await req('/tanzania-safaris/best-selling');
  ok('with nothing selected the page still opens and the home section disappears', emptyPage.status === 200 && !has(await text('/'), 'Our most <em>loved safaris</em>'));
  ok('removed best sellers lose their badge', !has(await text('/tanzania-safaris'), 'Best seller</span>'));

  // --- filter a tour by a style from the CMS and see it on the page
  const tourPost = new URLSearchParams({ _csrf: csrf, title: 'Catalog Test Honeymoon', slug: 'catalog-test-honeymoon', tier: 'luxury', priceFrom: '5000', image: '/images/hero.webp', destinations: 'serengeti-national-park', status: 'published', bestSeller: '1', bestSellerOrder: '1' });
  tourPost.append('styles', 'Honeymoon & romance'); tourPost.append('styles', 'Luxury');
  r = await post('/admin/tours/new', tourPost);
  ok('create a tour with styles and best-seller on', r.status === 302, String(r.status));
  const after = await text('/tanzania-safaris');
  ok('new style appears in the filter with the tour counted', /data-style-filter value="Honeymoon &amp; romance"[^>]*>\s*<span[^>]*>Honeymoon &amp; romance<\/span><span[^>]*>1<\/span>/.test(after));
  ok('tour card has its style for filtering and the badge', /data-styles="Honeymoon &amp; romance\|Luxury"/.test(after) && has(await text('/tanzania-safaris/best-selling'), 'Catalog Test Honeymoon'));
  await post('/admin/tours/catalog-test-honeymoon/delete', { _csrf: csrf });

  // --- CMS layout fixes are in the served files
  const layoutCss = await text('/css/app.css');
  ok('CMS grids may shrink and the drawer locks scrolling', has(layoutCss, '.admin .grid>*,.admin main,.admin main>*{min-width:0}') && has(layoutCss, 'body.nav-open{overflow:hidden}'), 'rule missing');
  const adminJs = await text('/js/admin.js');
  ok('drawer closes on Esc, link tap, resize and has a close button', has(adminJs, "e.key === 'Escape') drawer(false)") && has(adminJs, "sidebar-close") && has(adminJs, 'nav-open'));
  ok('top bar search shrinks on phones', has(await text('/admin'), 'sm:hidden">Search</span>'));

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
