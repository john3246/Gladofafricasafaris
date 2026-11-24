const { env, site } = require('../../config');
const { buildSitemapEntries, renderSitemap } = require('./seo.service');
const toursService = require('../tours/tours.service');
const destinationsService = require('../destinations/destinations.service');
const categoriesService = require('../tours/categories.service');
const blogService = require('../blog/blog.service');

exports.sitemap = async (req, res) => {
  const entries = await buildSitemapEntries();
  res.type('application/xml').send(renderSitemap(entries));
};

// Search and AI-search crawlers that are welcome. Every group repeats the same blocked paths (groups do not inherit).
const WELCOME = ['Googlebot', 'Googlebot-Image', 'Bingbot', 'DuckDuckBot', 'Applebot', 'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'YouBot', 'MistralAI-User', 'cohere-ai'];
const BLOCKED = ['/admin', '/inquiry', '/book/', '/t/', '/uploads/private/', '/*?s=', '/*?q=', '/*?style=', '/*?sort=', '/*?price=', '/*?length=', '/*?preview=', '/*?page=', '/*?category=', '/*?tag='];

exports.robots = async (req, res) => {
  const { getSettings } = require('../../services/settings.service');
  if (!env.isProd || (await getSettings()).noindex) return res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  const rules = BLOCKED.map((p) => `Disallow: ${p}`).join('\n');
  const groups = [...WELCOME, '*'].map((ua) => `User-agent: ${ua}\nAllow: /\n${rules}\n`).join('\n');
  res.type('text/plain').send(`${groups}\nSitemap: ${env.siteUrl}/sitemap.xml\n`);
};

const usd = (n) => `$${Number(n).toLocaleString('en-US')}`;

/** /llms.txt: a plain summary of the company and its main pages for AI search tools. Built from the live data, so it never goes stale. */
exports.llms = async (req, res) => {
  const [tours, dests, cats, posts] = await Promise.all([toursService.list(), destinationsService.list(), categoriesService.list(), blogService.list()]);
  const priced = tours.filter((t) => t.priceConfirmed && t.priceFrom);
  const range = (fn) => { const p = priced.filter(fn).map((t) => t.priceFrom); return p.length ? `${usd(Math.min(...p))} to ${usd(Math.max(...p))} per person` : 'on request'; };
  const U = env.siteUrl;
  const top = (list, n) => list.slice(0, n);
  const lines = [
    `# ${site.name}`,
    '',
    `> Locally owned tour operator in Arusha, Tanzania, planning private and small-group Tanzania safaris, Kilimanjaro and Mount Meru climbs and Zanzibar beach extensions. Prices are shown per person in US dollars and every itinerary can be tailored.`,
    '',
    '## Company',
    `- Address: ${site.address.street}, ${site.address.city}, ${site.address.countryName}`,
    `- Phone and WhatsApp: ${site.phone}`,
    `- Email: ${site.email}`,
    `- Website: ${U}`,
    `- Languages: English, Italian (${U}/it), French (${U}/fr), German (${U}/de)`,
    ...(site.facts && site.facts.licence ? [`- Licence: ${site.facts.licence}`] : []),
    ...(site.facts && site.facts.memberOf ? [`- Member of: ${site.facts.memberOf}`] : []),
    ...(site.facts && site.facts.payments ? [`- Payments accepted: ${site.facts.payments} (prices in US dollars)`] : []),
    ...(site.facts && Number(site.facts.ratingValue) > 0 && Number(site.facts.ratingCount) > 0 ? [`- Guest rating: ${site.facts.ratingValue} out of 5 from ${site.facts.ratingCount} reviews`] : []),
    ...((site.facts && site.facts.profiles) || []).map((u) => `- Profile elsewhere: ${u}`),
    '- Travel insurance with medical and evacuation cover is mandatory for every guest',
    `- Full machine-readable detail: ${U}/llms-full.txt and ${U}/tours.json`,
    '',
    '## What we offer',
    `- Northern circuit safaris (Tarangire, Lake Manyara, Serengeti, Ngorongoro Crater): ${range((t) => !/kilimanjaro|meru|lengai/i.test(t.title) && !(t.tags || []).includes('trekking'))}`,
    `- Great Migration and calving season safaris (Ndutu, southern Serengeti, Mara River crossings): ${range((t) => (t.tags || []).some((x) => ['migration', 'calving'].includes(x)))}`,
    `- Private camping and budget safaris: ${range((t) => t.tier === 'budget' && !(t.tags || []).includes('day-trips') && !(t.tags || []).includes('trekking'))}`,
    `- Kilimanjaro, Mount Meru and Ol Doinyo Lengai treks: ${range((t) => (t.tags || []).includes('trekking'))}`,
    `- Day excursions from Arusha: ${range((t) => (t.tags || []).includes('day-trips'))}`,
    '- Southern Tanzania (Ruaha, Nyerere) and Zanzibar extensions are arranged on request',
    '',
    '## Find a safari by what you want',
    `- Day excursions from Arusha: ${U}/tanzania-safaris/day-trips`,
    `- Joining group safaris: ${U}/tanzania-safaris/group`,
    `- Calving season in Ndutu (January to March): ${U}/tanzania-safaris/calving-season`,
    `- Mara River crossings and Great Migration (July to October): ${U}/tanzania-safaris/migration`,
    `- Kilimanjaro and Mount Meru treks: ${U}/tanzania-safaris/trekking`,
    `- Zanzibar beach extensions: ${U}/tanzania-safaris/zanzibar`,
    `- Prices at a glance: ${U}/offers and ${U}/about-us`,
    '',
    '## Main pages',
    `- [All safaris](${U}/tanzania-safaris)`,
    ...cats.filter((c) => c.showInMenu !== false).map((c) => `- [${c.name}](${U}/tanzania-safaris/${c.slug})`),
    `- [Destinations](${U}/destinations)`,
    `- [Special offers: calving season and holiday packages](${U}/offers)`,
    `- [Mandatory travel insurance requirements](${U}/travel-insurance)`,
    `- [Where you stay: lodges and camps](${U}/accommodations)`,
    `- [Guest reviews](${U}/reviews)`,
    `- [Travel guides](${U}/blog)`,
    `- [FAQs](${U}/faqs)`,
    `- [Get a quote](${U}/get-a-quote)`,
    `- [Contact](${U}/contact-us)`,
    '',
    '## Destinations',
    ...top(dests, 25).map((d) => `- [${d.name}](${U}/destinations/${d.slug})`),
    '',
    '## Popular safaris',
    ...top(tours.filter((t) => t.bestSeller).concat(tours), 12).filter((t, i, a) => a.findIndex((x) => x.slug === t.slug) === i)
      .map((t) => `- [${t.title}](${U}/tours/${t.slug})${t.priceConfirmed ? `: ${t.days} days, from ${usd(t.priceFrom)} per person` : `: ${t.days} days`}`),
    '',
    '## Travel guides',
    ...top(posts, 10).map((p) => `- [${p.title}](${U}/blog/${p.slug})`),
    '',
  ];
  res.type('text/plain').send(lines.join('\n'));
};

/** /llms-full.txt: every safari, destination, offer and the insurance rule in plain Markdown, for AI assistants to read and cite. */
exports.llmsFull = async (req, res) => {
  const [tours, dests] = await Promise.all([toursService.list(), destinationsService.list()]);
  const U = env.siteUrl;
  const facts = require('../destinations/facts');
  const insurance = require('../../data/insurance.data').en;
  const out = [
    `# ${site.name}: full guide`, '',
    `> ${site.name} is a locally owned tour operator in ${site.address.city}, Tanzania (${site.address.street}). Phone and WhatsApp ${site.phone}, e-mail ${site.email}. Prices are per person in US dollars and every itinerary can be tailored. Website: ${U}`, '',
    '## Travel insurance (mandatory)', insurance.intro, '', ...insurance.sections.flatMap((s) => [`### ${s.h}`, ...(s.p || []), ...(s.ul || []).map((x) => `- ${x}`), '']),
    '## Destinations', '',
    ...dests.flatMap((d) => [`### ${d.name}`, `URL: ${U}/destinations/${d.slug}`, ...facts.table(d).map(([k, v]) => `- ${k}: ${v}`), '']),
    '## Safaris and treks', '',
    ...tours.flatMap((t) => [
      `### ${t.title}`, `URL: ${U}/tours/${t.slug}`, `Duration: ${t.days} days. ${t.priceConfirmed ? `Price: from USD ${Number(t.priceFrom).toLocaleString('en-US')} per person.` : ''}${t.offerLabel ? ` Offer: ${t.offerLabel}.` : ''}`,
      `Level: ${t.tier}. Style: ${t.style}. Places: ${(t.destinations || []).join(', ')}.`, '', t.summary || '', '',
      ...(t.highlights || []).slice(0, 8).map((h) => `- ${h}`), '', '**Itinerary**',
      ...(t.itinerary || []).map((d) => `- Day ${d.day}: ${d.title}${d.accommodation ? ` (overnight: ${d.accommodation})` : ''}`), '',
      ...((t.includes || []).length ? ['**Included**', ...t.includes.map((x) => `- ${x}`), ''] : []),
      ...((t.excludes || []).length ? ['**Not included**', ...t.excludes.map((x) => `- ${x}`), ''] : []),
    ]),
  ];
  res.type('text/plain').send(out.join('\n'));
};

/** /tours.json: the safaris as data (title, address, price, days, places, offer), for feeds and AI tools. */
exports.toursJson = async (req, res) => {
  const tours = await toursService.list();
  const U = env.siteUrl;
  res.json({
    provider: { name: site.name, url: U, telephone: site.phone, email: site.email, address: `${site.address.street}, ${site.address.city}, ${site.address.countryName}` },
    currency: 'USD', priceBasis: 'per person',
    tours: tours.map((t) => ({
      title: t.title, url: `${U}/tours/${t.slug}`, days: t.days, level: t.tier, style: t.style, destinations: t.destinations,
      priceFrom: t.priceConfirmed ? t.priceFrom : null, offer: t.offerLabel || null, summary: t.summary, image: t.image ? `${U}${t.image}` : null,
    })),
  });
};
