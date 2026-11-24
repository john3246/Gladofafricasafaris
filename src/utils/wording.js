/**
 * House wording: the site never uses the word "trip". "Day trips" are "day excursions"; "your trip" is "your safari";
 * any other "trip" is "tour". Web addresses, tags and code names (day-trips, TouristTrip, trip.js) are left alone.
 */
const DAY = /(?<![\w/.-])(Day|day|Full-day|full-day)( )(Trips?|trips?)(?![\w/-]|\.\w|:)/g;
const EXPERIENCE = /\bDay Trip Experience\b/g;
const ANY = /(?<![\w/.-])((?:[Yy]our|[Tt]he|[Tt]his|[Aa]|[Oo]ne|[Ee]very|[Ss]ame|[Oo]verall|[Ee]ntire|[Oo]ur|[Tt]heir) )?(Trips?|trips?)(?![\w/-]|\.\w|:)/g;

const keepCase = (from, word) => (/^[A-Z]/.test(from) ? word[0].toUpperCase() + word.slice(1) : word);

function rewrite(text) {
  if (typeof text !== 'string' || !/trip/i.test(text)) return text;
  return text
    .replace(EXPERIENCE, 'Day Excursions')
    .replace(DAY, (m, day, sp, trip) => `${day}${sp}${keepCase(trip, 'excursion')}${/s$/i.test(trip) ? 's' : ''}`)
    .replace(ANY, (m, pre, trip) => `${pre || ''}${keepCase(trip, pre ? 'safari' : 'tour')}${/s$/i.test(trip) ? 's' : ''}`);
}

/** Applies rewrite() to every text value inside a stored document (keys, numbers and web addresses are left as they are). */
function rewriteDeep(value) {
  if (typeof value === 'string') return rewrite(value);
  if (Array.isArray(value)) return value.map(rewriteDeep);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewriteDeep(v)]));
  return value;
}

module.exports = { rewrite, rewriteDeep };
