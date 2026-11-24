/**
 * Safari lodges, camps and hotels across northern and southern Tanzania. Each row is: Name | Region | Kind | Facts.
 * Only plain facts are kept here (where it is, what kind of place, a few numbers). The wording shown on the website
 * is written by Glad Of Africa and photos are your own: edit both in CMS > Accommodations.
 */
const ROWS = `
Naserian Safari Camp | Ngorongoro | Exclusive camp | 10 rooms; 20 minutes from the crater
Isoitok Camp Manyara | Lake Manyara | Family-friendly camp | About 1.5 hours from Arusha
Manyara's Secret | Lake Manyara | Lodge |
Lake Burunge Tented Lodge | Tarangire | Tented lodge | 30 rooms: 20 tents and 10 bungalows
Crater's Edge | Ngorongoro | Wilderness collection property |
Kibo Palace Arusha | Arusha | Luxury hotel | Jacuzzis in all suites; 45 minutes from Kilimanjaro airport
Serengeti Acacia Bliss | Serengeti | Family-run safari camp |
Mysigio Camp | Ngorongoro | Luxury highland camp | 12 tents; solar powered
Lemala Nanyukie Lodge | Serengeti | Luxury lodge | 60 minutes east of Seronera airstrip
Karibu Tarangire Elephant Springs | Tarangire | Suites | Private balconies; infinity pool
Elewana Serengeti Explorer | Serengeti | Luxury lodge |
Pink Flamingo Tanzania | Moshi | Boutique hotel | Private-pool villas; 5 minutes from Moshi town; 30 minutes from Kilimanjaro airport
Kibo Palace Hotel | Moshi | Luxury hotel | Serviced three-bedroom villas
Kaliwa Lodge | Moshi | Lodge | Bauhaus-inspired design; bar
Embalakai Ngorongoro | Ngorongoro | Tented camp | Sundowner deck; fire pit
Simbavati Migration Camp | Serengeti | Luxury mobile camp | 6 tents; moves twice a year
Nimali Mara | Serengeti | Boutique tented camp | Kogatende, northern Serengeti; 30 minutes from the Mara River
Mbali Mbali Soroi Serengeti | Serengeti | Hilltop lodge | 25 thatched rooms; infinity pool
Nyumbani | Serengeti | Mobile tented camp | 8 luxury suites
Serenity on the Lake | Lake Victoria | Lakeside resort | About 20 km from Ndabaka gate
Speke Bay Lodge | Lake Victoria | Thatched lodge | 15 km from Serengeti National Park
Lemala Mara Ndutu Camp | Serengeti | Mobile tented camp | Moves between the Mara and Ndutu
Mara Under Canvas | Serengeti | Seasonal luxury camp | Open June to November; 10 double tents plus a family tent
Karibu Serengeti River Camp | Serengeti | Camp | A few metres from the Mara River
Africa Safari South Serengeti | Serengeti | Lodge | South of Lake Ndutu
Cherero Camp | Serengeti | Tented camp | 50 square metre suites; private verandahs
Katambuga House | Arusha | Guest house | Garden setting; coffee estates nearby
Melia Ngorongoro Lodge | Ngorongoro | Lodge |
Enkutoto Migration Camp | Serengeti | Tented camp | 10 tents with en-suite bathrooms; tented dining and bar
Nyikani Tarangire Camp | Tarangire | Wilderness camp |
The Retreat at Ngorongoro | Ngorongoro | Lodge |
Mawe Mawe Manyara Lodge | Lake Manyara | Lodge | Infinity pool
Mara Kati Kati (North) | Serengeti | Mobile camp | Northern Serengeti
Karibu Sametu Camp (Central) | Serengeti | Luxury boutique camp | Near the Ngare Nanyuki River
Karatu Simba Lodge | Ngorongoro | Lodge | 30 minutes from the Lake Manyara park gate
Acacia Farm Lodge | Ngorongoro | Luxury suites | Manicured gardens
Kitela Lodge | Ngorongoro | Colonial-style cottages | 20 cottages; spa; pool
Ngorongoro Oldeani Mountain Lodge | Ngorongoro | Colonial-style lodge |
Plantation Lodge | Ngorongoro | Suites | Four-bedroom garden house
Pioneer Camp | Serengeti | Tented camp | 12 tents, including a two-bedroom family tent
Ndovu Tented Lodge | Tarangire | Tented lodge |
Lemala Mpingo Ridge | Tarangire | Lodge | On an escarpment
Elewana The Manor | Lake Manyara | Country house | Inside a 1,500 acre Arabica coffee estate
Serena Serengeti (Central) | Serengeti | Lodge | Infinity pool
Sanctuary Swala Camp | Tarangire | Eco-friendly camp |
Taasa Lodge (North) | Serengeti | Lodge | Private concession
Lake Masek (South) | Serengeti | Tented camp | Private tent terraces
Ecoscience Lodge | Tarangire | Lodge | 20 km south of Makuyuni
Mandhari Lodge | Lake Manyara | Lodge | On the Manyara escarpment
Nasikia Serengeti Camp | Serengeti | Mobile and semi-permanent camps |
Four Points | Arusha | Hotel | 114 rooms
Olerai Lodge | Arusha | Lodge | A former private residence
Tarangire Kuro Treetops Lodge | Tarangire | Luxury lodge | On a kopje hill
Pakulala Ngorongoro Camp | Ngorongoro | Exclusive campsite | Above the crater rim
Karibu Lion's Paw | Ngorongoro | Lodge | 15 luxury suites; eastern crater rim
Lemala Ngorongoro | Ngorongoro | Lodge | Eastern side, near the rim
Tanzania Bush Camp | Serengeti | Mobile camp | 10 luxury tents with en-suite bathrooms
Tloma Lodge | Ngorongoro | Small exclusive lodge | 24 colonial cottages; heated pool
Villa Maua | Arusha | Boutique property | 9 garden rooms
Best View Lodge | Lake Manyara | Lodge | On the Rift Valley escarpment
Ngorongoro Kuhama Camp | Ngorongoro | Private campsite | About 15 minutes' drive to the crater floor
Serian Tarangire Camp | Tarangire | Luxury thatched camp | Near Kuro airstrip
Melia Serengeti | Serengeti | Lodge | Luxury hotel services
Enkirari Wilderness Camp | Serengeti | Wilderness camp | Seronera
Asanja Grumeti | Serengeti | Luxury tented camp | 3 private guest tents; open year-round
Sanctuary Kichakani | Serengeti | Mobile luxury tented camp |
Gran Melia | Arusha | Hotel | 18 acres; spa; heated pool
Lake Manyara Kilimamoja Lodge | Lake Manyara | Lodge | Over 130 bird species recorded
&Beyond Ngorongoro Crater Lodge | Ngorongoro | Luxury lodge | On the crater rim
Africa Safari Lake Natron | Lake Natron | Luxury lodge |
Rufiji River Camp | Selous Game Reserve | Camp | Redesigned in 2009
Lake Manze Tented Camp | Selous Game Reserve | Tented camp | 12 walk-in tents
Selous Impala Camp | Selous Game Reserve | Camp |
Serena Mivumo River Lodge | Selous Game Reserve | Boutique lodge |
Roho ya Selous | Selous Game Reserve | Tented camp | 8 tented rooms
Nomad Sand Rivers | Selous Game Reserve | Lodge | On the Rufiji River
Mdonya Old River Camp | Ruaha National Park | Light-footprint camp | On a plateau at about 1,000 m
Ruaha River Lodge | Ruaha National Park | Lodge | 24 stone-and-thatch chalets
Ikuka Safari Camp | Ruaha National Park | Owner-run camp |
Asanja Ruaha | Ruaha National Park | Luxury tented suites | 8 suites of 140 square metres each; plunge pools
Nomad's Kigelia Ruaha | Ruaha National Park | Bush camp |
Jabali Ridge | Ruaha National Park | Lodge | On a kopje
Planet Lodge | Arusha | Village-style lodge | Air conditioning; balconies
Arusha Villa | Arusha | Villa | On the outskirts of Arusha
Tarangire Simba Lodge | Tarangire | Lodge | Near Sangaiwe gate
Tarangire Nimali Camp | Tarangire | Camp | Private concession
Escarpment Luxury Lodge | Lake Manyara | Luxury lodge | 16 chalets
Sanctuary Ngorongoro Camp | Ngorongoro | Camp | Near the crater access road
Olkarien Eco Safari Camp | Serengeti | Eco safari camp |
Mbalageti | Serengeti | Tented chalets | On the Mbalageti River corridor
Nimali Central Serengeti | Serengeti | Luxury tented camp | Near Makoma Hill
Ziwani Lodge | Lake Eyasi | Eco-lodge | Solar and wind power only
Maasai Giraffe Eco Lodge | Lake Natron | Eco lodge and campsite | In Engaresero village
Natron River Camp | Lake Natron | Camp | 8 safari tents
Lake Natron Halisi Camp | Lake Natron | Camp | 9 acres
Lake Natron Camp | Lake Natron | Ecological camp |
Kisima Ngeda | Lake Eyasi | Camp | 7 tents
African Tulip | Arusha | Luxury boutique hotel | 29 rooms and 7 suites
Rivertrees Country Inn | Arusha | Country inn | 10 acres
Coffee Lodge | Arusha | Lodge | 30 plantation houses
Pumzika Tented Camp | Serengeti | Tented camp | 6 tents
Nyikani Camps | Serengeti | Mobile and central camps | The central camp is open year-round
Alex Walker Serian | Serengeti | Camp collection | Kenya and Tanzania
Serengeti Four Seasons | Serengeti | Hotel | 77 rooms, suites and villas; air conditioning
Neptune Lodge | Ngorongoro | All-inclusive lodge | 20 log cabins with fireplaces
Ngorongoro Highlands | Ngorongoro | Camp | By the Olmoti volcano
Tarangire Sopa Lodge | Tarangire | Lodge |
Oliver's Camp | Tarangire | Safari tent camp | 10 tents
Ngorongoro Serena Lodge | Ngorongoro | Lodge | On the crater rim
Manyara Serena Lodge | Lake Manyara | Lodge | Two-storey rondavels
Gibbs Farm | Lake Manyara | Farm lodge | Cottages
&Beyond Manyara Tree Lodge | Lake Manyara | Treehouse lodge | Stilted treehouse suites
Lake Eyasi Safari Lodge | Lake Eyasi | Lodge | 16 en-suite rooms in double cottages; solar powered
`;

const REGIONS = ['Ngorongoro', 'Lake Manyara', 'Tarangire', 'Arusha', 'Serengeti', 'Moshi', 'Lake Victoria', 'Lake Natron', 'Selous Game Reserve', 'Ruaha National Park', 'Lake Eyasi', 'Kilimanjaro'];

const list = ROWS.trim().split('\n').map((line, i) => {
  const [name, region, kind, facts] = line.split('|').map((s) => s.trim());
  return { name, region, kind, facts: facts ? facts.split(';').map((f) => f.trim()).filter(Boolean) : [], n: i + 1 };
});

module.exports = { list, REGIONS };
