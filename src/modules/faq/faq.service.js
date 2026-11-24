const repo = require('./faq.repository');

module.exports = { list: () => repo.findAll(), top: async (n = 6, group = '') => (await repo.findAll()).filter((f) => !group || f.group === group).slice(0, n) };
