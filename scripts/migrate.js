const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const dir = path.join(__dirname, '..', 'database', 'schema');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    await pool.query(fs.readFileSync(path.join(dir, f), 'utf8'));
    console.log('applied', f);
  }
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
