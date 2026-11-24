const { tours, pages, faqs, categories, posts } = require('../../store/collections');
const seed = require('../../data/calving.seo');

/**
 * One-time (Nov 2026): adds the calving season / Ndutu search content to databases created before it existed.
 * Nothing an editor already has is overwritten: titles are replaced only while they still match the original text.
 */
async function calving() {
  let n = 0;
  if (!(await categories.get(seed.category.slug))) { await categories.put({ ...seed.category }); n += 1; }
  if (!(await pages.get(seed.page.slug))) { await pages.put({ ...seed.page }); n += 1; }
  for (const f of seed.faqs) if (!(await faqs.get(f.slug))) { await faqs.put({ ...f }); n += 1; }
  for (const slug of seed.SLUGS) {
    const t = await tours.get(slug);
    if (!t) continue;
    const [title, description] = seed.tourMeta[slug];
    const next = { ...t, tags: [...new Set([...(t.tags || []), 'calving'])] };
    const rawFile = require(`../../data/tours/${slug}.json`);
    if (!t.metaTitle || t.metaTitle === rawFile.metaTitle) next.metaTitle = title;
    if (!t.metaDescription || t.metaDescription === rawFile.metaDescription) next.metaDescription = description;
    if (JSON.stringify(next) !== JSON.stringify(t)) { await tours.put(next); n += 1; }
  }
  return `${n} calving season items added or updated`;
}

/** New articles (the calving guides) that are not in the database yet. */
async function articles(list) {
  let n = 0;
  for (const p of list) if (!(await posts.get(p.slug))) { await posts.put({ ...p, sort: 0 }); n += 1; }
  return `${n} articles added`;
}

/** Replaces the "Placeholder" Terms and Privacy pages with real text. Pages an editor already wrote are left alone. */
async function legalPages() {
  const legal = require('../../data/legal.data');
  let n = 0;
  for (const key of ['terms', 'privacy']) {
    const p = await pages.get(key);
    if (p && /Placeholder:/.test(p.body || '')) { await pages.put({ ...p, body: legal[key] }); n += 1; }
  }
  return `${n} legal pages written`;
}


const CAMPING = ['4-day-private-camping-tour-tarangire-serengeti-ngorongoro-crater', '5-day-private-camping-tarangire-serengeti-ngorongoro-crater', '7-day-private-camping-and-lodges-tanzania-safari', '8-days-private-camping-tarangire-serengeti-ngorongoro-crater'];

/** One-time (Nov 2026): the four private camping safaris, plus the campsites they sleep at in CMS > Accommodations. */
async function campingTours() {
  const seed = new Map(require('../../data/tours/index.js').map((t) => [t.slug, t]));
  const top = Math.max(0, ...(await tours.list()).map((t) => Number(t.sort) || 0));
  let n = 0;
  for (const slug of CAMPING) {
    if (!seed.has(slug) || (await tours.get(slug))) continue;
    n += 1;
    await tours.put({ ...seed.get(slug), sort: top + n });
  }
  const { accommodations } = require('../../store/collections');
  const { blurb } = require('./gazetteer');
  const places = [['Seronera Public Campsite', 'Serengeti', 'Public campsite', ['Central Serengeti']], ['Ngorongoro Simba A Campsite', 'Ngorongoro', 'Public campsite', ['Ngorongoro Highlands']]];
  for (const [name, region, kind, facts] of places) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (await accommodations.get(slug)) continue;
    await accommodations.put({ slug, name, type: kind, kind, region, facts, description: blurb({ name, kind, region, facts }), image: '', aliases: [name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()], sort: 400 + n });
  }
  const jevas = await accommodations.get('jevas-hotel');
  if (jevas && !(jevas.aliases || []).includes('jevas hotel encore')) await accommodations.put({ ...jevas, aliases: [...(jevas.aliases || []), 'jevas hotel encore'] });
  return `${n} camping safaris added`;
}

/** One-time (Nov 2026): the Special offers category, offer labels on the calving and holiday safaris, the home page offers section and the Offers / Travel insurance links. */
async function offers() {
  const { categories: cats, settings: set } = require('../../store/collections');
  const seed = require('../../data/offers.seed');
  let n = 0;
  const cat = require('../../data/categories.seed').find((c) => c.slug === 'offers');
  if (cat && !(await cats.get('offers'))) { await cats.put({ ...cat }); n += 1; }
  for (const [slug, o] of Object.entries(seed.byTour)) {
    const t = await tours.get(slug);
    if (t && !t.offerLabel) { await tours.put({ ...t, ...o }); n += 1; }
  }
  for (const f of require('../../data/offers.faqs')) if (!(await faqs.get(f.slug))) { await faqs.put({ ...f }); n += 1; }
  const { policies } = require('../../store/collections');
  for (const p of require('../../data/policies.seed')) if (!(await policies.get(p.slug))) { await policies.put({ ...p }); n += 1; }
  const home = await pages.get('home');
  if (home && !(home.blocks || []).some((b) => b.category === 'offers')) {
    const blocks = [...(home.blocks || [])];
    const at = Math.max(0, blocks.findIndex((b) => b.type === 'hero')) + 1;
    blocks.splice(at, 0, { ...require('../../data/offers.block') });
    await pages.put({ ...home, blocks });
    n += 1;
  }
  const site = await set.get('site');
  if (site) {
    const next = { ...site };
    if (Array.isArray(site.topLinks) && !site.topLinks.some((l) => l.href === '/offers')) next.topLinks = [{ label: 'Offers', href: '/offers' }, ...site.topLinks];
    if (Array.isArray(site.footerLinks) && !site.footerLinks.some((l) => l.href === '/travel-insurance')) next.footerLinks = [...site.footerLinks.slice(0, 2), { label: 'Travel Insurance', href: '/travel-insurance' }, ...site.footerLinks.slice(2)];
    if (JSON.stringify(next) !== JSON.stringify(site)) { await set.put(next); n += 1; }
  }
  return `${n} offer items added`;
}

/** One-time: the privacy page now says that the country of a quote request is noted. Edited pages get the sentence added, not replaced. */
async function privacyCountry() {
  const p = await pages.get('privacy');
  if (!p || /country your connection/.test(p.body || '')) return 'nothing to change';
  const sentence = '<p>When you send a quote request we also note the country your connection comes from, the language of the page you used and the website that sent you, so we can see which countries and offers bring guests. We do not store your IP address with your request.</p>';
  const marker = '<h2>How long we keep it</h2>';
  const body = (p.body || '').includes(marker) ? p.body.replace(marker, `${sentence}
${marker}`) : `${p.body || ''}
${sentence}`;
  await pages.put({ ...p, body });
  return 'privacy page updated';
}

module.exports = { calving, articles, legalPages, campingTours, offers, privacyCountry };
