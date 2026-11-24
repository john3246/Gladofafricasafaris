const { reviews } = require('../../../../store/collections');
const resource = require('../resource');

module.exports = resource({
  slug: 'reviews', label: 'Testimonials & Reviews', singular: 'Review', icon: 'star', collection: reviews,
  title: (d) => d.name,
  publicUrl: () => '/',
  searchText: (d) => [d.name, d.text],
  autoKey: (doc, newId) => newId('review'),
  columns: [
    { label: 'Guest', cell: (d) => d.name, sub: (d) => d.text },
    { label: 'Rating', cell: (d) => '★'.repeat(d.rating || 5) },
  ],
  defaults: () => ({ rating: 5 }),
  afterParse(doc) {
    doc.rating = Math.min(5, Math.max(1, Number(doc.rating) || 5));
    return doc;
  },
  sections: [
    { title: 'Review', fields: [
      { name: 'name', label: 'Guest name', type: 'text', required: true },
      { name: 'text', label: 'Review', type: 'textarea', rows: 6, required: true },
      { name: 'rating', label: 'Rating', type: 'select', options: ['5', '4', '3', '2', '1'] },
      { name: 'sort', label: 'Display order', type: 'number' },
    ] },
    { title: 'Publishing', side: true, fields: [{ name: 'status', label: 'Status', type: 'status' }] },
  ],
});
