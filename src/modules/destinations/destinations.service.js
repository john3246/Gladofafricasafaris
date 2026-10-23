const repo = require('./destinations.repository');

module.exports = {
  list: () => repo.findAll(),
  bySlug: (slug) => repo.findBySlug(slug),
};
