const { pages, tours, destinations, regions, categories } = require('../../../../store/collections');
const resource = require('../resource');
const { stripTags } = require('../../lib/text');
const blockTypes = require('../../../blocks/blocks.types');

const URLS = { home: '/', about: '/about-us', terms: '/terms-and-conditions', privacy: '/privacy-policy' };
const CORE = new Set(Object.keys(URLS));
// Addresses used by the website itself; a new page cannot take them.
const RESERVED = new Set(['admin', 'uploads', 'blog', 'tours', 'destinations', 'tanzania-safaris', 'faqs', 'contact-us', 'get-a-quote', 'book', 'reviews', 'accommodations', 'experiences', 'inquiry', 'subscribe',
  'sitemap.xml', 'robots.txt', 'healthz', 'css', 'js', 'images', 'icons', 'fonts']);
const urlOf = (d) => URLS[d.slug] || `/${d.slug}`;

module.exports = resource({
  slug: 'pages', label: 'Pages & Website Content', singular: 'Page', icon: 'file', collection: pages,
  locked: (d) => CORE.has(d.slug),
  title: (d) => stripTags(d.title),
  publicUrl: urlOf,
  searchText: (d) => [d.title, d.slug],
  columns: [
    { label: 'Page', cell: (d) => stripTags(d.title), sub: urlOf, sort: (d) => d.sort ?? 0 },
    { label: 'Sections', cell: (d) => (d.blocks || []).length },
  ],
  defaults: () => ({ blocks: [], menu: 'none' }),
  loadOptions: async () => {
    const [t, d, r, c] = await Promise.all([tours.list(), destinations.list(), regions.list(), categories.list()]);
    return {
      tours: t.map((x) => ({ value: x.slug, label: x.title })),
      destinations: d.map((x) => ({ value: x.slug, label: x.name })),
      regions: r.map((x) => ({ value: x.slug, label: x.title })),
      categories: c.map((x) => ({ value: x.slug, label: x.name })),
    };
  },
  check: (doc) => (RESERVED.has(doc.slug) ? { slug: 'That address is used by the website itself. Choose another.' } : {}),
  afterParse(doc) {
    doc.sort = Number.isFinite(doc.sort) ? doc.sort : 100;
    return doc;
  },
  sections: [
    { title: 'Page', fields: [
      { name: 'title', label: 'Page title', type: 'text', required: true, help: 'You can use <em>word</em> to colour a word green.' },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', required: true, from: 'title', help: 'The page will live at /<slug>. Cannot be changed after saving.' },
      { name: 'subtitle', label: 'Sub-heading', type: 'textarea', rows: 2 },
      { name: 'image', label: 'Banner photo (optional)', type: 'image' },
      { name: 'hideTitle', label: 'Hide the title banner (use when your first section is a hero)', type: 'checkbox' },
      { name: 'body', label: 'Text before the sections (HTML, optional)', type: 'html', rows: 8, help: 'Use <h2>, <p>, <ul><li>, <strong>, <a href="">.' },
    ] },
    { title: 'Page sections', fields: [
      { name: 'blocks', label: 'Build the page from sections', type: 'repeater', itemLabel: 'Section', fields: blockTypes.fields,
        help: 'Add sections, pick a type and fill in what appears. Use the arrows to reorder. Tours, destinations and regions update themselves as your content changes.' },
    ] },
    { title: 'Menu', fields: [
      { name: 'menu', label: 'Show a link to this page in', type: 'select', options: [
        { value: 'none', label: 'Nowhere (link it yourself)' }, { value: 'top', label: 'The top menu' }, { value: 'footer', label: 'The footer' }, { value: 'both', label: 'Top menu and footer' }] },
      { name: 'menuLabel', label: 'Link text (optional)', type: 'text', help: 'Defaults to the page title.' },
      { name: 'sort', label: 'Display order in menus', type: 'number' },
    ] },
    { title: 'Search engines (SEO)', fields: [
      { name: 'metaTitle', label: 'SEO title', type: 'text', max: 60 },
      { name: 'metaDescription', label: 'SEO description', type: 'textarea', rows: 3, max: 158 },
      { name: 'noindex', label: 'Hide from search engines', type: 'checkbox' },
    ] },
    { title: 'Publishing', side: true, fields: [{ name: 'status', label: 'Status', type: 'status' }] },
  ],
});
