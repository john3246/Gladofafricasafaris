const fs = require('fs');
const path = require('path');

/**
 * Local driver: one JSON file per collection in /var/cms. Collections are read from their seed data
 * until the first write (copy-on-write), so a fresh checkout shows the imported catalogue.
 */
const DIR = process.env.CMS_DATA_DIR || path.join(__dirname, '..', '..', 'var', 'cms');
const cache = new Map();

const order = (rows) =>
  rows
    .map((r, i) => ({ r, s: Number.isFinite(r.data.sort) ? r.data.sort : 1e6 + i }))
    .sort((a, b) => a.s - b.s)
    .map((x) => x.r);

function load(name, cfg) {
  if (cache.has(name)) return cache.get(name);
  const file = path.join(DIR, `${name}.json`);
  const rows = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, 'utf8'))
    : cfg.seed.map((d) => ({ key: String(d[cfg.keyField]), createdAt: new Date().toISOString(), data: structuredClone(d) }));
  cache.set(name, rows);
  return rows;
}

function persist(name, rows) {
  fs.mkdirSync(DIR, { recursive: true });
  const file = path.join(DIR, `${name}.json`);
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(rows));
  fs.renameSync(`${file}.tmp`, file);
}

module.exports = {
  async list(name, cfg) {
    return order(load(name, cfg)).map((r) => structuredClone(r.data));
  },
  async get(name, cfg, key) {
    const row = load(name, cfg).find((r) => r.key === String(key));
    return row ? structuredClone(row.data) : null;
  },
  async put(name, cfg, key, doc) {
    const rows = load(name, cfg);
    const i = rows.findIndex((r) => r.key === String(key));
    const data = structuredClone(doc);
    if (i >= 0) {
      if (!Number.isFinite(data.sort) && Number.isFinite(rows[i].data.sort)) data.sort = rows[i].data.sort;
      rows[i] = { ...rows[i], data };
    } else {
      if (!Number.isFinite(data.sort)) data.sort = Math.max(0, ...rows.map((r) => r.data.sort).filter(Number.isFinite)) + 1;
      rows.push({ key: String(key), createdAt: new Date().toISOString(), data });
    }
    persist(name, rows);
  },
  async remove(name, cfg, key) {
    const rows = load(name, cfg);
    const next = rows.filter((r) => r.key !== String(key));
    cache.set(name, next);
    persist(name, next);
    return next.length !== rows.length;
  },
};
