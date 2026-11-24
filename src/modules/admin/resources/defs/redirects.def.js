const { redirects } = require('../../../../store/collections');
const resource = require('../resource');
const { normalise } = require('../../../../middleware/redirects');

module.exports = resource({
  slug: 'redirects', label: 'Redirects & 404s', singular: 'Redirect', icon: 'link', collection: redirects, publishing: false, canDuplicate: false,
  title: (d) => `${d.from} → ${d.to}`,
  searchText: (d) => [d.from, d.to, d.note],
  autoKey: (doc, newId) => newId('rd'),
  defaults: () => ({ code: '301', enabled: true, hits: 0 }),
  prefill: async (q) => (q.from ? { from: q.from } : {}),
  afterParse(doc) {
    doc.from = normalise(`/${String(doc.from || '').replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, '')}`);
    doc.hits = doc.hits || 0;
    return doc;
  },
  check: (doc) => {
    const e = {};
    if (doc.to && !/^(\/|https?:\/\/)/.test(doc.to)) e.to = 'Start with / for a page on this site, or https:// for another website';
    if (doc.from && normalise(doc.from) === normalise(doc.to)) e.to = 'The destination must be different from the old address';
    return e;
  },
  filters: { label: 'State', options: [{ value: 'on', label: 'Active' }, { value: 'off', label: 'Disabled' }], fn: (d, v) => (v === 'on') === (d.enabled !== false) },
  columns: [
    { label: 'Old address', cell: (d) => d.from, sub: (d) => d.note },
    { label: 'Redirects to', cell: (d) => d.to },
    { label: 'Type', cell: (d) => d.code },
    { label: 'Hits', cell: (d) => d.hits || 0, align: 'right', sort: (d) => d.hits || 0 },
    { label: 'Active', cell: (d) => (d.enabled === false ? 'Off' : 'On'), badge: true },
  ],
  csv: [{ label: 'From', value: (d) => d.from }, { label: 'To', value: (d) => d.to }, { label: 'Type', value: (d) => d.code }, { label: 'Hits', value: (d) => d.hits }, { label: 'Active', value: (d) => d.enabled !== false }],
  sections: [
    { title: 'Redirect', fields: [
      { name: 'from', label: 'Old address', type: 'text', required: true, placeholder: '/old-page', help: 'The path people (or Google) still use, e.g. /product/old-tour-name' },
      { name: 'to', label: 'New address', type: 'text', required: true, placeholder: '/tours/new-tour-name', help: 'A path on this website, or a full https:// address.' },
      { name: 'code', label: 'Type', type: 'select', options: [{ value: '301', label: '301 Permanent (recommended: keeps Google rankings)' }, { value: '302', label: '302 Temporary' }] },
      { name: 'note', label: 'Note (optional)', type: 'text' },
      { name: 'enabled', label: 'Redirect is active', type: 'checkbox' },
    ] },
  ],
});
