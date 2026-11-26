/**
 * Last stop before "page not found": addresses left over from the old website (shop pages, dated posts, feeds,
 * categories, old product and article names) are sent to the closest page on this site. Only addresses that would
 * otherwise be a 404 get here, so no real page is ever redirected. Returns { to } for a 301, { gone: true } for
 * spam addresses that should drop out of search engines, or null to keep the normal 404.
 */
const tours = require('../data/tours');

const TOURS = new Set(tours.map((t) => t.slug));

// Scanners and missing files: these stay a plain 404.
const JUNK = /^\/{2}|\.(php|env|git|asp|aspx|jsp|xml|sql|zip|json|yml|yaml|ini|bak|log|txt|js|css|map|ico|png|jpe?g|webp|avif|gif|svg|pdf|csv|gz|rar|7z|sh|py|html?|kml)$|^\/(wp-|img\/|images\/|uploads\/|admin|api\/|xmlrpc|cgi-bin|vendor\/|\.)|(^|\/)(null|undefined)(\/|$)|\/wp-|phpmyadmin/;

// First match wins.
const RULES = [
  [/^\/(rss|blog)$/, '/blog'],
  [/offer-page|deals|discount/, '/offers'],
  [/^\/(northern|southern|western)-tanzania|places-to-visit/, '/destinations'],
  [/domestic-flights/, '/tanzania-safaris/luxury'],
  [/big-five/, '/blog'],
  [/accommodat|lodges?-in|where-to-stay/, '/accommodations'],
  [/^\/(contact|kontakt|contacto|contatti|inquiry|feedback)/, '/contact-us'],
  [/^\/(about|a-propos|meet-our-team|history)(-|\/|$)/, '/about-us'],
  [/^\/(booking-terms|terms)|faq/, '/faqs'],
  [/insurance/, '/travel-insurance'],
  [/quote|^\/book(ing)?$/, '/get-a-quote'],
  [/^\/(shop|cart|checkout|my-account|product-category|product-tag|packages?|collections)(-\d+)?(\/|$)/, '/tanzania-safaris'],
  [/^\/(author|event|events|event_category|event_tag|comments|blog-news|hello-world|tag)(\/|$|-)/, '/blog'],
  [/lemosho/, '/tours/8-day-mount-kilimanjaro-lemosho-route-trek'],
  [/machame/, '/tours/6-day-mount-kilimanjaro-machame-route'],
  [/marangu/, '/tours/6-day-mount-kilimanjaro-marangu-route'],
  [/(^|-|\/)meru(-|\/|$)/, '/destinations/mount-meru'],
  [/lengai/, '/destinations/mount-ol-donyo-lengai'],
  [/kilimanjaro|rongai|uhuru|trek|hiking/, '/destinations/mount-kilimanjaro'],
  [/calving|ndutu/, '/tanzania-safaris/calving-season'],
  [/zanzibar|beach|coastal/, '/tanzania-safaris/zanzibar'],
  [/stone-town/, '/destinations/stone-town'],
  [/nungwi/, '/destinations/nungwi-beach'],
  [/mafia/, '/destinations/mafia-island'],
  [/packing|cost|best-time|when-to|tips|guide|what-to|why-|calendar/, '/blog'],
  [/serengeti(?!.*(day|safari))/, '/destinations/serengeti-national-park'],
  [/ngorongoro(?!.*(day|safari))/, '/destinations/ngorongoro-crater'],
  [/tarangire(?!.*(day|safari))/, '/destinations/tarangire-national-park'],
  [/manyara(?!.*(day|safari))/, '/destinations/lake-manyara-national-park'],
  [/arusha-national/, '/destinations/arusha-national-park'],
  [/mkomazi/, '/destinations/mkomazi-national-park'],
  [/mikumi/, '/destinations/mikumi-national-park'],
  [/ruaha/, '/destinations/ruaha-national-park'],
  [/nyerere|selous/, '/destinations/nyerere-national-park'],
  [/udzungwa/, '/destinations/udzungwa-mountains-national-park'],
  [/katavi|gombe|mahale|rubondo|kitulo|saadani|national-park|destination|circuit/, '/destinations'],
  [/migration/, '/tanzania-safaris/migration'],
  [/luxury|fly-in/, '/tanzania-safaris/luxury'],
  [/budget|camping/, '/tanzania-safaris/budget'],
  [/mid-?range/, '/tanzania-safaris/midrange'],
  [/day-trip|day-excursion/, '/tanzania-safaris/day-trips'],
  [/group/, '/tanzania-safaris/group'],
  [/balloon|walking|canoeing|bird|horse|maasai|cultur|game-drive|city-tour|nature-walk|bush-dinner|village|excursion/, '/experiences'],
  [/safari|tour|\d+-days?-|holiday|itinerary/, '/tanzania-safaris'],
  [/^\/(category|blog|20\d\d)(\/|$)/, '/blog'],
];

function fallback(path) {
  let p = String(path || '').toLowerCase().replace(/\/{2,}$/, '/');
  // spam addresses planted on the old site: tell search engines they are gone for good
  if (/^\/(shopdetail|shopbrand)(\/|$)/.test(p)) return { gone: true };
  if (JUNK.test(p)) return null;
  p = p.replace(/\/(feed(\/(atom|json))?|page\/\d+)\/?$/, '').replace(/\/+$/, '');
  if (p === '') return { to: '/blog' }; // the old /feed
  const product = p.match(/^\/(?:product|tours)\/([a-z0-9-]+?)(-\d)?$/);
  if (product && TOURS.has(product[1])) return { to: `/tours/${product[1]}` };
  const rule = RULES.find(([re]) => re.test(p));
  if (rule) return rule[1] === String(path).toLowerCase() ? null : { to: rule[1] };
  if (/^\/(product|tours)\//.test(p)) return { to: '/tanzania-safaris' };
  return null;
}

module.exports = fallback;
