const { emailtemplates } = require('../../../../store/collections');
const resource = require('../resource');
const { PLACEHOLDERS } = require('../../../../services/emailTemplates');

const KINDS = [
  { value: 'automatic', label: 'Automatic: sent by the website when a request arrives' },
  { value: 'reply', label: 'Quick reply: a button in the inquiry inbox' },
];
const helpList = PLACEHOLDERS.map(([k, d]) => `{{${k}}} ${d}`).join(' · ');

module.exports = resource({
  slug: 'email-templates', label: 'Email templates', singular: 'Template', icon: 'mail', collection: emailtemplates, publishing: false, canDuplicate: true,
  title: (d) => d.name,
  searchText: (d) => [d.name, d.key, d.subject],
  locked: (d) => d.system === true, // built-in automatic mails can be edited or switched off, not deleted
  columns: [
    { label: 'Template', cell: (d) => d.name, sub: (d) => d.subject },
    { label: 'Used for', cell: (d) => (d.kind === 'automatic' ? 'Automatic' : 'Quick reply'), badge: true },
    { label: 'Active', cell: (d) => (d.enabled === false ? 'Off' : 'On'), badge: true },
  ],
  defaults: () => ({ kind: 'reply', enabled: true, subject: '', body: 'Hello {{firstName}},\n\n\n\nBest wishes,\n{{agent}}\n{{company}}' }),
  autoKey: async (doc) => `reply-${String(doc.name || 'custom').replace(/^quick reply:?\s*/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom'}`,
  sections: [
    { title: 'Template', fields: [
      { name: 'name', label: 'Template name', type: 'text', required: true },
      { name: 'kind', label: 'Used for', type: 'select', required: true, options: KINDS, help: 'Quick replies appear as buttons on every inquiry; "automatic" ones are sent by the website.' },
      { name: 'enabled', label: 'Switched on', type: 'checkbox' },
      { name: 'subject', label: 'Subject', type: 'text', required: true, wide: true },
      { name: 'body', label: 'Message', type: 'textarea', rows: 16, required: true, help: `Plain text. Blank line = new paragraph. Placeholders are filled in for each guest: ${helpList}` },
    ] },
  ],
});
