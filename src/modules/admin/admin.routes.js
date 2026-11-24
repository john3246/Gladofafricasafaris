const express = require('express');
const { env } = require('../../config');
const asyncHandler = require('../../utils/asyncHandler');
const { inquiries } = require('../../store/collections');
const { session, csrf, requireAuth, requireAdmin } = require('./auth/auth.middleware');
const { loadFlash } = require('./lib/flash');
const crud = require('./resources/crud.factory');
const preview = require('../../utils/preview');
const { toInput } = require('./lib/fields');

const router = express.Router();
const RESOURCES = ['tours', 'destinations', 'posts', 'faqs', 'reviews', 'pages', 'bookings', 'redirects', 'subscribers', 'categories', 'regions', 'customfields', 'emailtemplates', 'accommodations', 'policies', 'departures'];

// Everything under /admin: signed cookie session, form parsing, CSRF, flash messages, admin layout.
router.use(session);
router.use(express.urlencoded({ extended: true, limit: '2mb', parameterLimit: 5000 }));
router.use((req, res, next) => {
  res.locals.layout = 'admin/views/layout';
  res.locals.siteUrl = env.siteUrl;
  res.locals.currentPath = req.path;
  Object.assign(res.locals, { toInput, active: '', pageTitle: 'CMS', newInquiries: 0, notifications: [] });
  res.set('Cache-Control', 'no-store');
  next();
});
router.use(csrf);
router.use(loadFlash);

router.use(require('./auth/auth.routes')); // /login, /logout
router.use(require('./auth/recovery.routes')); // /forgot, /reset/<token>, /register/<token> (not signed in yet)

router.use(asyncHandler(requireAuth));
router.use(asyncHandler(async (req, res, next) => {
  const fresh = (await inquiries.list()).filter((i) => i.status === 'new').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.locals.newInquiries = fresh.length;
  res.locals.notifications = fresh.slice(0, 5);
  // Lets signed-in CMS users preview the public site while maintenance mode is on.
  res.cookie(preview.NAME, preview.token(), preview.cookieOptions);
  next();
}));

router.use('/', require('./dashboard/dashboard.routes'));
router.use(require('./lib/search.routes'));
router.use(require('./analytics/analytics.routes'));
router.use(['/custom-fields', '/email-templates', '/mail'], requireAdmin); // fields, templates and mail settings are administrator tasks
RESOURCES.forEach((name) => {
  const def = require(`./resources/defs/${name}.def`);
  router.use(`/${def.slug}`, crud(def));
});
router.use('/media', require('./media/media.routes'));
router.use('/inquiries', require('./inquiries/inquiries.routes'));
router.use('/customers', require('./inquiries/customers.routes'));
router.use(require('./seo/seo.routes'));
router.use(require('./bestsellers/bestsellers.routes'));
router.use(require('./accommodations/photos.routes'));
router.use(require('./live/live.routes'));
router.use(require('./translations/translations.routes'));
router.use(require('./offers/offers.routes'));
router.use(require('./mail/mail.routes'));
router.use(require('./users/profile.routes'));
router.use('/settings', requireAdmin); // site settings are administrator-only (menus stay open to editors)
router.use(require('./settings/settings.routes'));
router.use('/backup', requireAdmin);
router.use(require('./backup/backup.routes'));
router.use('/users', requireAdmin, require('./users/users.routes'));
router.use(requireAdmin, require('./audit/audit.routes'));

router.use((req, res) => res.status(404).render('admin/views/error', { active: '', pageTitle: 'Not found', message: 'That admin page does not exist.' }));

module.exports = router;
