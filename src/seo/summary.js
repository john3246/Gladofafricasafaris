/** Plain-language "quick facts" paragraph under the heading of tour and destination pages, built only from the page's own data. */
const trim = (s) => String(s || '').replace(/\s+/g, ' ').replace(/[\s.]+$/, '').trim();
const list = (a, n) => (a || []).map(trim).filter(Boolean).slice(0, n);
const usd = (n) => `$${Number(n).toLocaleString('en-US')}`;

function tour(t, destinations) {
  const names = list((destinations || []).map((d) => d && d.name), 4);
  const tags = t.tags || [];
  const parts = [`${trim(String(t.title).split(' | ')[0])} is a ${t.days}-day ${t.tier} safari from Arusha, Tanzania${names.length ? `, visiting ${names.join(', ')}` : ''}.`];
  if (t.priceConfirmed && t.priceFrom) parts.push(`It starts from ${usd(t.priceFrom)} per person.`);
  const text = `${t.title} ${(t.highlights || []).join(' ')}`;
  if (tags.includes('calving') || /calving/i.test(text)) parts.push('Best months: January to March, during calving season.');
  else if (/mara river|river crossing/i.test(text)) parts.push('Best months: July to October for the Mara River crossings.');
  const hl = list(t.highlights, 2);
  if (hl.length) parts.push(`Highlights: ${hl.join('; ')}.`);
  const inc = list(t.includes, 3);
  if (inc.length) parts.push(`Included: ${inc.join('; ')}.`);
  return parts.join(' ');
}

function destination(d, tours) {
  const parts = [];
  if (d.tagline) parts.push(`${trim(d.name)}: ${trim(d.tagline)}.`);
  if (d.bestTime) parts.push(`Best time to visit: ${trim(d.bestTime)}.`);
  const wl = list(d.wildlife, 6);
  if (wl.length) parts.push(`Wildlife you may see: ${wl.join(', ')}.`);
  const priced = (tours || []).filter((t) => Number(t.priceFrom) > 0);
  if (priced.length) parts.push(`${priced.length} Glad Of Africa safari${priced.length === 1 ? '' : 's'} include${priced.length === 1 ? 's' : ''} ${trim(d.name)}, from ${usd(Math.min(...priced.map((t) => Number(t.priceFrom))))} per person.`);
  return parts.join(' ');
}

module.exports = { tour, destination };
