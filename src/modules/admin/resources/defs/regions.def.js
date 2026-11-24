const { regions, destinations } = require('../../../../store/collections');
const resource = require('../resource');

module.exports = resource({
  slug: 'regions', label: 'Regions', singular: 'Region', icon: 'pin', collection: regions,
  title: (d) => d.title,
  publicUrl: (d) => `/destinations#${d.slug}`,
  searchText: (d) => [d.title, d.slug, d.text],
  columns: [
    { label: 'Region', cell: (d) => d.title, sub: (d) => d.text, sort: (d) => d.sort ?? 0 },
    { label: 'In menu', cell: (d) => (d.showInMenu ? 'Yes' : 'No'), badge: true },
    { label: 'On home page', cell: (d) => (d.showOnHome ? 'Yes' : 'No'), badge: true },
  ],
  defaults: () => ({ showInMenu: true, showOnHome: false }),
  loadOptions: async () => ({ destinations: (await destinations.list()).map((d) => ({ value: d.slug, label: d.name })) }),
  sections: [
    { title: 'Region', fields: [
      { name: 'title', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Northern Circuit' },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', required: true, from: 'title', help: 'Destinations pick their region by this. Cannot be changed after saving.' },
      { name: 'text', label: 'Short description', type: 'textarea', rows: 3, wide: true },
      { name: 'photo', label: 'Photo from destination', type: 'select', optionsFrom: 'destinations', blank: 'No photo', help: 'The photo of this destination is used on the region card.' },
      { name: 'showInMenu', label: 'Show in the Destinations menu', type: 'checkbox' },
      { name: 'showOnHome', label: 'Show in "Regions" sections', type: 'checkbox' },
      { name: 'sort', label: 'Display order', type: 'number', help: 'Smaller numbers come first.' },
    ] },
    { title: 'Publishing', side: true, fields: [{ name: 'status', label: 'Status', type: 'status' }] },
  ],
});
