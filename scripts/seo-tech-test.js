/**
 * Technical SEO checks: redirects, llms.txt, sitemap, structured data, destination hubs, itinerary links, anchors, photo hints.
 * Run against a THROWAWAY server: TEST_PORT=3079 node scripts/seo-tech-test.js
 */
const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
let fails = 0;
const get = async (p) => { const r = await fetch(B + p, { redirect: 'manual' }); return { status: r.status, html: await r.text() }; };
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const has = (x, type) => JSON.stringify(x['@type']).includes(type);

(async () => {
  // 301 redirects
  const R = [['/eng', '/'], ['/eng/tours', '/tours'], ['/tour_destination/serengeti-national-park', '/destinations/serengeti-national-park'],
    ['/lake-manyara-national-park-2', '/destinations/lake-manyara-national-park'], ['/destinations/mount-meru-2', '/destinations/mount-meru'],
    ['/product/6-day-tanzania-big-five-big-cat-group-safari-2', '/tours/6-day-tanzania-big-five-big-cat-group-safari']];
  for (const [from, to] of R) {
    const r = await fetch(B + from, { redirect: 'manual' });
    ok(`301 ${from} -> ${to}`, r.status === 301 && new URL(r.headers.get('location'), B).pathname === to, `${r.status} ${r.headers.get('location')}`);
  }

  // llms.txt and sitemap
  const llms = await get('/llms.txt');
  ok('llms.txt summarises the company, address, phone and main pages', llms.status === 200 && llms.html.includes('402 Sakina') && llms.html.includes('+255-695-108-009') && llms.html.includes('/tours/') && /per person/.test(llms.html));
  const sm = (await get('/sitemap.xml')).html;
  ok('every sitemap entry has a lastmod', (sm.match(/<url>/g) || []).length === (sm.match(/<lastmod>/g) || []).length);

  // structured data
  const home = await get('/');
  const org = ld(home.html).find((x) => has(x, 'TravelAgency'));
  ok('Organization data: TravelAgency + Organization, phone, street, areaServed', org && org['@type'].includes('Organization') && org.telephone === '+255-695-108-009' && org.address.streetAddress === '402 Sakina' && org.areaServed.includes('Zanzibar'));
  const tourPage = await get('/tours/8-days-private-camping-tarangire-serengeti-ngorongoro-crater');
  const tourLd = ld(tourPage.html);
  const trip = tourLd.find((x) => has(x, 'TouristTrip'));
  ok('tour data: TouristTrip + Product, AggregateOffer in USD, one attraction per day', trip && trip['@type'].includes('Product') && trip.offers['@type'] === 'AggregateOffer' && trip.offers.priceCurrency === 'USD' && trip.offers.lowPrice === 2400 && trip.itinerary.itemListElement.length === 8 && trip.itinerary.itemListElement[0].item['@type'] === 'TouristAttraction');
  ok('tour page sends FAQ and breadcrumb data', tourLd.some((x) => has(x, 'FAQPage')) && tourLd.some((x) => has(x, 'BreadcrumbList')));
  ok('trust badges sit beside the quote and WhatsApp buttons', tourPage.html.includes('Locally owned office in Arusha') && tourPage.html.includes('Ask on WhatsApp'));

  // hub-and-spoke
  const hub = await get('/destinations/tarangire-national-park');
  const hubLd = ld(hub.html);
  ok('destination hub: facts table, tours, lodges and FAQ', hub.html.includes('Park facts') && hub.html.includes('Distance from Arusha') && hub.html.includes('Safaris that include') && hub.html.includes('Lodges and camps in') && hubLd.some((x) => has(x, 'FAQPage')) && hubLd.some((x) => has(x, 'TouristDestination')));
  const itin = (await get('/tours/7-day-private-camping-and-lodges-tanzania-safari')).html;
  ok('itinerary days link to the destination hubs they visit', itin.includes('href="/destinations/tarangire-national-park"') && itin.includes('href="/destinations/serengeti-national-park"') && itin.includes('href="/destinations/ngorongoro-crater"'));

  // anchors and photos
  const listing = (await get('/tanzania-safaris')).html;
  ok('card links use descriptive anchor text', !/>\s*View trip|>\s*Read More|>\s*Explore &rarr;/.test(home.html + listing) && listing.includes('itinerary'));
  const imgs = home.html.match(/<img\b[^>]*>/g) || [];
  ok('every photo is async-decoded and has an explicit loading mode', imgs.every((t) => /decoding="async"/.test(t) && /loading="(lazy|eager)"/.test(t) || /\/images\/logo/.test(t)), String(imgs.filter((t) => !/decoding="async"/.test(t)).length));
  ok('the main hero photo loads eagerly with high priority', imgs.some((t) => /fetchpriority="high"/.test(t) && /loading="eager"/.test(t)));
  ok('analytics and fonts do not block rendering', !home.html.includes('googletagmanager.com/gtag/js') && home.html.includes('data-async-font') && home.html.includes('fonts.js'));

  // hero video
  ok('hero has a background video with a poster photo, phone copy and reduced-motion script', home.html.includes('data-hero-video') && home.html.includes('/video/hero.mp4') && home.html.includes('/video/hero-small.mp4') && home.html.includes('hero-video.js') && home.html.includes('/video/poster.webp'));
  const mp4 = await fetch(B + '/video/hero.mp4', { headers: { range: 'bytes=0-99' } });
  ok('the compressed video is served in ranges and is small', mp4.status === 206 && String(mp4.headers.get('content-type')).includes('video/mp4') && Number((mp4.headers.get('content-range') || '').split('/')[1]) < 8000000, mp4.status + ' ' + mp4.headers.get('content-range'));

  // titles and descriptions fit
  const { fitTitle, fitDescription } = require('../src/seo/meta');
  const longTitle = fitTitle('Tanzania Destinations: Serengeti, Ngorongoro, Tarangire & More | Glad Of Africa');
  ok('long titles are cut to 60 characters or less', longTitle.length <= 60, `${longTitle.length} ${longTitle}`);
  const d = fitDescription('Short text.');
  ok('descriptions are brought to 145-155 characters', d.length >= 145 && d.length <= 155, String(d.length));

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
