/**
 * SEO audit of a running server (use a THROWAWAY one): every page in the sitemap is fetched and checked for
 *   - one <h1>, a unique <h1> and <title> across the site, a <title> of at most 60 characters,
 *   - a meta description of 145-155 characters,
 *   - valid JSON-LD (parses, has @type) and one canonical link,
 *   - internal links that answer 200 without a redirect (the whole site is crawled one level from the sitemap).
 *   TEST_PORT=3079 node scripts/seo-audit.js [--verbose]
 */
const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
const verbose = process.argv.includes('--verbose');
const problems = { h1: [], title: [], titleLen: [], desc: [], descLen: [], jsonld: [], canonical: [], dupTitle: [], dupH1: [], links: [] };

const get = async (p) => { const r = await fetch(B + p, { redirect: 'manual' }); return { status: r.status, loc: r.headers.get('location'), html: r.status === 200 ? await r.text() : '' }; };
const langOf = (p) => ((p.match(/^\/(it|fr|de|zh)(?=\/|$)/) || [])[1] || 'en'); // titles and headings only have to be unique within one language
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

(async () => {
  const sm = await (await fetch(B + '/sitemap.xml')).text();
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const titles = new Map(); const h1s = new Map(); const links = new Map();
  for (const p of urls) {
    const { status, html } = await get(p);
    if (status !== 200) { problems.links.push(`${p}: sitemap URL answers ${status}`); continue; }
    const title = text((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    const desc = ((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1]));
    if (h1.length !== 1) problems.h1.push(`${p}: ${h1.length} h1`);
    if (!title) problems.title.push(p); else if (title.length > 60) problems.titleLen.push(`${p}: ${title.length} chars "${title}"`);
    if (!desc) problems.desc.push(p); else if (desc.length < 145 || desc.length > 155) problems.descLen.push(`${p}: ${desc.length} chars`);
    if ((html.match(/<link rel="canonical"/g) || []).length !== 1) problems.canonical.push(p);
    if (title) { const k = `${langOf(p)}|${title}`; titles.set(k, [...(titles.get(k) || []), p]); }
    if (h1[0]) { const k = `${langOf(p)}|${h1[0]}`; h1s.set(k, [...(h1s.get(k) || []), p]); }
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { const j = JSON.parse(m[1]); if (!j['@type'] || !j['@context']) problems.jsonld.push(`${p}: missing @type/@context`); } catch (e) { problems.jsonld.push(`${p}: invalid JSON-LD (${e.message})`); }
    }
    for (const m of html.matchAll(/<a\s[^>]*href="(\/[^"#]*)"/g)) { const h = m[1].replace(/&amp;/g, '&'); if (!links.has(h)) links.set(h, p); }
  }
  for (const [t, ps] of titles) if (ps.length > 1) problems.dupTitle.push(`"${t}": ${ps.join(', ')}`);
  for (const [t, ps] of h1s) if (ps.length > 1) problems.dupH1.push(`"${t}": ${ps.join(', ')}`);
  for (const [h, from] of links) {
    if (/^\/(admin|t\/|uploads|images|img|css|js|icons|blog\/feed)/.test(h) || /\.(xml|txt|webp|jpg|png|svg)$/.test(h)) continue;
    const r = await get(h.split('?')[0] === h ? h : h);
    if (r.status !== 200) problems.links.push(`${h} (linked from ${from}) answers ${r.status}${r.loc ? ' -> ' + r.loc : ''}`);
  }
  let bad = 0;
  console.log(`${urls.length} sitemap pages, ${links.size} distinct internal links checked`);
  for (const [k, v] of Object.entries(problems)) {
    if (!v.length) { console.log(`PASS  ${k}`); continue; }
    bad += 1;
    console.log(`FAIL  ${k}: ${v.length}`);
    (verbose ? v : v.slice(0, 8)).forEach((x) => console.log('        ' + x));
  }
  console.log(bad ? `\n${bad} checks failed` : '\nALL PASSED');
  process.exit(bad ? 1 : 0);
})();
