const { subscribers } = require('../../../../store/collections');
const resource = require('../resource');

module.exports = resource({
  slug: 'subscribers', label: 'Subscribers', singular: 'Subscriber', icon: 'mail', collection: subscribers, publishing: false, canDuplicate: false,
  title: (d) => d.email,
  searchText: (d) => [d.email, d.name],
  defaults: () => ({ source: 'manual' }),
  afterParse(doc) {
    doc.email = (doc.email || '').toLowerCase();
    doc.at = doc.at || new Date().toISOString();
    return doc;
  },
  check: (doc) => (doc.email && !/^\S+@\S+\.\S+$/.test(doc.email) ? { email: 'Enter a valid email address' } : {}),
  filters: { label: 'State', options: [{ value: 'on', label: 'Subscribed' }, { value: 'off', label: 'Unsubscribed' }], fn: (d, v) => (v === 'off') === Boolean(d.unsubscribed) },
  columns: [
    { label: 'Email', cell: (d) => d.email, sub: (d) => d.name },
    { label: 'Joined', cell: (d) => (d.at || '').slice(0, 10) },
    { label: 'Source', cell: (d) => d.source || 'footer', badge: true },
    { label: 'State', cell: (d) => (d.unsubscribed ? 'Unsubscribed' : 'Subscribed'), badge: true },
  ],
  csv: [{ label: 'Email', value: (d) => d.email }, { label: 'Name', value: (d) => d.name }, { label: 'Joined', value: (d) => d.at }, { label: 'Source', value: (d) => d.source }, { label: 'Unsubscribed', value: (d) => Boolean(d.unsubscribed) }],
  sections: [
    { title: 'Subscriber', fields: [
      { name: 'email', label: 'Email', type: 'text', required: true, lockOnEdit: true },
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'unsubscribed', label: 'Unsubscribed (do not email)', type: 'checkbox' },
    ] },
  ],
});
