const { EventEmitter } = require('events');
const { state } = require('../db/pool');
const fileDriver = require('./file.driver');
const pgDriver = require('./pg.driver');

/** Emits 'change' (collection name) after every write so caches and the public site can refresh. */
const events = new EventEmitter();

const driver = () => (state.pool ? pgDriver : fileDriver);

/**
 * A named collection of JSON documents addressed by `keyField`.
 * Works against Postgres when connected, otherwise against local JSON files.
 */
function collection(name, { seed = [], keyField = 'id' } = {}) {
  const cfg = { seed, keyField };
  return {
    name,
    keyField,
    list: () => driver().list(name, cfg),
    get: (key) => driver().get(name, cfg, key),
    async put(doc) {
      await driver().put(name, cfg, doc[keyField], doc);
      events.emit('change', name);
      return doc;
    },
    async remove(key) {
      const removed = await driver().remove(name, cfg, key);
      events.emit('change', name);
      return removed;
    },
    async count() {
      return (await driver().list(name, cfg)).length;
    },
  };
}

const newId = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

module.exports = { collection, events, newId };
