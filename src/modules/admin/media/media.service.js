const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { media } = require('../../../store/collections');
const { newId } = require('../../../store');
const mediaStore = require('../../../store/media.store');

const IMAGES = path.join(__dirname, '..', '..', '..', '..', 'public', 'images');
const ALLOWED = /^image\/(jpeg|png|webp|gif)$/;

let siteCache = null;

/** Images that ship with the website (public/images). Read-only in the CMS; usable everywhere via the picker. */
function siteImages() {
  if (siteCache) return siteCache;
  const out = [];
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(dir, e.name), `${rel}/${e.name}`);
      else if (/\.(webp|jpe?g|png)$/i.test(e.name)) out.push({ url: `${rel}/${e.name}`, name: e.name, folder: rel.replace('/images', '') || '/', kind: 'site' });
    }
  };
  walk(IMAGES, '/images');
  siteCache = out;
  return out;
}

/** Resizes (max 2000px wide) and stores an uploaded image as WebP; returns the media record. */
async function saveUpload(file, user) {
  if (!ALLOWED.test(file.mimetype)) throw new Error(`${file.originalname}: only JPG, PNG, WebP or GIF images are allowed`);
  const id = `${newId('img')}.webp`;
  const out = await sharp(file.buffer).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  await mediaStore.save(id, out.data, 'image/webp');
  const record = {
    id, url: `/uploads/${id}`, name: file.originalname, size: out.info.size,
    width: out.info.width, height: out.info.height, at: new Date().toISOString(), by: user.name, kind: 'upload', sort: -Date.now(),
  };
  await media.put(record);
  return record;
}

async function remove(id) {
  await mediaStore.remove(id);
  await media.remove(id);
}

const uploads = async () => (await media.list()).sort((a, b) => b.at.localeCompare(a.at));

module.exports = { siteImages, saveUpload, remove, uploads };
