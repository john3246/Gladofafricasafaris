const { tours } = require('../../store/collections');

/**
 * Safari styles: the labels guests filter safaris by (Luxury, Family, Honeymoon, Great Migration...).
 * The list itself is edited in CMS > Site Settings; each tour ticks the styles it fits in the tour editor.
 */
const has = (text, re) => re.test(text);

/** A first guess for a tour that has no styles yet, from its level, tags, title and places. The editor can change it. */
function infer(t) {
  const title = `${t.title} ${t.slug}`.toLowerCase();
  const tags = (t.tags || []).map((x) => String(x).toLowerCase());
  const dests = (t.destinations || []).join(' ');
  const out = new Set();
  if (t.tier === 'luxury') out.add('Luxury');
  if (t.tier === 'midrange' && !tags.includes('trekking')) out.add('Midrange lodges & tented camps');
  if (t.tier === 'budget' || tags.includes('budget')) out.add('Budget & camping');
  if (tags.includes('luxury') || has(title, /fly-in|fly in/)) out.add('Fly-in safari');
  if (tags.includes('group') || has(title, /group/)) out.add('Joining group safari');
  else if (!tags.includes('day-trips') && !tags.includes('trekking')) out.add('Private safari');
  if (tags.includes('migration') || has(title, /migration|mara river/)) out.add('Great Migration');
  if (has(title, /calving|ndutu/)) out.add('Calving season (Ndutu)');
  if (tags.includes('trekking') || has(title, /kilimanjaro|machame|marangu|lemosho|rongai|umbwe/)) out.add('Kilimanjaro climb');
  if (has(title, /meru/)) out.add('Mount Meru trek');
  if (has(title, /lengai/)) out.add('Ol Doinyo Lengai trek');
  if (tags.includes('day-trips') || t.days === 1) out.add('Day excursions from Arusha');
  if (has(title, /honeymoon|romantic/)) out.add('Honeymoon & romance');
  if (has(title, /family|kids|children/)) out.add('Family safari');
  if (has(title, /big five|big-five|big 5/)) out.add('Big Five');
  if (has(title, /big cat|photograph|cats/)) out.add('Big cats & photography');
  if (has(title, /balloon/)) out.add('Hot-air balloon safari');
  if (has(title, /walking/)) out.add('Walking safari');
  if (has(title, /cultur|maasai|hadzabe/)) out.add('Cultural & Maasai visits');
  if (has(title, /bird/)) out.add('Birding');
  if (has(title, /zanzibar|beach|island/) || has(dests, /stone-town|nungwi|mnemba|zanzibar/)) { out.add('Zanzibar beach extension'); if (t.days > 3 && has(dests, /serengeti|ngorongoro|tarangire|manyara/)) out.add('Safari + beach combination'); }
  if (has(dests, /ruaha|nyerere|mikumi|udzungwa/)) out.add('Southern circuit (Ruaha, Nyerere)');
  else if (has(dests, /serengeti|ngorongoro|tarangire|manyara|arusha/)) out.add('Northern circuit');
  return [...out];
}

/** Gives every tour that has never had styles a first set, once (tours edited in the CMS keep what the editor chose). */
async function ensureTourStyles() {
  let n = 0;
  for (const t of await tours.list()) {
    if (t.styles !== undefined) continue;
    await tours.put({ ...t, styles: infer(t) });
    n += 1;
  }
  return n;
}

/** The filter list for a set of tours: each style that at least one tour has, in the order of the settings list, with counts. */
function filterOptions(list, order) {
  const count = new Map();
  list.forEach((t) => (t.styles || []).forEach((s) => count.set(s, (count.get(s) || 0) + 1)));
  const known = (order || []).filter((s) => count.has(s));
  const extra = [...count.keys()].filter((s) => !known.includes(s)).sort();
  return [...known, ...extra].map((name) => ({ name, count: count.get(name) }));
}

module.exports = { infer, ensureTourStyles, filterOptions };
