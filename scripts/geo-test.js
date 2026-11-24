/**
 * Search and AI-assistant features: organisation data, prices-at-a-glance table, safari price finder, spelling fix, llms.txt facts.
 * Run against a THROWAWAY server:  TEST_PORT=3079 node scripts/geo-test.js
 */
const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
let fails = 0;
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const get = async (p) => { const r = await fetch(B + p, { redirect: 'manual' }); return { status: r.status, html: await r.text() }; };
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

(async () => {
  const home = await get('/');
  const org = ld(home.html).find((x) => JSON.stringify(x['@type']).includes('TravelAgency'));
  ok('organisation data has rating, payments, membership, price range and the SafariBookings profile', org && org.aggregateRating && org.aggregateRating.ratingValue === '5.0' && org.aggregateRating.reviewCount === '6'
    && /Visa/.test(org.paymentAccepted) && org.memberOf && org.memberOf.name === 'Tanzania Tourist Board' && org.priceRange === '$60 - $6,600' && org.sameAs.includes('https://www.safaribookings.com/p7538') && org.geo.latitude === -3.3562, JSON.stringify(org || {}).slice(0, 300));

  for (const p of ['/tanzania-safaris/group', '/tanzania-safaris/day-trips', '/offers', '/about-us']) {
    const r = await get(p);
    ok(`${p} shows the prices-at-a-glance table with real prices`, r.status === 200 && r.html.includes('Starting price (USD)') && /from \$[\d,]+ pp/.test(r.html) && r.html.includes('Best months'), String(r.status));
  }
  const other = await get('/tanzania-safaris/luxury');
  ok('other category pages are not changed (no table unless switched on)', !other.html.includes('Starting price (USD)'));

  for (const p of ['/', '/offers', '/blog/ndutu-calving-safari-cost-and-itinerary']) {
    const r = await get(p);
    ok(`${p} has the safari price finder with its data and no inline script`, r.html.includes('data-safari-finder') && /data-finder-data>\{"types"/.test(r.html) && r.html.includes('safari-finder.js') && !/<script(?![^>]*(src=|application\/(ld\+)?json))[^>]*>/.test(r.html), String(r.status));
  }
  const noFinder = await get('/blog/what-to-pack-for-a-tanzania-safari');
  ok('articles without the finder switched on do not show it', !noFinder.html.includes('data-safari-finder'));

  const js = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'js', 'safari-finder.js'), 'utf8');
  ok('the finder script has no innerHTML, document.write, eval or inline handlers', !/innerHTML|document\.write|eval\(|onclick=/.test(js) && js.includes('encodeURIComponent') && js.includes('noopener noreferrer'));

  const tour = await get('/tours/6-days-ndutu-safari');
  ok('the 6-day Ndutu safari spells calving correctly and keeps its address', tour.status === 200 && !/calviry/i.test(tour.html));

  const llms = (await get('/llms.txt')).html;
  ok('llms.txt names the payments, membership, profile and the safari groups', llms.includes('Visa, Mastercard') && llms.includes('Tanzania Tourist Board') && llms.includes('safaribookings.com/p7538') && llms.includes('Calving season in Ndutu') && llms.includes('/tanzania-safaris/day-trips'));

  const sum = await get('/tours/6-days-ndutu-safari');
  ok('tour pages have a quick-facts summary right under the heading', /ai-summary-box/.test(sum.html) && /Best months: January to March/.test(sum.html) && /starts from \$2,950 per person/.test(sum.html));
  const dest = await get('/destinations/serengeti-national-park');
  ok('destination pages have a quick-facts summary', /ai-summary-box/.test(dest.html) && /safaris include Serengeti National Park, from/.test(dest.html));
  const grp = await get('/tanzania-safaris/group');
  ok('the group page has the departures section (with a note while no dates are listed)', grp.html.includes('Upcoming group departures'));
  const g301 = await get('/group-safaris');
  ok('/group-safaris leads to the group safaris page', g301.status === 301);

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
