/** Enforces the project rule: no source file over 400 lines. Run with `npm run check:size`. */
const fs = require('fs');
const path = require('path');

const MAX = 400;
const SKIP = new Set(['node_modules', 'public', '.git']);
let failed = false;

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (/\.(js|ejs|css|sql)$/.test(e.name)) {
      const lines = fs.readFileSync(full, 'utf8').split('\n').length;
      if (lines > MAX) { failed = true; console.error(`TOO LONG (${lines}): ${full}`); }
    }
  }
})(path.join(__dirname, '..'));

console.log(failed ? 'FAILED' : `OK: all files <= ${MAX} lines`);
process.exit(failed ? 1 : 0);
