/** One-shot messages shown after a redirect (stored in the session cookie). */
const flash = (req, type, message) => {
  req.session.flash = [...(req.session.flash || []), { type, message }].slice(-3);
};

const loadFlash = (req, res, next) => {
  res.locals.flash = req.session.flash || [];
  if (req.session.flash) req.session.flash = null;
  next();
};

module.exports = { flash, loadFlash };
