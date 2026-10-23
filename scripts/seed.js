const { Pool } = require('pg');
require('dotenv').config();

const sets = {
  tours: require('../src/data/tours'),
  destinations: require('../src/data/destinations'),
  posts: require('../src/data/posts'),
  faqs: require('../src/data/faqs.json').map((f, i) => ({ ...f, slug: `faq-${i + 1}`, sort: i })),
};

const upsert = {
  tours: [
    `INSERT INTO tours (slug, tier, tags, sort, data) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (slug) DO UPDATE SET tier=$2, tags=$3, sort=$4, data=$5, updated_at=now()`,
    (r) => [r.slug, r.tier, r.tags, r.sort, r],
  ],
  default: (table) => [
    `INSERT INTO ${table} (slug, sort, data) VALUES ($1,$2,$3)
     ON CONFLICT (slug) DO UPDATE SET sort=$2, data=$3, updated_at=now()`,
    (r) => [r.slug, r.sort ?? 0, r],
  ],
};

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  for (const [table, rows] of Object.entries(sets)) {
    const [sql, params] = upsert[table] || upsert.default(table);
    for (const r of rows) await pool.query(sql, params(r));
    console.log(`seeded ${rows.length} ${table}`);
  }
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
