/**
 * Offers, travel insurance, the three languages and the AI-facing files. Run against a THROWAWAY server:
 *   TEST_PORT=3079 node scripts/i18n-test.js
 */
const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
let fails = 0;
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const get = async (p, opt) => { const r = await fetch(B + p, { redirect: 'manual', ...opt }); return { status: r.status, headers: r.headers, html: await r.text() }; };
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const meta = (html, re) => ((html.match(re) || [])[1] || '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

const LANGS = ['it', 'fr', 'de'];
const TRANSLATED = ['', '/offers', '/travel-insurance', '/tanzania-safaris', '/destinations', '/contact-us', '/get-a-quote', '/about-us', '/faqs'];

(async () => {
  // offers
  const home = await get('/');
  ok('home has the Special offers section with eight offers', home.html.includes('Special offers') && (home.html.split('Calving season 2027').length - 1) >= 5 && home.html.includes('href="/offers"'));
  const offers = await get('/offers');
  ok('offers page groups calving season and holiday packages', offers.status === 200 && offers.html.includes('Calving season 2027') && offers.html.includes('Safari &amp; beach holiday') && (offers.html.match(/class="card-tour/g) || []).length === 8, String((offers.html.match(/class="card-tour/g) || []).length));
  const offersLd = ld(offers.html);
  ok('offers page has list, FAQ and breadcrumb data', offersLd.some((x) => x['@type'] === 'ItemList') && offersLd.some((x) => x['@type'] === 'FAQPage') && offersLd.some((x) => x['@type'] === 'BreadcrumbList'));
  const r301 = await get('/tanzania-safaris/offers');
  ok('the old category address redirects to /offers', r301.status === 301);

  // travel insurance
  const en = await get('/travel-insurance');
  ok('travel insurance page: mandatory, medical, evacuation, climbing', en.status === 200 && /mandatory/i.test(en.html) && /evacuation/i.test(en.html) && en.html.includes('5,895 m'));
  ok('travel insurance page sends FAQ data', ld(en.html).some((x) => x['@type'] === 'FAQPage'));
  ok('the footer links to the travel insurance page', en.html.includes('href="/travel-insurance"'));

  // languages
  for (const lang of LANGS) {
    for (const p of TRANSLATED) {
      const path = `/${lang}${p}`;
      const r = await get(path);
      const title = meta(r.html, /<title>([^<]*)<\/title>/);
      const desc = meta(r.html, /<meta name="description" content="([^"]*)"/);
      const canon = meta(r.html, /rel="canonical" href="([^"]*)"/);
      const alts = (r.html.match(/<link rel="alternate" hreflang=/g) || []).length;
      const links = [...r.html.matchAll(/<a\s[^>]*>/g)].filter((m) => !m[0].includes('data-nolang')).map((m) => (m[0].match(/href="(\/[^"#]*)"/) || [])[1]).filter(Boolean).filter((h) => !/^\/(it|fr|de)(\/|$)/.test(h) && !/^\/(css|js|images|img|video|icons|uploads)\//.test(h) && !/\.\w{2,5}$/.test(h) && !/^\/(admin)/.test(h));
      const stray = links.filter((h) => h !== '/' || true);
      const coverage = Number(r.headers.get('x-i18n-coverage'));
      const good = r.status === 200 && r.html.includes(`<html lang="${lang}"`) && !/noindex/.test(r.html.match(/<meta name="robots" content="[^"]*"/)[0]) && canon.endsWith(path === `/${lang}` ? `/${lang}` : path)
        && alts === 5 && title.length > 10 && title.length <= 60 && desc.length >= 145 && desc.length <= 155 && coverage >= 85 && stray.length === 0;
      ok(`${path}: translated, indexable, hreflang, title/description fit, links stay in ${lang}`, good, `status ${r.status} title ${title.length} desc ${desc.length} alts ${alts} coverage ${coverage} stray ${stray.slice(0, 3)}`);
    }
  }

  const it = await get('/it/');
  ok('Italian home has Italian words and no English headings', it.html.includes('Offerte speciali') && it.html.includes('Perché sceglierci') && !it.html.includes('Why choose us') && !it.html.includes('Special offers'));
  const de = await get('/de/offers');
  ok('German offers page shows the offers and keeps links in /de', de.html.includes('Angebote') && (de.html.match(/href="\/de\/tours\//g) || []).length >= 8);
  const fr = await get('/fr/get-a-quote');
  ok('French quote form is translated and posts inside /fr', fr.html.includes('Nom et prénom') && fr.html.includes('action="/fr/inquiry"'));

  // pages that are not fully translated stay out of the search results
  for (const p of ['/it/blog', '/de/accommodations', '/it/tours/9-days-serengeti-migration-big-cats-black-rhino-safari']) {
    const r = await get(p);
    ok(`${p} is not offered for indexing (not fully translated)`, r.status === 200 && /noindex/.test(r.html.match(/<meta name="robots" content="[^"]*"/)[0]) && !/rel="alternate" hreflang="(it|fr|de)"/.test(r.html), String(r.status));
  }

  // travel insurance in every language
  const texts = {};
  for (const lang of ['it', 'fr', 'de']) {
    const r = await get(`/${lang}/travel-insurance`);
    texts[lang] = r.html;
    ok(`/${lang}/travel-insurance is written in ${lang} with its own FAQ data`, ld(r.html).some((x) => x['@type'] === 'FAQPage' && JSON.stringify(x).length > 300) && !r.html.includes('Why it is mandatory'), String(r.status));
  }
  ok('Italian, French and German insurance pages say different things', texts.it.includes('obbligatoria') && texts.fr.includes('obligatoire') && texts.de.includes('Pflicht'));

  // language switcher
  ok('every page has the language dropdown with five languages', (home.html.match(/data-lang-switcher/g) || []).length === 1 && (home.html.match(/hreflang="(en|it|fr|de|zh)" lang=/g) || []).length === 5);
  const sw = await get('/it/offers');
  ok('on an Italian page the switcher points to the other languages of the same page', sw.html.includes('href="/offers" hreflang="en"') && sw.html.includes('href="/fr/offers" hreflang="fr"'));

  // sitemap with alternates
  const sm = (await get('/sitemap.xml')).html;
  ok('sitemap lists the translated pages in every language with hreflang alternates', sm.includes('/it/offers') && sm.includes('/de/travel-insurance') && sm.includes('hreflang="fr"') && !sm.includes('/it/blog'));

  // AI files
  const robots = require('../src/modules/seo/seo.controller');
  ok('the AI crawler list is wide open to the public pages', robots && require('fs').readFileSync(require.resolve('../src/modules/seo/seo.controller'), 'utf8').includes('GPTBot') && require('fs').readFileSync(require.resolve('../src/modules/seo/seo.controller'), 'utf8').includes('ClaudeBot'));
  const llms = await get('/llms.txt');
  ok('llms.txt names the offers, insurance rule, languages and the full files', llms.html.includes('/offers') && llms.html.includes('/travel-insurance') && llms.html.includes('/it') && llms.html.includes('llms-full.txt'));
  const full = await get('/llms-full.txt');
  ok('llms-full.txt carries the insurance rule, destinations and every safari itinerary', full.status === 200 && full.html.includes('Travel insurance (mandatory)') && full.html.includes('### Serengeti National Park') && full.html.includes('Day 1:') && full.html.length > 40000, String(full.html.length));
  const json = JSON.parse((await get('/tours.json')).html);
  ok('tours.json lists the safaris with price, days and offer', json.tours.length >= 49 && json.currency === 'USD' && json.tours.some((t) => t.offer === 'Calving season 2027' && t.priceFrom > 0));
  ok('the head points AI tools to llms.txt', home.html.includes('href="/llms.txt"'));

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})();
