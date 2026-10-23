const { state } = require('./pool');

/**
 * Generic repository for jsonb content tables (slug + data).
 * Falls back to in-memory seed rows when Postgres is not connected.
 */
module.exports = function createContentRepository(table, seedRows) {
  return {
    async findAll() {
      if (!state.pool) return seedRows;
      const { rows } = await state.pool.query(
        `SELECT data FROM ${table} WHERE published = TRUE ORDER BY sort ASC, id ASC`
      );
      return rows.map((r) => r.data);
    },
    async findBySlug(slug) {
      if (!state.pool) return seedRows.find((r) => r.slug === slug) || null;
      const { rows } = await state.pool.query(
        `SELECT data FROM ${table} WHERE slug = $1 AND published = TRUE LIMIT 1`,
        [slug]
      );
      return rows[0]?.data || null;
    },
  };
};
