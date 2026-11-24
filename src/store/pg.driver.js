const { state } = require('../db/pool');

/**
 * Postgres driver: every collection lives in one table (cms_records). A collection is seeded lazily the
 * first time it is touched and a marker row stops it from re-seeding after the owner deletes everything.
 */
const seeded = new Set();

async function ensureSeeded(name, cfg) {
  if (seeded.has(name)) return;
  const marker = `seeded:${name}`;
  const { rows } = await state.pool.query(`SELECT 1 FROM cms_records WHERE collection='_meta' AND key=$1`, [marker]);
  if (!rows.length) {
    for (const [i, d] of cfg.seed.entries()) {
      const doc = Number.isFinite(d.sort) ? d : { ...d, sort: i };
      await state.pool.query(
        `INSERT INTO cms_records (collection, key, sort, data) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [name, String(d[cfg.keyField]), doc.sort, doc]
      );
    }
    await state.pool.query(`INSERT INTO cms_records (collection, key, data) VALUES ('_meta',$1,'{}') ON CONFLICT DO NOTHING`, [marker]);
  }
  seeded.add(name);
}

module.exports = {
  async list(name, cfg) {
    await ensureSeeded(name, cfg);
    const { rows } = await state.pool.query(
      `SELECT data FROM cms_records WHERE collection=$1 ORDER BY sort NULLS LAST, created_at, key`, [name]);
    return rows.map((r) => r.data);
  },
  async get(name, cfg, key) {
    await ensureSeeded(name, cfg);
    const { rows } = await state.pool.query(`SELECT data FROM cms_records WHERE collection=$1 AND key=$2`, [name, String(key)]);
    return rows[0]?.data || null;
  },
  async put(name, cfg, key, doc) {
    await ensureSeeded(name, cfg);
    const k = String(key);
    const { rows } = await state.pool.query(`SELECT sort FROM cms_records WHERE collection=$1 AND key=$2`, [name, k]);
    let sort = Number.isFinite(doc.sort) ? doc.sort : Number(rows[0]?.sort);
    if (!Number.isFinite(sort)) {
      const max = await state.pool.query(`SELECT COALESCE(MAX(sort),0)+1 AS n FROM cms_records WHERE collection=$1`, [name]);
      sort = Number(max.rows[0].n);
    }
    const data = { ...doc, sort };
    await state.pool.query(
      `INSERT INTO cms_records (collection, key, sort, data) VALUES ($1,$2,$3,$4)
       ON CONFLICT (collection, key) DO UPDATE SET sort=$3, data=$4, updated_at=now()`,
      [name, k, sort, data]
    );
  },
  async remove(name, cfg, key) {
    await ensureSeeded(name, cfg);
    const r = await state.pool.query(`DELETE FROM cms_records WHERE collection=$1 AND key=$2`, [name, String(key)]);
    return r.rowCount > 0;
  },
};
