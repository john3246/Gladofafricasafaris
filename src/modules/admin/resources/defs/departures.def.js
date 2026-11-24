const { departures, tours } = require('../../../../store/collections');
const resource = require('../resource');

module.exports = resource({
  slug: 'departures', label: 'Group departures', singular: 'Departure', icon: 'map', collection: departures,
  title: (d) => d.title,
  publicUrl: () => '/tanzania-safaris/group',
  searchText: (d) => [d.title, d.tourSlug, d.date],
  columns: [
    { label: 'Departure', cell: (d) => d.title, sub: (d) => d.tourSlug, sort: (d) => d.date || '' },
    { label: 'Date', cell: (d) => d.date || '' },
    { label: 'Spots open', cell: (d) => (d.spotsOpen === '' || d.spotsOpen === undefined ? '' : String(d.spotsOpen)) },
  ],
  defaults: () => ({ maxGroup: 6 }),
  loadOptions: async () => ({ tours: (await tours.list()).map((t) => ({ value: t.slug, label: t.title })) }),
  sections: [
    { title: 'Departure', fields: [
      { name: 'title', label: 'Name (only for your list)', type: 'text', required: true, placeholder: '6-Day Big Five group safari, 12 Jan 2027' },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', required: true, from: 'title', help: 'Used only inside the CMS. Cannot be changed after saving.' },
      { name: 'tourSlug', label: 'Safari', type: 'select', optionsFrom: 'tours', required: true },
      { name: 'date', label: 'Start date', type: 'date', required: true },
      { name: 'maxGroup', label: 'Largest group', type: 'number', help: 'Guests in the vehicle at most.' },
      { name: 'spotsOpen', label: 'Spots still open', type: 'number', help: 'Update this as guests book. 0 shows as full.' },
      { name: 'price', label: 'Price per person (USD)', type: 'number', help: 'Leave empty to show the safari\'s "from" price.' },
    ] },
    { title: 'Publishing', side: true, fields: [{ name: 'status', label: 'Status', type: 'status' }] },
  ],
});
