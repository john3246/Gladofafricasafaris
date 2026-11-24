/** Destination regions (CMS > Regions). They group destinations in the menu, on /destinations and on the home page. */
module.exports = [
  { slug: 'northern', title: 'Northern Circuit', sort: 0, photo: 'serengeti-national-park', showOnHome: true,
    text: 'Serengeti, Ngorongoro Crater, Tarangire and Lake Manyara: the classic Big Five and Great Migration route.' },
  { slug: 'southern', title: 'Southern Circuit', sort: 1, photo: 'ruaha-national-park', showOnHome: true,
    text: 'Nyerere, Ruaha, Mikumi and Udzungwa: wild, remote and wonderfully uncrowded.' },
  { slug: 'trekking', title: 'Hiking & Trekking', sort: 2, photo: 'mount-kilimanjaro', showOnHome: false,
    text: 'Kilimanjaro, Mount Meru and Ol Donyo Lengai with experienced mountain guides.' },
  { slug: 'zanzibar', title: 'Zanzibar Beaches', sort: 3, photo: 'stone-town', showOnHome: true,
    text: 'Stone Town, Nungwi and Mnemba: powder-white sand and turquoise water after the bush.' },
].map((r) => ({ showInMenu: true, ...r }));
