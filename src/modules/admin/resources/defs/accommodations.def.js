const { accommodations } = require('../../../../store/collections');
const resource = require('../resource');

const REGIONS = require('../../../../data/accommodations.data').REGIONS;

module.exports = resource({
  slug: 'accommodations', label: 'Accommodations', singular: 'Accommodation', icon: 'pin', collection: accommodations,
  title: (d) => d.name,
  publicUrl: () => '/accommodations',
  searchText: (d) => [d.name, d.type, d.description],
  columns: [
    { label: 'Name', cell: (d) => d.name, thumb: (d) => d.image, sub: (d) => d.description || 'No description yet', sort: (d) => d.sort ?? 0 },
    { label: 'Region', cell: (d) => d.region || 'No region', badge: true },
    { label: 'Kind', cell: (d) => d.kind || d.type || '' },
  ],
  defaults: () => ({ region: 'Serengeti', aliases: [], facts: [] }),
  afterParse(doc) {
    doc.type = doc.kind || doc.type;
    doc.aliases = (doc.aliases || []).map((a) => a.toLowerCase().replace(/\bsafari\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim()).filter(Boolean);
    return doc;
  },
  sections: [
    { title: 'Accommodation', fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', required: true, from: 'name', help: 'Part of the web address: /accommodations/this-name. Cannot be changed after saving.' },
      { name: 'region', label: 'Region (the filter on the page)', type: 'select', options: REGIONS, required: true },
      { name: 'kind', label: 'Kind of place', type: 'text', placeholder: 'Tented camp, Luxury lodge, Hotel...' },
      { name: 'facts', label: 'Good to know (one per line)', type: 'lines', rows: 4, wide: true, help: 'Short facts: number of rooms, distance, pool, solar power...' },
      { name: 'image', label: 'Photo', type: 'image', help: 'Your own photo of the place. Until you add one, the page shows a photo of the area. Many photos at once: CMS > Accommodation photos.' },
      { name: 'gallery', label: 'More photos', type: 'gallery', wide: true },
      { name: 'imageUrl', label: 'Or a photo link (https://...)', type: 'text', placeholder: 'https://', help: 'Only if the lodge or the photographer gave you permission to use that photo. Links can stop working, so uploading the photo is safer.' },
      { name: 'description', label: 'Short description', type: 'textarea', rows: 4, wide: true, help: 'A few honest sentences: where it is, what it is like. Shown on the Accommodations page.' },
    ] },
    { title: 'Matching the itineraries', fields: [
      { name: 'aliases', label: 'Other spellings used in itineraries (one per line)', type: 'lines', rows: 3, help: 'The page lists the safaris whose itinerary names this place. Add spellings if a tour writes the name differently.' },
      { name: 'sort', label: 'Display order', type: 'number' },
    ] },
    { title: 'Publishing', side: true, fields: [{ name: 'status', label: 'Status', type: 'status' }] },
  ],
});
