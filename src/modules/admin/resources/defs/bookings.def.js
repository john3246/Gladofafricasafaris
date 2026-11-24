const { bookings, tours, inquiries } = require('../../../../store/collections');
const resource = require('../resource');

const STATUSES = [
  { value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'pending-payment', label: 'Pending payment' },
  { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
];
const money = (n) => `$${Number(n || 0).toLocaleString('en-US')}`;

module.exports = resource({
  slug: 'bookings', label: 'Bookings', singular: 'Booking', icon: 'calendar', collection: bookings, publishing: false, canDuplicate: false,
  title: (d) => `${d.ref} · ${d.customerName}`,
  searchText: (d) => [d.ref, d.customerName, d.email, d.tour, d.status],
  filters: { label: 'Status', options: STATUSES, fn: (d, v) => d.status === v },
  // Next reference: BK-1001, BK-1002, ...
  autoKey: async () => {
    const top = Math.max(1000, ...(await bookings.list()).map((b) => Number(String(b.ref).replace(/\D/g, '')) || 0));
    return `BK-${top + 1}`;
  },
  prefill: async (q) => {
    const i = q.inquiry && (await inquiries.get(q.inquiry));
    return i ? { customerName: i.name, email: i.email, phone: i.phone, tour: i.tour, travellers: i.travellers, total: i.value, inquiryId: i.id, notes: i.message } : {};
  },
  loadOptions: async () => ({ tours: (await tours.list()).map((t) => ({ value: t.title, label: t.title })) }),
  defaults: () => ({ status: 'pending', travellers: 2, paid: 0, notes: '' }),
  afterParse(doc) {
    doc.createdAt = doc.createdAt || new Date().toISOString();
    doc.total = doc.total || 0;
    doc.paid = doc.paid || 0;
    doc.email = (doc.email || '').toLowerCase();
    return doc;
  },
  check: (doc) => (doc.paid > doc.total ? { paid: 'Paid cannot be more than the total' } : {}),
  columns: [
    { label: 'Booking', cell: (d) => d.ref, sub: (d) => d.customerName, sort: (d) => Number(d.ref.replace(/\D/g, '')) },
    { label: 'Tour', cell: (d) => d.tour || '-' },
    { label: 'Travel date', cell: (d) => d.travelDate || '-' },
    { label: 'Status', cell: (d) => d.status, badge: true },
    { label: 'Total', cell: (d) => money(d.total), sort: (d) => d.total, align: 'right' },
  ],
  csv: [
    { label: 'Reference', value: (d) => d.ref }, { label: 'Customer', value: (d) => d.customerName }, { label: 'Email', value: (d) => d.email },
    { label: 'Phone', value: (d) => d.phone }, { label: 'Tour', value: (d) => d.tour }, { label: 'Travel date', value: (d) => d.travelDate },
    { label: 'Travellers', value: (d) => d.travellers }, { label: 'Total (USD)', value: (d) => d.total }, { label: 'Paid (USD)', value: (d) => d.paid },
    { label: 'Balance (USD)', value: (d) => (d.total || 0) - (d.paid || 0) }, { label: 'Status', value: (d) => d.status },
  ],
  sections: [
    { title: 'Customer', fields: [
      { name: 'customerName', label: 'Customer name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'text', required: true },
      { name: 'phone', label: 'Phone / WhatsApp', type: 'text' },
      { name: 'inquiryId', label: '', type: 'hidden' },
    ] },
    { title: 'Tour', fields: [
      { name: 'tour', label: 'Tour', type: 'select', optionsFrom: 'tours', blank: 'Choose a tour...' },
      { name: 'travelDate', label: 'Travel (arrival) date', type: 'date', required: true },
      { name: 'travellers', label: 'Number of travellers', type: 'number' },
      { name: 'notes', label: 'Notes', type: 'textarea', rows: 4 },
    ] },
    { title: 'Payment', fields: [
      { name: 'total', label: 'Total price (USD)', type: 'number', required: true },
      { name: 'paid', label: 'Amount paid so far (USD)', type: 'number' },
      { name: 'status', label: 'Booking status', type: 'select', options: STATUSES },
    ] },
  ],
});
module.exports.STATUSES = STATUSES;
