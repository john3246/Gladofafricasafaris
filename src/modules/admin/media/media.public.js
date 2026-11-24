const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const mediaStore = require('../../../store/media.store');

/** Public delivery of CMS uploads: GET /uploads/<id>.webp (cached for a year; ids are unique). */
router.get('/:id', asyncHandler(async (req, res, next) => {
  if (!/^[\w.-]+$/.test(req.params.id)) return next();
  const file = await mediaStore.read(req.params.id);
  if (!file) return next();
  res.set({ 'Content-Type': file.mime, 'Cache-Control': 'public, max-age=31536000, immutable' }).send(file.data);
}));

module.exports = router;
