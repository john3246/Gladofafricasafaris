const { collection } = require('./index');

/** Every CMS collection in one place: name, seed data (initial content) and the field that identifies a document. */
const faqSeed = [...require('../data/faqs.json').map((f, i) => ({ ...f, slug: `faq-${i + 1}`, sort: i })), ...require('../data/calving.seo').faqs, ...require('../data/offers.faqs')];
const reviewSeed = require('../data/reviews.data').map((r, i) => ({ ...r, id: `review-${i + 1}`, rating: 5, sort: i }));

module.exports = {
  // Public content
  tours: collection('tours', { seed: require('../data/tours'), keyField: 'slug' }),
  destinations: collection('destinations', { seed: require('../data/destinations'), keyField: 'slug' }),
  posts: collection('posts', { seed: require('../data/posts'), keyField: 'slug' }),
  faqs: collection('faqs', { seed: faqSeed, keyField: 'slug' }),
  reviews: collection('reviews', { seed: reviewSeed, keyField: 'id' }),
  pages: collection('pages', { seed: require('../data/pages.data'), keyField: 'slug' }),
  categories: collection('categories', { seed: require('../data/categories.seed'), keyField: 'slug' }),
  departures: collection('departures', { keyField: 'slug' }),
  regions: collection('regions', { seed: require('../data/regions.seed'), keyField: 'slug' }),
  customfields: collection('customfields', { keyField: 'key' }),
  settings: collection('settings', { seed: [{ key: 'site' }], keyField: 'key' }),
  redirects: collection('redirects', { seed: require('../data/redirects.seed'), keyField: 'id' }),
  // Operations
  inquiries: collection('inquiries', { keyField: 'id' }),
  secrets: collection('secrets', { keyField: 'key' }),
  translations: collection('translations', { keyField: 'key' }),
  policies: collection('policies', { seed: require('../data/policies.seed'), keyField: 'slug' }),
  i18nstatus: collection('i18nstatus', { keyField: 'key' }),
  migrations: collection('migrations', { keyField: 'key' }),
  accommodations: collection('accommodations', { keyField: 'slug' }),
  authtokens: collection('authtokens', { keyField: 'id' }),
  emailtemplates: collection('emailtemplates', { seed: require('../data/emailtemplates.seed'), keyField: 'key' }),
  bookings: collection('bookings', { keyField: 'ref' }),
  subscribers: collection('subscribers', { keyField: 'email' }),
  // System
  users: collection('users', { keyField: 'id' }),
  media: collection('media', { keyField: 'id' }),
  audit: collection('audit', { keyField: 'id' }),
  revisions: collection('revisions', { keyField: 'id' }),
  pageviews: collection('pageviews', { keyField: 'date' }),
  notfound: collection('notfound', { keyField: 'path' }),
};
