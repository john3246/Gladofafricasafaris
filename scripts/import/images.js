const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC = path.join(__dirname, '..', '..', 'public');

/**
 * Downloads an image, resizes it and saves it as WebP (Core Web Vitals).
 * @param {string} url source image
 * @param {string} rel path under /public without extension, e.g. images/tours/foo
 * @returns {Promise<string|null>} public URL path or null when it failed
 */
async function saveWebp(url, rel, width = 1400) {
  const dest = path.join(PUBLIC, `${rel}.webp`);
  if (fs.existsSync(dest)) return `/${rel}.webp`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await sharp(Buffer.from(await res.arrayBuffer())).resize({ width, withoutEnlargement: true }).webp({ quality: 74 }).toFile(dest);
    return `/${rel}.webp`;
  } catch (_) {
    return null;
  }
}

/** Saves a file as-is (logos keep PNG transparency). */
async function saveRaw(url, rel) {
  const dest = path.join(PUBLIC, rel);
  if (fs.existsSync(dest)) return `/${rel}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return `/${rel}`;
}

module.exports = { saveWebp, saveRaw };
