const repo = require('./faq.repository');

module.exports = { list: () => repo.findAll(), top: async (n = 6) => (await repo.findAll()).slice(0, n) };
