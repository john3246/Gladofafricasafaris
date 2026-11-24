const { settings } = require('../store/collections');
const { events } = require('../store');
const { site } = require('../config');
const nav = require('../data/nav.data');

/**
 * Site-wide settings edited in CMS > Site Settings. Stored values override the defaults below and are
 * pushed into the shared `site` config object so schema.org data, headers and footers all stay in sync.
 */
const DEFAULTS = {
  phone: site.phone,
  email: site.email,
  street: site.address.street,
  city: site.address.city,
  whatsapp: '',
  facebook: 'https://www.facebook.com/gladofafricasafari',
  instagram: '',
  tiktok: '',
  youtube: '',
  x: '',
  notifyEmail: '',
  // E-mail (CMS > Email). The SMTP login itself stays in the server's SMTP_URL, never in the database.
  mailFromName: '',
  mailFromEmail: '',
  mailReplyTo: '',
  mailBcc: '',
  notifyTeam: true,
  autoReplyGuest: true,
  tripStyles: require('../data/tripstyles'),
  experienceStyles: require('../data/experiences.data'),
  announceOn: false,
  announceText: '',
  announceHref: '',
  maintenance: false,
  noindex: false,
  gaId: '',
  licenseInfo: 'Tourism Agent licence no. 031400, Ministry of Natural Resources and Tourism',
  // Facts for search engines and AI assistants (organisation data on every page).
  ratingValue: '5.0',
  ratingCount: '6',
  memberOf: 'Tanzania Tourist Board',
  paymentsAccepted: 'Visa, Mastercard, Pesapal, Bank Transfer',
  priceRange: '$60 - $6,600',
  profiles: ['https://www.safaribookings.com/p7538'],
  googleVerify: '',
  bingVerify: '',
  ogImage: '',
  footerText: 'We offer Kilimanjaro treks, wildlife safaris, and Zanzibar beach holidays in Tanzania with a dedicated team committed to quality service and safety.',
  hero: {
    line1: 'Tanzania Safaris,',
    line2: 'Beyond the Ordinary',
    text: "Venture deep into the Serengeti, witness the Great Migration, and experience Africa's untamed wilderness with expert guides, handpicked camps, and journeys crafted for lasting memories.",
    image: '/images/hero.webp',
    video: '/video/hero.mp4', // compressed 720p loop; empty = photo only
    videoSmall: '/video/hero-small.mp4', // lighter copy for phones
    poster: '/video/poster.webp', // shown at once while the video loads
  },
  topLinks: nav.topLinks,
  footerLinks: nav.footerLinks,
};

const DEFAULT_OG = site.defaultOgImage;
const SOCIALS = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['x', 'X']];

function applyToSite(s) {
  const digits = String(s.phone).replace(/[^\d]/g, '');
  Object.assign(site, {
    phone: s.phone,
    phoneRaw: `+${digits}`,
    email: s.email,
    whatsapp: s.whatsapp || `https://wa.me/${digits}`,
    defaultOgImage: s.ogImage || DEFAULT_OG,
    address: { ...site.address, street: s.street, city: s.city },
    social: SOCIALS.filter(([k]) => s[k]).map(([k, name]) => ({ name, url: s[k] })),
    facts: {
      licence: String(s.licenseInfo || '').trim(), ratingValue: String(s.ratingValue || '').trim(), ratingCount: String(s.ratingCount || '').trim(), memberOf: String(s.memberOf || '').trim(),
      payments: String(s.paymentsAccepted || '').trim(), priceRange: String(s.priceRange || '').trim(),
      profiles: (Array.isArray(s.profiles) ? s.profiles : []).map((u) => String(u).trim()).filter((u) => /^https:\/\/[^\s"'<>]+$/.test(u)),
    },
  });
}

let cache = null;
let loadedAt = 0;

/** Returns merged settings (cached for 30s; cleared whenever settings are saved). */
async function getSettings() {
  if (cache && Date.now() - loadedAt < 30000) return cache;
  const stored = (await settings.get('site')) || {};
  cache = { ...DEFAULTS, ...stored, hero: { ...DEFAULTS.hero, ...(stored.hero || {}) } };
  // An emptied list would remove the filter / menu entirely; fall back to the built-in lists instead.
  for (const k of ['tripStyles', 'experienceStyles']) if (!Array.isArray(cache[k]) || !cache[k].length) cache[k] = DEFAULTS[k];
  applyToSite(cache);
  loadedAt = Date.now();
  return cache;
}

async function saveSettings(patch) {
  const current = (await settings.get('site')) || { key: 'site' };
  await settings.put({ ...current, ...patch, key: 'site' });
  cache = null;
  return getSettings();
}

events.on('change', (name) => { if (name === 'settings') cache = null; });

module.exports = { getSettings, saveSettings, DEFAULTS, SOCIALS };
