/**
 * Local PostgreSQL for development (no Docker or system install needed).
 *   npm run db:local     -> starts Postgres on localhost:5433 and keeps running (Ctrl+C to stop)
 * Data lives in ./var/pgdata (git-ignored). Matches DATABASE_URL in .env.example:
 *   postgresql://glad:glad@localhost:5433/glad_safari
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'var', 'pgdata');
const PORT = Number(process.env.PG_PORT) || 5433;

(async () => {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const fresh = !fs.existsSync(path.join(DIR, 'PG_VERSION'));
  const pg = new EmbeddedPostgres({ databaseDir: DIR, user: 'glad', password: 'glad', port: PORT, persistent: true, initdbFlags: ['--encoding=UTF8', '--locale=C'], onLog: (m) => console.log('[pg]', String(m).trim()), onError: (e) => console.error(String(e).trim()) });

  if (fresh) {
    console.log('Creating a new local database cluster...');
    await pg.initialise();
  }
  await pg.start();
  if (fresh) await pg.createDatabase('glad_safari');
  console.log(`PostgreSQL ready: postgresql://glad:glad@localhost:${PORT}/glad_safari  (Ctrl+C to stop)`);

  const stop = async () => { console.log('Stopping PostgreSQL...'); await pg.stop(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  setInterval(() => {}, 1 << 30); // keep the process alive
})().catch((e) => { console.error('Could not start PostgreSQL:', e && e.message ? e.message : e); process.exit(1); });
