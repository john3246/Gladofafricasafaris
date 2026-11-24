const { customfields } = require('../../../../store/collections');
const resource = require('../resource');
const extras = require('../../../../services/extras.service');

const TARGETS = [{ value: 'tours', label: 'Tours & packages' }, { value: 'destinations', label: 'Destinations' }, { value: 'blog', label: 'Blog posts' }];
const targetLabel = (v) => (TARGETS.find((t) => t.value === v) || {}).label || v;

module.exports = resource({
  slug: 'custom-fields', label: 'Custom Fields', singular: 'Field', icon: 'settings', collection: customfields, publishing: false, canDuplicate: false,
  title: (d) => d.label,
  searchText: (d) => [d.label, d.key, d.appliesTo],
  columns: [
    { label: 'Field', cell: (d) => d.label, sub: (d) => d.help },
    { label: 'Added to', cell: (d) => targetLabel(d.appliesTo), badge: true },
    { label: 'Type', cell: (d) => (extras.TYPES.find((t) => t.value === d.type) || {}).label || d.type },
    { label: 'On website', cell: (d) => (d.showOnSite ? 'Shown' : 'Hidden'), badge: true },
  ],
  defaults: () => ({ appliesTo: 'tours', type: 'text', showOnSite: true }),
  afterParse(doc) {
    doc.options = (doc.options || []).map((o) => o.trim()).filter(Boolean);
    if (doc.type !== 'select') delete doc.options;
    return doc;
  },
  check: (doc) => (doc.type === 'select' && !(doc.options || []).length ? { options: 'Add at least one choice' } : {}),
  sections: [
    { title: 'Field', fields: [
      { name: 'label', label: 'Field name', type: 'text', required: true, placeholder: 'e.g. Best months, Group size, Fitness level' },
      { name: 'key', label: 'Internal name (slug)', type: 'slug', required: true, from: 'label', help: 'Cannot be changed after saving. Must be unique across all custom fields.' },
      { name: 'appliesTo', label: 'Add this field to', type: 'select', required: true, options: TARGETS },
      { name: 'type', label: 'Type of value', type: 'select', required: true, options: extras.TYPES },
      { name: 'options', label: 'Choices (for a choice list)', type: 'lines', rows: 4, help: 'One choice per line.' },
      { name: 'help', label: 'Hint for editors (optional)', type: 'text' },
      { name: 'required', label: 'Editors must fill this in', type: 'checkbox' },
      { name: 'showOnSite', label: 'Show the value on the public page', type: 'checkbox' },
      { name: 'sort', label: 'Display order', type: 'number' },
    ] },
  ],
});
