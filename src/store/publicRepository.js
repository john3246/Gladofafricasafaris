/** Read-only view of a collection for the public site: drafts (doc.draft === true) are hidden. */
const isLive = (doc) => doc && doc.draft !== true;

module.exports = (col, keyField = 'slug') => ({
  async findAll() {
    return (await col.list()).filter(isLive);
  },
  async findBySlug(key) {
    const doc = await col.get(key);
    return isLive(doc) ? doc : null;
  },
  keyField,
});

module.exports.isLive = isLive;
