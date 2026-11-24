const { categories } = require('../../../../store/collections');
const resource = require('../resource');
const { tourVocabulary } = require('../../lib/taxonomy');

const RULES = {
  level: (d) => `Tours of level "${d.ruleValue}"`,
  tag: (d) => `Tours tagged "${d.ruleValue}"`,
  text: (d) => `Tour titles containing "${d.ruleValue}"`,
  bestseller: () => 'Tours marked best seller in CMS > Best-selling safaris',
  all: () => 'Every tour',
};
const ruleText = (d) => (RULES[d.ruleType] || RULES.all)(d) + (d.excludeTag ? `, except tagged "${d.excludeTag}"` : '');

module.exports = resource({
  slug: 'categories', label: 'Tour Categories', singular: 'Category', icon: 'map', collection: categories,
  locked: (d) => d.system === true, // built-in categories can be edited but not deleted
  title: (d) => d.name,
  publicUrl: (d) => `/tanzania-safaris/${d.slug}`,
  searchText: (d) => [d.name, d.slug, d.ruleValue],
  columns: [
    { label: 'Category', cell: (d) => d.name, sub: (d) => `/tanzania-safaris/${d.slug}`, sort: (d) => d.sort ?? 0 },
    { label: 'Picks tours', cell: ruleText },
    { label: 'In menu', cell: (d) => (d.showInMenu ? 'Yes' : 'No'), badge: true },
  ],
  defaults: () => ({ ruleType: 'tag', showInMenu: true }),
  loadOptions: async () => ({ ruleValues: (await tourVocabulary()).ruleValues }),
  afterParse(doc) {
    doc.ruleValue = String(doc.ruleValue || '').trim();
    doc.h1 = doc.h1 || doc.name;
    doc.metaTitle = doc.metaTitle || `${doc.name} | Glad Of Africa`;
    doc.metaDescription = doc.metaDescription || String(doc.intro || '').slice(0, 155);
    return doc;
  },
  check: (doc) => (!['all', 'bestseller'].includes(doc.ruleType) && !doc.ruleValue ? { ruleValue: 'Enter the level, tag or text this category should pick tours by' } : {}),
  sections: [
    { title: 'Category', fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, help: 'Shown on buttons and in the menu.' },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', required: true, from: 'name', help: 'The page will be /tanzania-safaris/<slug>. Cannot be changed after saving.' },
      { name: 'menuLabel', label: 'Menu label (optional)', type: 'text', help: 'Use when the menu should say something shorter or different from the name.' },
      { name: 'showInMenu', label: 'Show in the Tours menu', type: 'checkbox' },
      { name: 'sort', label: 'Display order', type: 'number', help: 'Smaller numbers come first.' },
    ] },
    { title: 'Which tours appear', fields: [
      { name: 'ruleType', label: 'Pick tours by', type: 'select', required: true, options: [
        { value: 'tag', label: 'A tag (e.g. migration)' }, { value: 'level', label: 'A level (e.g. luxury)' },
        { value: 'text', label: 'A word in the tour title (e.g. zanzibar)' }, { value: 'bestseller', label: 'Tours marked best seller' }, { value: 'all', label: 'Every tour' }] },
      { name: 'ruleValue', label: 'Tag, level or word', type: 'text', suggest: 'ruleValues', help: 'Tags and levels are set on each tour. The page fills itself as you tag more tours.' },
      { name: 'excludeTag', label: 'Leave out tours tagged (optional)', type: 'text', suggest: 'ruleValues' },
    ] },
    { title: 'Page text', fields: [
      { name: 'h1', label: 'Page heading', type: 'text' },
      { name: 'intro', label: 'Introduction', type: 'textarea', rows: 3 },
      { name: 'metaTitle', label: 'SEO title', type: 'text', max: 60 },
      { name: 'metaDescription', label: 'SEO description', type: 'textarea', rows: 3, max: 158 },
    ] },
    { title: 'Quick facts table (for search engines and AI assistants)', fields: [
      { name: 'showFacts', label: 'Show the prices-at-a-glance table at the top of this category page', type: 'checkbox' },
      { name: 'bestMonths', label: 'Best months', type: 'text', placeholder: 'Calving Jan-Mar, Mara River Jul-Oct', help: 'Shown in the table. Empty uses a sensible default.' },
      { name: 'factsIncludes', label: 'What is included', type: 'text', placeholder: 'Private 4x4, guide, park fees and lodges', help: 'One short line for the table. Check it matches your itineraries.' },
    ] },
    { title: 'Publishing', side: true, fields: [{ name: 'status', label: 'Status', type: 'status' }] },
  ],
});
