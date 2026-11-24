const { destinations, regions } = require('../../../../store/collections');
const resource = require('../resource');

module.exports = resource({
  slug: 'destinations', label: 'Destinations', singular: 'Destination', icon: 'pin', collection: destinations, extras: 'destinations',
  title: (d) => d.name,
  publicUrl: (d) => `/destinations/${d.slug}`,
  searchText: (d) => [d.name, d.slug, d.circuit, d.tagline],
  filters: {
    label: 'Region',
    load: async () => (await regions.list()).map((r) => ({ value: r.slug, label: r.title })),
    fn: (d, v) => d.circuit === v,
  },
  columns: [
    { label: 'Destination', cell: (d) => d.name, thumb: (d) => d.image, sub: (d) => d.tagline },
    { label: 'Region', cell: (d) => d.circuit, badge: true },
  ],
  defaults: () => ({ circuit: 'northern', intro: [], wildlife: [] }),
  loadOptions: async () => ({ regions: (await regions.list()).map((r) => ({ value: r.slug, label: r.title })) }),
  afterParse(doc) {
    doc.metaTitle = doc.metaTitle || `${doc.name} | Glad Of Africa`;
    doc.metaDescription = doc.metaDescription || (doc.intro?.[0] || doc.tagline || '').slice(0, 155);
    return doc;
  },
  sections: [
    { title: 'Basics', fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', required: true, from: 'name', help: 'Used in the URL: /destinations/<slug>. Cannot be changed after saving.' },
      { name: 'circuit', label: 'Region', type: 'select', required: true, optionsFrom: 'regions', help: 'Add or rename regions in CMS > Regions.' },
      { name: 'tagline', label: 'Tagline', type: 'text' },
      { name: 'image', label: 'Photo', type: 'image', required: true },
    ] },
    { title: 'Content', fields: [
      { name: 'intro', label: 'Introduction', type: 'paragraphs', rows: 8, help: 'Separate paragraphs with a blank line.' },
      { name: 'bestTime', label: 'Best time to visit', type: 'textarea', rows: 3 },
      { name: 'distance', label: 'Distance from Arusha (optional)', type: 'text', placeholder: 'About 120 km (2 to 2.5 hours by road)', help: 'Shown in the Park facts table. A built-in value is used when empty.' },
      { name: 'parkFees', label: 'Park fees note (optional)', type: 'textarea', rows: 2, help: 'Shown in the Park facts table. A built-in note is used when empty.' },
      { name: 'wildlife', label: 'Wildlife you may see', type: 'lines', rows: 5, help: 'One per line.' },
    ] },
    { title: 'Search engines (SEO)', fields: [
      { name: 'metaTitle', label: 'SEO title', type: 'text', max: 60 },
      { name: 'metaDescription', label: 'SEO description', type: 'textarea', rows: 3, max: 158 },
      { name: 'sort', label: 'Display order', type: 'number' },
    ] },
    { title: 'Publishing', side: true, fields: [{ name: 'status', label: 'Status', type: 'status' }] },
  ],
});
