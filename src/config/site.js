const env = require('./env');

/** Single source of truth for brand + NAP (name/address/phone) used by SEO schema, header, footer. */
module.exports = {
  name: 'Glad Of Africa Safari & Tours',
  shortName: 'Glad Of Africa',
  tagline: 'Tanzania Safaris, Beyond the Ordinary',
  url: env.siteUrl,
  phone: '+255-695-108-009',
  phoneRaw: '+255695108009',
  whatsapp: 'https://wa.me/255695108009',
  email: 'info@gladofafricasafari.com',
  address: { street: '402 Sakina', city: 'Arusha', region: 'Arusha', country: 'TZ', countryName: 'Tanzania' },
  geo: { lat: -3.3869, lng: 36.683 },
  logo: '/images/logo-green.png',
  logoWhite: '/images/logo-white.png',
  defaultOgImage: '/images/og-default.webp',
  themeColor: '#123524',
  social: [{ name: 'Facebook', url: 'https://www.facebook.com/gladofafricasafari' }],
};
