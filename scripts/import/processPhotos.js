/**
 * One-off: optimises the client's photo folder into public/images/gallery/*.webp.
 * Usage: node scripts/import/processPhotos.js "<folder with .jpg files>"
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const src = process.argv[2];
if (!src) { console.error('Pass the photo folder as the first argument'); process.exit(1); }
const out = path.join(__dirname, '..', '..', 'public', 'images', 'gallery');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const files = fs.readdirSync(src).filter((f) => /\.jpe?g$/i.test(f)).sort();
  for (const f of files) {
    const name = f.startsWith('DSC') ? 'cheetah' : `glad-${f.replace(/\D/g, '').slice(-4)}`;
    await sharp(path.join(src, f)).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 76 }).toFile(path.join(out, `${name}.webp`));
    console.log(f, '->', `${name}.webp`);
  }
})();
