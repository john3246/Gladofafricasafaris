const { inquiries } = require('../../store/collections');
const { newId } = require('../../store');

/** Saves a quote request with the fields the CMS inbox needs (status workflow + internal notes). */
exports.save = async (i) => {
  const record = { ...i, id: newId('q'), status: 'new', notes: [], createdAt: new Date().toISOString() };
  delete record.website;
  await inquiries.put(record);
  return record;
};
