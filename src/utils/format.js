const usd = (n) => `$${Number(n).toLocaleString('en-US')}`;

const longDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

const truncate = (s, n = 155) => (s.length <= n ? s : `${s.slice(0, n - 1).trim()}…`);

const PLACES = {
  'serengeti-national-park': 'Serengeti',
  'ngorongoro-crater': 'Ngorongoro',
  'tarangire-national-park': 'Tarangire',
  'lake-manyara-national-park': 'Lake Manyara',
  'arusha-national-park': 'Arusha NP',
  'mount-kilimanjaro': 'Kilimanjaro',
  'mount-meru': 'Mount Meru',
  'mount-ol-donyo-lengai': 'Ol Donyo Lengai',
};

/** "Tarangire · Serengeti · Ngorongoro" style route line used on tour cards. */
const route = (slugs = []) => slugs.map((s) => PLACES[s] || s).join(' · ');

const nights = (days) => (days > 1 ? `${days} Days / ${days - 1} Nights` : '1 Day');

module.exports = { usd, longDate, isoDate, truncate, route, nights };
