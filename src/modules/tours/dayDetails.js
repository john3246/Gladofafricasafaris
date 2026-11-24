const { keyOf, cleanName } = require('../showcase/accommodations');

/**
 * Day-by-day facts for the itinerary: main destination (with its best time), wildlife you may see, activities,
 * overnight place and meals. Anything an editor typed for a day (CMS > Tours > Itinerary) is used as written;
 * otherwise it is worked out from the day's own title and text, and from well-known facts about each park.
 */
const PLACES = [
  { re: /ndutu/i, hub: 'serengeti-national-park', name: 'Ndutu, southern Serengeti', best: 'January to March (calving season)', wildlife: ['Wildebeest', 'Zebra', 'Lion', 'Cheetah', 'Spotted hyena', 'Jackal'] },
  { re: /serengeti|seronera|kogatende/i, hub: 'serengeti-national-park', name: 'Serengeti National Park', best: 'Year-round; the herds move with the seasons', wildlife: ['Lion', 'Leopard', 'Cheetah', 'Elephant', 'Giraffe', 'Zebra', 'Wildebeest', 'Spotted hyena', 'Buffalo'] },
  { re: /ngorongoro|crater|karatu/i, hub: 'ngorongoro-crater', name: 'Ngorongoro Conservation Area', best: 'Year-round; driest from June to October', wildlife: ['Lion', 'Elephant', 'Buffalo', 'Hippo', 'Zebra', 'Wildebeest', 'Spotted hyena', 'Black rhino (rare)'] },
  { re: /tarangire/i, hub: 'tarangire-national-park', name: 'Tarangire National Park', best: 'June to October, when wildlife gathers at the river', wildlife: ['Elephant', 'Giraffe', 'Zebra', 'Wildebeest', 'Buffalo', 'Lion', 'Baobab trees', 'Birdlife'] },
  { re: /manyara|mto wa mbu/i, hub: 'lake-manyara-national-park', name: 'Lake Manyara National Park', best: 'June to October; the green season for birds', wildlife: ['Elephant', 'Baboon', 'Hippo', 'Giraffe', 'Flamingo', 'Tree-climbing lion (sometimes)'] },
  { re: /kilimanjaro|machame|lemosho|marangu|rongai|umbwe|barafu|mweka|shira|barranco/i, hub: 'mount-kilimanjaro', name: 'Mount Kilimanjaro National Park', best: 'January to March and June to October', wildlife: ['Colobus monkey', 'Blue monkey', 'Alpine birds'] },
  { re: /meru|momella/i, hub: 'mount-meru', name: 'Arusha National Park and Mount Meru', best: 'June to February', wildlife: ['Giraffe', 'Buffalo', 'Colobus monkey', 'Flamingo'] },
  { re: /zanzibar|stone town|nungwi|paje/i, hub: 'stone-town', name: 'Zanzibar', best: 'June to October and December to February', wildlife: [] },
  { re: /arusha|airport|arrival|briefing/i, name: 'Arusha', best: 'Year-round', wildlife: [] },
];

const ACTIVITIES = [
  [/crater[\s\S]{0,80}(descend|game drive)|descend[\s\S]{0,60}crater/i, 'Ngorongoro Crater game drive'],
  [/game drive/i, 'Game drive'],
  [/picnic lunch/i, 'Picnic lunch in the park'],
  [/maasai/i, 'Maasai community and scenery'],
  [/briefing/i, 'Safari briefing'],
  [/balloon/i, 'Hot-air balloon (optional)'],
  [/flight|fly(ing)? (to|from|in|out)|airstrip/i, 'Bush flight'],
  [/trek|hike|summit|ascend/i, 'Trekking'],
  [/(drive|journey|travel)[\s\S]{0,30}(towards|to)\s/i, 'Scenic drive'],
  [/beach|snorkel|spice|stone town/i, 'Zanzibar excursion'],
];

const list = (v) => (Array.isArray(v) ? v : String(v || '').split(/[,;\n]/)).map((s) => s.trim()).filter(Boolean);

function meals(d) {
  if (d.meals) return list(d.meals);
  const fromField = String(d.accommodation || '').match(/meals?(?:\s*plan)?\s*:\s*(.+)$/i);
  if (fromField) return list(fromField[1].replace(/[.]/g, ''));
  const t = String(d.text || '');
  return [/breakfast/i.test(t) && 'Breakfast', /lunch/i.test(t) && 'Lunch', /dinner/i.test(t) && 'Dinner'].filter(Boolean);
}

/** @param itinerary tour.itinerary  @param photos matching day photos  @param lodges accommodation documents */
function build(itinerary, photos, lodges = []) {
  const byKey = new Map();
  lodges.forEach((a) => { byKey.set(keyOf(a.name), a); (a.aliases || []).forEach((k) => byKey.set(k, a)); });
  return itinerary.map((d, i) => {
    const hay = `${d.title} ${d.accommodation || ''} ${d.text}`;
    const place = PLACES.find((p) => p.re.test(`${d.title} ${d.accommodation || ''}`)) || PLACES.find((p) => p.re.test(hay));
    const lodgeName = cleanName(d.accommodation);
    const lodge = lodgeName ? byKey.get(keyOf(lodgeName)) : null;
    const activities = d.activities ? list(d.activities) : ACTIVITIES.filter(([re]) => re.test(d.text)).map(([, label]) => label);
    return {
      day: d.day, title: d.title, paragraphs: String(d.text || '').split('\n\n').filter(Boolean), photo: photos[i] || '',
      destination: d.destination || (place && place.name) || '',
      hub: place && place.hub ? place.hub : '',
      bestTime: d.destination ? '' : (place && place.best) || '',
      wildlife: d.wildlife ? list(d.wildlife) : (place && place.wildlife) || [],
      activities: activities.slice(0, 6),
      overnight: String(d.accommodation || '').replace(/\s*meals?(\s*plan)?\s*:.*$/i, '').replace(/[.\s]+$/, ''),
      lodge: lodge && lodge.slug ? { slug: lodge.slug, name: lodge.name } : null,
      meals: meals(d),
    };
  });
}

module.exports = { build };
