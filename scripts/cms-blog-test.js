/**
 * End-to-end test for blog writing tools: rich editor field, sanitising, table of contents, scheduling,
 * preview, featured posts, filters, RSS and legacy posts. Run against a THROWAWAY server:
 *   TEST_PORT=3079 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/cms-blog-test.js
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
const visitor = (p) => fetch(B + p, { redirect: 'manual' });
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const has = (h, s) => h.includes(s);
const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

(async () => {
  let t = await text('/admin/login');
  let csrf = t.match(/name="_csrf" value="([^"]+)"/)[1];
  let r = await post('/admin/login', { _csrf: csrf, email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, next: '/admin' });
  ok('login', r.status === 302);
  csrf = (await text('/admin')).match(/data-csrf="([^"]+)"/)[1];

  // --- editor screens
  const form = await text('/admin/blog/new');
  ok('new post form has the rich editor, SEO assistant and options', has(form, 'data-richtext') && has(form, 'data-seo-panel') && has(form, 'name="focusKeyword"') && has(form, 'name="featured"') && has(form, 'name="tags__new"'));
  ok('editor offers links to tours', has(form, '/tours/') && has(form, '&#34;group&#34;:&#34;Tour'));
  ok('editor assets are served', (await visitor('/vendor/quill/quill.js')).status === 200 && (await visitor('/js/admin-richtext.js')).status === 200 && (await visitor('/js/admin-seo.js')).status === 200);
  const legacyForm = await text('/admin/blog/tanzania-safari-cost/edit');
  ok('older post opens in the editor as formatted text', has(legacyForm, 'The short answer'));

  // --- write a post with hostile content
  const content = '<h2>Best time to go</h2><p>Safari in <strong>Tanzania</strong> is best in the dry season. <a href="/tours/8-day-great-migration-moments">Our migration trip</a> <script>alert(1)</script></p>'
    + '<h2>What to pack</h2><ul><li>Binoculars</li></ul><h3>Clothing</h3><blockquote>Neutral colours.</blockquote>'
    + '<h2>Costs</h2><p onclick="x()">Budget wisely.</p><iframe class="ql-video" src="https://www.youtube.com/embed/abc123"></iframe><iframe src="https://evil.example/x"></iframe><img src="/images/hero.webp" alt="Savannah" onerror="x()">';
  const base = { _csrf: csrf, title: 'Blog Test Packing Guide', slug: 'blog-test-packing-guide', excerpt: 'What to pack for a Tanzania safari.', content, image: '/images/hero.webp', imageAlt: 'Savannah at dawn',
    category: 'Testing Guides', tags: '', tags__new: 'Packing List, Dry Season', focusKeyword: 'tanzania safari', published: day(-1), status: 'published', featured: '1' };
  r = await post('/admin/blog/new', base);
  ok('create post', r.status === 302, `${r.status}`);
  let page = await text('/blog/blog-test-packing-guide');
  ok('article renders', has(page, 'Best time to go') && has(page, 'Binoculars') && has(page, 'Neutral colours'));
  ok('scripts, handlers and foreign iframes are removed', !has(page, 'alert(1)') && !has(page, 'onclick') && !has(page, 'onerror') && !has(page, 'evil.example'));
  ok('youtube embed is kept', has(page, 'youtube.com/embed/abc123'));
  ok('headings get anchors and a table of contents', has(page, 'id="best-time-to-go"') && has(page, 'In this article') && has(page, 'href="#what-to-pack"'));
  ok('author, share buttons, category and tags', has(page, 'Glad Of Africa') && has(page, 'wa.me') && has(page, 'category=Testing%20Guides') && has(page, '#packing-list'));
  ok('related articles block', has(page, 'Keep reading'));
  ok('article schema has keywords and word count', has(page, '"keywords":"tanzania safari, packing-list, dry-season"') && has(page, '"wordCount"'));
  ok('feature flag, word count and reading time saved', has(await text('/admin/blog?q=Blog+Test+Packing'), 'Featured') && has(await text('/admin/blog?q=Blog+Test+Packing'), 'words'));

  // --- listing, filters, feed
  let index = await text('/blog');
  ok('blog index shows category chips', has(index, 'Testing Guides') && has(index, 'Blog categories'));
  ok('featured post comes first', index.indexOf('Blog Test Packing Guide') < index.indexOf('Seven Mistakes First-Time'));
  ok('category filter works', has(await text('/blog?category=Testing%20Guides'), 'Blog Test Packing Guide') && !has(await text('/blog?category=Testing%20Guides'), 'tanzania-safari-cost'));
  ok('tag filter works', has(await text('/blog?tag=dry-season'), 'Blog Test Packing Guide'));
  r = await visitor('/blog/feed.xml');
  const feed = await r.text();
  ok('RSS feed', r.status === 200 && has(feed, '<rss') && has(feed, 'Blog Test Packing Guide'));
  ok('feed advertised in page head', has(index, 'application/rss+xml'));

  // --- scheduling, drafts and preview
  r = await post('/admin/blog/blog-test-packing-guide', { ...base, published: day(5), featured: '' });
  ok('schedule post for a future date', r.status === 302);
  ok('scheduled post hidden from visitors', (await visitor('/blog/blog-test-packing-guide')).status === 404);
  ok('scheduled post missing from the blog and sitemap', !has(await (await visitor('/blog')).text(), 'Blog Test Packing Guide') && !has(await (await visitor('/sitemap.xml')).text(), 'blog-test-packing-guide'));
  r = await req('/blog/blog-test-packing-guide?preview=1');
  const prev = await r.text();
  ok('editor can preview a scheduled post', r.status === 200 && has(prev, 'Preview:') && has(prev, 'noindex'));
  ok('preview is not available to visitors', (await visitor('/blog/blog-test-packing-guide?preview=1')).status === 404);
  ok('admin form links to the preview', has(await text('/admin/blog/blog-test-packing-guide/edit'), 'preview=1'));
  r = await post('/admin/blog/blog-test-packing-guide', { ...base, published: day(-1), status: 'draft', featured: '' });
  ok('draft hidden from visitors', (await visitor('/blog/blog-test-packing-guide')).status === 404);
  r = await post('/admin/blog/blog-test-packing-guide', { ...base, published: day(-1), featured: '' });
  ok('publish again', (await visitor('/blog/blog-test-packing-guide')).status === 200);

  // --- validation
  r = await post('/admin/blog/new', { ...base, slug: 'blog-test-empty', content: '<p><br></p>' });
  ok('empty article rejected', r.status === 422, `${r.status}`);

  // --- older posts were upgraded with photos and internal links; tours show a photo per day
  const old = await text('/blog/luxury-midrange-or-budget-tanzania-safari');
  const body = old.slice(old.indexOf('prose-site mt-8'), old.indexOf('Share</span>'));
  ok('older post has photos inside the article', (body.match(/<img /g) || []).length >= 3);
  ok('older post links to site pages inside the text', /<a href="\/(tanzania-safaris|destinations)\//.test(body));
  ok('article page has a sidebar with a quote card', has(old, 'Get a free, tailor-made quote') && has(old, 'lg:grid-cols-[minmax(0,1fr)_330px]'));
  const tourPage = await text('/tours/8-day-great-migration-moments');
  const itin = tourPage.slice(tourPage.indexOf('day to day'));
  const dayImgs = (itin.match(/alt="Day [0-9]+:/g) || []).length;
  ok('every itinerary day shows a photo', dayImgs >= 6, String(dayImgs));

  // --- legacy post keeps working and converts on save
  ok('older post still renders', has(await text('/blog/tanzania-safari-cost'), 'The short answer'));
  const legacy = await text('/admin/blog/tanzania-safari-cost/edit');
  const saved = await post('/admin/blog/tanzania-safari-cost', { ...base, title: 'How Much Does a Tanzania Safari Cost? Budget, Midrange & Luxury (2027)', slug: 'tanzania-safari-cost', category: 'Planning', tags__new: '', featured: '',
    content: legacy.match(/data-rt-input>([\s\S]*?)<\/textarea>/)[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#34;/g, '"').replace(/&#39;/g, "'") });
  ok('older post saved through the editor', saved.status === 302, `${saved.status}`);
  ok('converted post still has its text and table of contents', has(await text('/blog/tanzania-safari-cost'), 'The short answer') && has(await text('/blog/tanzania-safari-cost'), 'id="the-short-answer"'));

  // --- clean up (restore the converted older post from its history, delete ours)
  const hist = await text('/admin/blog/tanzania-safari-cost/history');
  const restore = (hist.match(/action="(\/admin\/blog\/tanzania-safari-cost\/restore\/[^"]+)"/) || [])[1];
  r = restore ? await post(restore, { _csrf: csrf }) : { status: 0 };
  ok('restore older post from history', r.status === 302, `${r.status}`);
  r = await post('/admin/blog/blog-test-packing-guide/delete', { _csrf: csrf });
  ok('delete test post', r.status === 302);
  ok('deleted post is gone', (await visitor('/blog/blog-test-packing-guide')).status === 404);

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
