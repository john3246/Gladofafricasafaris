const { destinations } = require('../../store/collections');
const publicRepository = require('../../store/publicRepository');

module.exports = publicRepository(destinations);
