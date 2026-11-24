const { faqs } = require('../../../../store/collections');
const resource = require('../resource');

module.exports = resource({
  slug: 'faqs', label: 'FAQs', singular: 'FAQ', icon: 'help', collection: faqs,
  title: (d) => d.q,
  publicUrl: () => '/faqs',
  searchText: (d) => [d.q, d.a, d.group],
  autoKey: (doc, newId) => newId('faq'),
  columns: [
    { label: 'Question', cell: (d) => d.q, sub: (d) => d.a },
    { label: 'Group', cell: (d) => d.group || 'General', badge: true },
  ],
  defaults: () => ({ group: 'General' }),
  sections: [
    { title: 'Question & answer', fields: [
      { name: 'q', label: 'Question', type: 'text', required: true },
      { name: 'a', label: 'Answer', type: 'textarea', rows: 6, required: true },
      { name: 'group', label: 'Group', type: 'text', placeholder: 'General, Best time to travel, Booking & payments' },
      { name: 'sort', label: 'Display order', type: 'number', help: 'Lower numbers appear first. The first 6 show on the home page.' },
    ] },
    { title: 'Publishing', side: true, fields: [{ name: 'status', label: 'Status', type: 'status' }] },
  ],
});
