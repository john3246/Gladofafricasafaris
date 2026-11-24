const { tours } = require('../../store/collections');
const { isLive } = require('../../store/publicRepository');
const { getSettings } = require('../../services/settings.service');

/**
 * Experiences: the safari styles that describe what a safari is about (Great Migration, Honeymoon, Walking safari...).
 * Which styles are experiences is a list in CMS > Site Settings; each links to the safaris page filtered by that style.
 */
const DEFAULT_EXPERIENCES = require('../../data/experiences.data');

// Experiences that have their own full guide page link there instead of the filtered list.
const LANDING = { 'Calving season (Ndutu)': '/ndutu-calving-season-safari' };
const BLURBS = {
  'Great Migration': 'Follow more than a million wildebeest and zebra across the Serengeti, from calving plains to the Mara River crossings.',
  'Calving season (Ndutu)': 'Newborn wildebeest by the thousand on the southern plains, and the predators that follow them, from January to March.',
  'Big Five': 'Lion, leopard, elephant, buffalo and rhino across Tanzania\'s northern parks, with expert guides who know where to look.',
  'Big cats & photography': 'Slow, patient game drives built around the light, with vehicles set up for photographers and time at every sighting.',
  'Walking safari': 'Leave the vehicle with an armed ranger and read the bush on foot: tracks, birds, insects and the smaller story of the wild.',
  'Hot-air balloon safari': 'Drift over the Serengeti plains at sunrise, then land to a champagne bush breakfast.',
  'Honeymoon & romance': 'Private lodges, quiet camps and sundowners for two, with a beach finish if you like.',
  'Family safari': 'Child-friendly itineraries with shorter drives, family rooms and guides who love to teach young travellers.',
  'Cultural & Maasai visits': 'Meet the people of northern Tanzania: Maasai villages, Hadzabe hunters and local markets.',
  'Birding': 'More than 1,000 bird species across the Rift Valley lakes, the Serengeti and the forests.',
  'Kilimanjaro climb': 'Stand on the roof of Africa. Fully supported climbs on the main routes, with mountain guides and porters.',
  'Mount Meru trek': 'Tanzania\'s second-highest peak: a wildlife-rich trek through forest and along a dramatic crater rim.',
  'Zanzibar beach extension': 'Finish your safari on white sand and turquoise water, with Stone Town and spice farms close by.',
  'Safari + beach combination': 'The classic Tanzanian pairing: days of game drives followed by days of doing nothing on the Indian Ocean.',
};

/** Experiences that at least one live safari has, in the order of the settings list. */
async function list() {
  const settings = await getSettings();
  const wanted = (settings.experienceStyles && settings.experienceStyles.length ? settings.experienceStyles : DEFAULT_EXPERIENCES);
  const live = (await tours.list()).filter(isLive);
  return wanted.map((name) => {
    const matching = live.filter((t) => (t.styles || []).includes(name));
    const pick = matching.find((t) => t.bestSeller && t.image) || matching.find((t) => t.image);
    return { name, count: matching.length, image: pick ? pick.image : '', blurb: BLURBS[name] || '', href: LANDING[name] || `/tanzania-safaris?style=${encodeURIComponent(name)}` };
  }).filter((e) => e.count > 0);
}

module.exports = { list, DEFAULT_EXPERIENCES, BLURBS };
