const { policies } = require('../../../../store/collections');
const resource = require('../resource');

/** Policy pages such as Travel insurance (written once in English; the other languages are translated from it). */
module.exports = resource({
  slug: 'policies', label: 'Policy pages', singular: 'Policy page', icon: 'file', collection: policies,
  title: (d) => d.h1,
  publicUrl: (d) => `/${d.slug}`,
  searchText: (d) => [d.h1, d.intro],
  columns: [{ label: 'Page', cell: (d) => d.h1, sub: (d) => `/${d.slug}` }, { label: 'Sections', cell: (d) => String((d.sections || []).length) }],
  defaults: () => ({ sections: [], faqs: [] }),
  afterParse(doc) {
    doc.sections = (doc.sections || []).map((s) => ({ h: s.h || '', p: String(s.p || '').split(/\n{2,}/).map((x) => x.trim()).filter(Boolean), ul: String(s.ul || '').split('\n').map((x) => x.trim()).filter(Boolean) }));
    doc.faqs = (doc.faqs || []).filter((f) => f && f.q && f.a);
    return doc;
  },
  sections: [
    { title: 'Page', fields: [
      { name: 'h1', label: 'Main heading', type: 'text', required: true },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', required: true, from: 'h1', help: 'The page is at /this-name. Cannot be changed after saving.' },
      { name: 'sub', label: 'Short line under the heading', type: 'textarea', rows: 2 },
      { name: 'intro', label: 'Opening paragraph', type: 'textarea', rows: 4, wide: true },
      { name: 'metaTitle', label: 'Search result title', type: 'text' },
      { name: 'metaDescription', label: 'Search result description', type: 'textarea', rows: 2 },
    ] },
    { title: 'Sections', fields: [
      { name: 'sections', label: 'Sections', type: 'repeater', itemLabel: 'Section', fields: [
        { name: 'h', label: 'Heading', type: 'text' },
        { name: 'p', label: 'Paragraphs (blank line between them)', type: 'textarea', rows: 5 },
        { name: 'ul', label: 'Bullet points (one per line)', type: 'textarea', rows: 4 },
      ] },
    ] },
    { title: 'Questions', fields: [
      { name: 'faqs', label: 'Questions and answers', type: 'repeater', itemLabel: 'Question', fields: [
        { name: 'q', label: 'Question', type: 'text' },
        { name: 'a', label: 'Answer', type: 'textarea', rows: 3 },
      ] },
    ] },
    { title: 'Publishing', side: true, fields: [{ name: 'status', label: 'Status', type: 'status' }] },
  ],
});
