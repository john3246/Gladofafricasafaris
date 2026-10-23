const fs = require('fs');
const path = require('path');
const { BASE, getHtml } = require('./http');
const { parseDestination } = require('./parseDestination');
const { saveWebp } = require('./images');
const extras = require('./destination-extras');

const OUT = path.join(__dirname, '..', '..', 'src', 'data', 'destinations');

/** [my slug, live-site path, circuit]. Circuits drive the "Explore Tanzania by region" cards. */
const LIST = [
  ['serengeti-national-park', 'serengeti-national-park', 'northern'],
  ['ngorongoro-crater', 'ngorongoro-crater', 'northern'],
  ['tarangire-national-park', 'tarangire-national-park', 'northern'],
  ['lake-manyara-national-park', 'lake-manyara-national-park-2', 'northern'],
  ['arusha-national-park', 'arusha-national-park', 'northern'],
  ['mkomazi-national-park', 'mkomazi-national-park', 'northern'],
  ['kilimanjaro-national-park', 'kilimanjaro-national-park', 'northern'],
  ['udzungwa-mountains-national-park', 'udzungwa-mountains-national-park', 'southern'],
  ['mikumi-national-park', 'mikumi-national-park', 'southern'],
  ['nyerere-national-park', 'nyerere-national-park', 'southern'],
  ['ruaha-national-park', 'ruaha-national-park', 'southern'],
  ['mount-kilimanjaro', 'mount-kilimanjaro', 'trekking'],
  ['mount-meru', 'mount-meru-2', 'trekking'],
  ['mount-ol-donyo-lengai', 'mount-ol-donyo-lengai', 'trekking'],
  ['stone-town', 'stone-town', 'zanzibar'],
  ['nungwi-beach', 'nungwi-beach', 'zanzibar'],
  ['mnemba-island', 'mnemba-island', 'zanzibar'],
  ['chumbe-island', 'chumbe-island', 'zanzibar'],
  ['chole-island', 'chole-island', 'zanzibar'],
  ['mafia-island', 'mafia-island', 'zanzibar'],
];

async function importDestinations() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.readdirSync(OUT).filter((f) => f.endsWith('.json')).forEach((f) => fs.unlinkSync(path.join(OUT, f)));
  for (const [i, [slug, page, circuit]] of LIST.entries()) {
    const d = parseDestination(await getHtml(`${BASE}/${page}/`));
    const extra = extras.find((e) => e.slug === slug) || {};
    const image = d.image ? await saveWebp(d.image, `images/destinations/${slug}`, 1400) : null;
    const name = extra.name || d.name;
    const dest = {
      slug, circuit, sort: i, name,
      tagline: extra.tagline || d.description.slice(0, 110),
      intro: extra.intro || d.intro,
      bestTime: extra.bestTime || '',
      wildlife: extra.wildlife || [],
      image,
      metaTitle: extra.metaTitle || `${name} | Glad Of Africa`,
      metaDescription: extra.metaDescription || d.description.slice(0, 155),
    };
    fs.writeFileSync(path.join(OUT, `${slug}.json`), `${JSON.stringify(dest, null, 1)}\n`);
    console.log(`  dest ${slug} img:${!!image} intro:${dest.intro.length}`);
  }
}

module.exports = { importDestinations };
