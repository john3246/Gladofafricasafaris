/**
 * Languages of the website. English is the default and has no prefix in the address; Italian, French and German are
 * served under /it, /fr and /de by the same pages: the words around the content come from the dictionary in strings.js,
 * and pages that are fully translated are listed in TRANSLATED (those, and only those, are offered to search engines).
 */
const LANGS = [
  { code: 'en', label: 'EN', name: 'English', locale: 'en_US' },
  { code: 'es', label: 'ES', name: 'Español', locale: 'es_ES' },
  { code: 'it', label: 'IT', name: 'Italiano', locale: 'it_IT' },
  { code: 'fr', label: 'FR', name: 'Français', locale: 'fr_FR' },
  { code: 'de', label: 'DE', name: 'Deutsch', locale: 'de_DE' },
  { code: 'zh', label: 'ZH', name: '中文', locale: 'zh_CN' },
];
const CODES = LANGS.map((l) => l.code);

// Pages that exist in every language with the whole page translated (they get hreflang tags and sit in the sitemap).
const TRANSLATED = ['/', '/offers', '/travel-insurance', '/tanzania-safaris', '/destinations', '/contact-us', '/get-a-quote', '/about-us', '/faqs'];

const isTranslatedPath = (path) => TRANSLATED.includes((path.length > 1 ? path.replace(/\/+$/, '') : path) || '/');

/** The address of a path in a language: /it/offers, or /offers for English. */
const href = (lang, path) => (lang === 'en' ? path || '/' : `/${lang}${path && path !== '/' ? path : ''}`);

module.exports = { LANGS, CODES, TRANSLATED, isTranslatedPath, href };
