const collections = require('../../store/collections');

/** One-time: gives every safari, destination and article its own cover photo (see data/coverfix.data.js). Covers an editor already changed are left alone. */
async function apply() {
  let n = 0;
  for (const f of require('../../data/coverfix.data')) {
    const c = collections[f.col];
    const doc = c && (await c.get(f.slug));
    if (doc && doc.image === f.from) { await c.put({ ...doc, image: f.to }); n += 1; }
  }
  return `${n} cover photos replaced`;
}

module.exports = { apply };
