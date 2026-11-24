const { audit, revisions } = require('../../../store/collections');
const { newId } = require('../../../store');

const KEEP_REVISIONS = 15;

/** Appends an entry to the audit log (CMS > Revisions / Audit Log). */
async function record(req, action, collection, key, title = '') {
  await audit.put({
    id: newId('a'), at: new Date().toISOString(), action, collection, key: String(key), title,
    user: req.user?.name || req.name || 'system', email: req.user?.email || '', sort: -Date.now(),
    // where the action came from: the visitor's address and browser (the location is looked up when the log is viewed)
    ip: String(req.ip || '').replace(/^::ffff:/i, ''), ua: String(req.ua || (typeof req.get === 'function' ? req.get('user-agent') : '') || '').slice(0, 220),
  });
}

/** Saves the previous version of a document so it can be restored later (last 15 per item). */
async function snapshot(req, collection, key, doc) {
  if (!doc) return;
  await revisions.put({ id: newId('r'), collection, key: String(key), at: new Date().toISOString(), by: req.user?.name || '', data: doc, sort: -Date.now() });
  const mine = (await revisions.list()).filter((r) => r.collection === collection && r.key === String(key));
  for (const old of mine.slice(KEEP_REVISIONS)) await revisions.remove(old.id);
}

const history = async (collection, key) =>
  (await revisions.list()).filter((r) => r.collection === collection && r.key === String(key));

/** Recent audit-log entries for one item (shown on its edit screen). */
const activity = async (collection, key) =>
  (await audit.list()).filter((e) => e.collection === collection && e.key === String(key)).slice(0, 8);

module.exports = { record, snapshot, history, activity };
