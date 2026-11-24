const fs = require('fs');
const path = require('path');
const { state } = require('../db/pool');

/**
 * Binary storage for CMS uploads. Postgres (bytea) when connected so files survive Render's
 * ephemeral disk; otherwise files in /var/uploads.
 */
const DIR = path.join(__dirname, '..', '..', 'var', 'uploads');

module.exports = {
  async save(id, buffer, mime) {
    if (state.pool) {
      await state.pool.query(
        `INSERT INTO cms_media (id, mime, data) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET mime=$2, data=$3`,
        [id, mime, buffer]
      );
      return;
    }
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(path.join(DIR, id), buffer);
  },
  async read(id) {
    if (state.pool) {
      const { rows } = await state.pool.query(`SELECT mime, data FROM cms_media WHERE id=$1`, [id]);
      return rows[0] ? { mime: rows[0].mime, data: rows[0].data } : null;
    }
    const file = path.join(DIR, id);
    return fs.existsSync(file) ? { mime: 'image/webp', data: fs.readFileSync(file) } : null;
  },
  async remove(id) {
    if (state.pool) return void (await state.pool.query(`DELETE FROM cms_media WHERE id=$1`, [id]));
    const file = path.join(DIR, id);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  },
};
