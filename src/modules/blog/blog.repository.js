const { posts } = require('../../store/collections');
const publicRepository = require('../../store/publicRepository');

const base = publicRepository(posts);
const today = () => new Date().toISOString().slice(0, 10);
/** Posts dated in the future are "scheduled": hidden until their publish date. */
const due = (p) => p && String(p.published) <= today();

module.exports = {
  ...base,
  findAll: async () => (await base.findAll()).filter(due),
  findBySlug: async (slug) => {
    const p = await base.findBySlug(slug);
    return due(p) ? p : null;
  },
};
