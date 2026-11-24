/**
 * Public pages added in November 2026: /reviews, /accommodations, /experiences, the new header and the home page layout.
 * Run against a THROWAWAY server: TEST_PORT=3079 node scripts/site-pages-test.js
 */
require('dotenv').config();

const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
let fails = 0;
const get = async (p) => { const r = await fetch(B + p, { redirect: 'manual' }); return { status: r.status, html: await r.text() }; };
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };

(async () => {
  const home = await get('/');
  ok('home shows Why choose us with the 12-day cover photo', home.html.includes('Why choose us') && home.html.includes('A safari built') && home.html.includes('/images/gallery/glad-9840.webp'));
  ok('About us section was replaced on the home page', !/>About us<\/span>[\s\S]{0,200}Personal, responsible/.test(home.html));
  ok('main menu has Experiences and no Pages item', home.html.includes('href="/experiences"') && !/>\s*Pages\s*</.test(home.html));
  ok('header strip has Reviews and Accommodations links', home.html.includes('href="/reviews"') && home.html.includes('href="/accommodations"'));
  ok('header strip has social icons', /aria-label="Facebook"/.test(home.html) || /Facebook/.test(home.html));
  const loved = (home.html.split('Our most <em>loved safaris</em>')[1] || '').split('</section>')[0];
  ok('Our most loved safaris shows four cards', (loved.match(/<article/g) || []).length === 4, String((loved.match(/<article/g) || []).length));
  ok('home reviews are clamped to two lines with a link to all reviews', home.html.includes('line-clamp-2') && home.html.includes('Read all reviews'));

  for (const p of ['/reviews', '/accommodations', '/experiences']) {
    const r = await get(p);
    ok(`${p} loads with one heading`, r.status === 200 && (r.html.match(/<h1/g) || []).length === 1, `${r.status}`);
  }
  const acc = await get('/accommodations');
  ok('accommodations lists places taken from the itineraries', (acc.html.match(/<article/g) || []).length >= 5);
  const exp = await get('/experiences');
  ok('experiences link to the filtered safaris page', exp.html.includes('/tanzania-safaris?style='));
  const blog = await get('/blog');
  ok('new planning articles are on the blog', blog.html.includes('serengeti-calving-season-guide'));
  const art = await get('/blog/what-to-pack-for-a-tanzania-safari');
  ok('an article opens with photos and internal links', art.status === 200 && art.html.includes('<img') && /href="\/(tours|tanzania-safaris|destinations)/.test(art.html), `${art.status}`);

  // --- SEO and covers (Nov 2026)
  const pillar = await get('/ndutu-calving-season-safari');
  ok('Ndutu calving landing page loads with its own title', pillar.status === 200 && pillar.html.includes('<title>Ndutu Calving Season Safari 2027'), String(pillar.status));
  ok('landing page has FAQ structured data and an h1', pillar.html.includes('"@type":"FAQPage"') && (pillar.html.match(/<h1/g) || []).length === 1);
  ok("landing page lists calving safaris", pillar.html.split(`href="/tours/`).length - 1 >= 4);
  const cat = await get('/tanzania-safaris/calving-season');
  ok("calving season category lists the five calving safaris", cat.status === 200 && cat.html.split(`href="/tours/`).length - 1 >= 5, String(cat.status));
  ok('home head has WebSite + Organization structured data', home.html.includes('"@type":"WebSite"') && home.html.includes('TravelAgency'));
  ok('head has twitter card tags and hreflang', home.html.includes('name="twitter:title"') && home.html.includes('hreflang="x-default"'));
  const tour = await get('/tours/7-day-february-calving-season-safari');
  ok('calving tour has an optimised title and TouristTrip data with duration', tour.html.includes('<title>7-Day February Calving Season Safari in Ndutu') && tour.html.includes('"duration":"P7D"'));
  const sm = await get('/sitemap.xml');
  ok('sitemap lists the landing page, new pages and images', sm.html.includes('/ndutu-calving-season-safari') && sm.html.includes('/reviews') && sm.html.includes('<image:loc>') && sm.html.includes('<lastmod>'));
  const robots = await get('/robots.txt');
  ok('robots.txt is served', robots.status === 200);
  const dest = await get('/destinations/serengeti-national-park');
  ok('destination page has TouristDestination data', dest.html.includes('TouristDestination'));
  const ev = await fetch(B + '/t/e', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'e=whatsapp' });
  ok('contact click counter accepts events', ev.status === 204, String(ev.status));
  const bad = await fetch(B + '/t/e', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'e=anything-else' });
  ok('unknown events are ignored (no counters invented)', bad.status === 204);
  // every cover photo is its own
  const fs = require('fs'); const crypto = require('crypto'); const path = require('path');
  const hash = (u) => { const f = path.join(__dirname, '..', 'public', u); return fs.existsSync(f) ? crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex') : 'missing:' + u; };
  const owners = {};
  const addOwner = (kind, slug, img) => { if (img) (owners[hash(img)] = owners[hash(img)] || []).push(kind + ':' + slug); };
  require('../src/data/tours').forEach((t) => addOwner('tour', t.slug, t.image));
  require('../src/data/destinations').forEach((d) => addOwner('destination', d.slug, d.image));
  require('../src/data/posts').forEach((p) => addOwner('post', p.slug, p.image));
  const shared = Object.values(owners).filter((v) => v.length > 1);
  ok('no two safaris, destinations or articles share a cover photo', shared.length === 0, JSON.stringify(shared));

  // --- speed
  ok('photos offer small copies (srcset) to small screens', home.html.includes('srcset="/img/480/') && home.html.includes('sizes='));
  const css = home.html.includes("/css/app.css?v=");
  ok('CSS address carries a fingerprint', Boolean(css), 'no ?v= on app.css');
  const small = await fetch(B + '/img/480/hero.webp');
  ok('the small copies are served', small.status === 200 && Number(small.headers.get('content-length')) < 80000, String(small.status));
  const terms = await get('/terms-and-conditions');
  ok('terms page has real text, not a placeholder', terms.status === 200 && !terms.html.includes('Placeholder:') && terms.html.includes('Booking and payment'));
  // --- lodge gazetteer
  const lodges = await get('/accommodations');
  const cards = lodges.html.split('<article').length - 1;
  ok('accommodations page lists 110+ places with region filters', cards >= 110 && lodges.html.includes('data-chip="serengeti"') && lodges.html.includes('data-chip="ruaha-national-park"'), String(cards));
  ok('lodge cards are numbered and the filter script is served', lodges.html.includes('Nº 001') && (await get('/js/lodge-filter.js')).status === 200);
  const one = await get('/accommodations/kitela-lodge');
  ok('a lodge has its own page with facts and a quote button', one.status === 200 && one.html.includes('20 cottages') && one.html.includes('LodgingBusiness') && one.html.includes('/get-a-quote'), String(one.status));
  ok('unknown lodge is a 404', (await get('/accommodations/not-a-place')).status === 404);
  ok('sitemap lists the lodge pages', (await get('/sitemap.xml')).html.includes('/accommodations/kitela-lodge'));
  const pics = [...lodges.html.matchAll(/<article[\s\S]*?<img[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  const times = {}; pics.forEach((p) => { times[p] = (times[p] || 0) + 1; });
  ok('lodge cards use many different photos (none used more than twice)', new Set(pics).size >= 80 && Math.max(...Object.values(times)) <= 2, new Set(pics).size + ' distinct');
  // --- private camping safaris
  const camp = [['4-day-private-camping-tour-tarangire-serengeti-ngorongoro-crater', 1500, 4], ['5-day-private-camping-tarangire-serengeti-ngorongoro-crater', 2000, 5], ['7-day-private-camping-and-lodges-tanzania-safari', 2200, 7], ['8-days-private-camping-tarangire-serengeti-ngorongoro-crater', 2400, 8]];
  for (const [slug, price, days] of camp) {
    const t = await get('/tours/' + slug);
    ok('camping tour ' + days + ' days loads with its price and every day', t.status === 200 && t.html.includes(price.toLocaleString('en-US')) && (t.html.match(/Day \d+<\/span>/g) || []).length >= days, String(t.status));
  }
  const bud = await get('/tanzania-safaris/budget');
  ok('camping tours are listed under Budget safaris', camp.every(([slug]) => bud.html.includes('/tours/' + slug)));
  // --- home page sections (packages, climbs, destinations, guides, FAQ)
  const homeNow = (await get('/')).html;
  const cardsIn = (h, from) => ((homeNow.split(h)[1] || '').split('</section>')[0].match(/class="card-tour/g) || []).length;
  ok('home is short: four best sellers, three climbs, six destinations, three guides', cardsIn('Our most <em>loved safaris</em>') === 4 && cardsIn('Climb <em>Kilimanjaro</em>') === 3 && cardsIn('Tanzania <em>destinations</em>') === 6 && cardsIn('Tanzania <em>travel guides</em>') === 3, [cardsIn('Our most <em>loved safaris</em>'), cardsIn('Climb <em>Kilimanjaro</em>'), cardsIn('Tanzania <em>destinations</em>'), cardsIn('Tanzania <em>travel guides</em>')].join(','));
  ok('home no longer lists every package', !homeNow.includes('Tanzania <em>safari packages</em>') && (homeNow.match(/class="card-tour/g) || []).length <= 26, String((homeNow.match(/class="card-tour/g) || []).length));
  // --- itinerary detail rows
  const it = (await get('/tours/8-days-private-camping-tarangire-serengeti-ngorongoro-crater')).html;
  ok('itinerary shows destination, wildlife, activities, overnight and meals for each day', it.includes('Main destination') && it.includes('Wildlife you may see') && it.includes('Activities') && it.includes('Overnight') && it.includes('Meals'));
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
