/**
 * Makes smaller copies of every public photo (480 and 960 px wide) in public/img/<width>/..., plus a manifest of the
 * original widths. The server then offers phones and laptops the small copy (src-set) instead of the 1600 px original.
 * Run after adding photos:  node scripts/make-variants.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'public');
const SIZES = [480, 960];
const DIRS = ['tours', 'destinations', 'gallery', 'blog', 'experiences'];

(async () => {
  const files = [];
  for (const d of DIRS) for (const f of fs.readdirSync(path.join(ROOT, 'images', d))) if (/\.webp$/i.test(f)) files.push(`${d}/${f}`);
  files.push('hero.webp');
  const manifest = {};
  let made = 0;
  for (const rel of files) {
    const src = path.join(ROOT, 'images', rel);
    const meta = await sharp(src).metadata();
    const entry = { w: meta.width, v: [] };
    for (const w of SIZES) {
      if (meta.width <= w * 1.15) continue; // no point shrinking an image that is already about that size
      const out = path.join(ROOT, 'img', String(w), rel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs) { await sharp(src).resize({ width: w }).webp({ quality: 72 }).toFile(out); made += 1; }
      entry.v.push(w);
    }
    manifest[`/images/${rel}`] = entry;
  }
  fs.writeFileSync(path.join(ROOT, 'img', 'manifest.json'), JSON.stringify(manifest));
  console.log(`${files.length} photos, ${made} small copies written`);
})();
