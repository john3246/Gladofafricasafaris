const router = require('express').Router();
const asyncHandler = require('../../../utils/asyncHandler');
const { getSettings, saveSettings } = require('../../../services/settings.service');
const { parseBody, validate } = require('../lib/fields');
const { parseLinks, linksToText } = require('../../../utils/links');
const audit = require('../lib/audit');
const { flash } = require('../lib/flash');

/** Site-wide settings form (contact details, social links, home hero, notifications). */
const settingsDef = {
  fields: [
    { name: 'phone', label: 'Phone', type: 'text', required: true },
    { name: 'email', label: 'Public email', type: 'text', required: true },
    { name: 'whatsapp', label: 'WhatsApp link', type: 'text', help: 'Leave empty to build it from the phone number (https://wa.me/...).' },
    { name: 'street', label: 'Street / P.O. box', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'facebook', label: 'Facebook page', type: 'text' },
    { name: 'instagram', label: 'Instagram', type: 'text' },
    { name: 'tiktok', label: 'TikTok', type: 'text' },
    { name: 'youtube', label: 'YouTube', type: 'text' },
    { name: 'x', label: 'X (Twitter)', type: 'text' },
    { name: 'heroLine1', label: 'Home hero: line 1 (big capitals)', type: 'text', required: true },
    { name: 'heroLine2', label: 'Home hero: line 2 (italic)', type: 'text' },
    { name: 'heroText', label: 'Home hero: paragraph', type: 'textarea', rows: 3 },
    { name: 'heroImage', label: 'Home hero: photo', type: 'image' },
    { name: 'heroVideo', label: 'Home hero: background video (optional)', type: 'text', placeholder: '/video/hero.mp4', help: 'An MP4 file on the website, compressed to about 720p without sound (about 5 MB). Leave empty to show the photo only. Visitors who prefer less motion, or have a slow connection, always see the photo.' },
    { name: 'heroVideoSmall', label: 'Home hero: video for phones (optional)', type: 'text', placeholder: '/video/hero-small.mp4', help: 'A smaller copy (about 640 px wide, 1-2 MB) used on phones.' },
    { name: 'tripStyles', label: 'Safari styles (the filter on the safaris page)', type: 'lines', rows: 14, help: 'One per line. Each tour ticks the styles it fits, and guests filter safaris by them. Add, rename or remove freely.' },
    { name: 'experienceStyles', label: 'Experiences (header menu and the Experiences page)', type: 'lines', rows: 8, help: 'One per line, spelled exactly like a safari style above. Only experiences that have at least one safari are shown.' },
    { name: 'footerText', label: 'Footer description', type: 'textarea', rows: 3 },
    { name: 'announceOn', label: 'Show the announcement bar', type: 'checkbox' },
    { name: 'announceText', label: 'Announcement text', type: 'text', placeholder: 'Book 2027 migration safaris before 31 March and save 5%' },
    { name: 'announceHref', label: 'Announcement link (optional)', type: 'text', placeholder: '/tanzania-safaris/migration' },
    { name: 'gaId', label: 'Google Analytics measurement ID', type: 'text', placeholder: 'G-XXXXXXXXXX', help: 'Leave empty to turn off. Your built-in analytics keep working either way.' },
    { name: 'licenseInfo', label: 'Licence line for the trust badges (optional)', type: 'text', placeholder: 'Licensed by TALA, licence no. ...', help: 'Shown beside the quote button on every safari page. Type only what is true; leave empty to hide it.' },
    { name: 'ratingValue', label: 'Average rating (for search engines)', type: 'text', placeholder: '5.0', help: 'The average of your real reviews, for example on SafariBookings. Leave empty to publish no rating.' },
    { name: 'ratingCount', label: 'Number of reviews behind that rating', type: 'text', placeholder: '6', help: 'Must match the real number of reviews. Leave empty to publish no rating.' },
    { name: 'memberOf', label: 'Tourism body you belong to', type: 'text', placeholder: 'Tanzania Tourist Board', help: 'Type only what is true.' },
    { name: 'paymentsAccepted', label: 'Payment methods accepted', type: 'text', placeholder: 'Visa, Mastercard, Pesapal, Bank Transfer' },
    { name: 'priceRange', label: 'Price range line', type: 'text', placeholder: '$60 - $6,600', help: 'Cheapest day excursion to dearest safari, in US dollars.' },
    { name: 'profiles', label: 'Your profiles on other websites', type: 'lines', rows: 3, help: 'One address per line, for example your SafariBookings page. Search engines and AI assistants use them to confirm who you are.' },
    { name: 'googleVerify', label: 'Google Search Console verification code', type: 'text', placeholder: 'abc123...', help: 'Only the code from the content="..." part of the verification tag. Lets you submit the sitemap and see search rankings.' },
    { name: 'bingVerify', label: 'Bing Webmaster verification code', type: 'text' },
    { name: 'ogImage', label: 'Default social sharing image', type: 'image', help: 'Shown when a page is shared on Facebook, WhatsApp, etc. Ideal: 1200 x 630.' },
    { name: 'maintenance', label: 'Maintenance mode: show visitors a "back soon" page', type: 'checkbox' },
    { name: 'noindex', label: 'Ask search engines not to index the site (use only while building)', type: 'checkbox' },
  ],
  afterParse(doc) {
    doc.hero = { line1: doc.heroLine1, line2: doc.heroLine2, text: doc.heroText, image: doc.heroImage, video: String(doc.heroVideo || '').trim(), videoSmall: String(doc.heroVideoSmall || '').trim(), poster: '/video/poster.webp' };
    ['heroLine1', 'heroLine2', 'heroText', 'heroImage', 'heroVideo', 'heroVideoSmall'].forEach((k) => delete doc[k]);
    return doc;
  },
};

const GROUPS = [
  { title: 'Contact details', names: ['phone', 'email', 'whatsapp', 'street', 'city'] },
  { title: 'Social media', names: ['facebook', 'instagram', 'tiktok', 'youtube', 'x'] },
  { title: 'Home page hero', names: ['heroLine1', 'heroLine2', 'heroText', 'heroImage', 'heroVideo', 'heroVideoSmall'] },
  { title: 'Safari styles and experiences', names: ['tripStyles', 'experienceStyles'] },
  { title: 'Footer', names: ['footerText'] },
  { title: 'Announcement bar', names: ['announceOn', 'announceText', 'announceHref'] },
  { title: 'Marketing & sharing', names: ['gaId', 'licenseInfo', 'googleVerify', 'bingVerify', 'ogImage'] },
  { title: 'Facts for Google and AI assistants', names: ['ratingValue', 'ratingCount', 'memberOf', 'paymentsAccepted', 'priceRange', 'profiles'] },
  { title: 'Website availability', names: ['maintenance', 'noindex'] },
];
const sections = GROUPS.map((g) => ({ title: g.title, fields: settingsDef.fields.filter((f) => g.names.includes(f.name)) }));

const flat = (s) => ({ ...s, heroLine1: s.hero.line1, heroLine2: s.hero.line2, heroText: s.hero.text, heroImage: s.hero.image, heroVideo: s.hero.video, heroVideoSmall: s.hero.videoSmall });

router.get('/settings', asyncHandler(async (req, res) => {
  res.render('admin/views/settings/form', { active: 'settings', pageTitle: 'Site Settings', sections, doc: flat(await getSettings()), errors: {}, action: '/admin/settings', opts: {}, intro: 'Changes appear on the live website immediately.' });
}));

router.post('/settings', asyncHandler(async (req, res) => {
  const doc = parseBody(settingsDef, req.body, {});
  const errors = validate(settingsDef, flat({ ...doc, hero: doc.hero }));
  if (Object.keys(errors).length) {
    return res.status(422).render('admin/views/settings/form', { active: 'settings', pageTitle: 'Site Settings', sections, doc: flat({ ...doc }), errors, action: '/admin/settings', opts: {}, intro: '' });
  }
  await saveSettings(doc);
  await audit.record(req, 'updated', 'settings', 'site', 'Site settings');
  flash(req, 'success', 'Settings saved.');
  res.redirect('/admin/settings');
}));

/** Menus & Navigation: the top-bar and footer link lists. */
router.get('/menus', asyncHandler(async (req, res) => {
  const s = await getSettings();
  res.render('admin/views/settings/menus', { active: 'menus', pageTitle: 'Menus & Navigation', topLinks: linksToText(s.topLinks), footerLinks: linksToText(s.footerLinks) });
}));

router.post('/menus', asyncHandler(async (req, res) => {
  await saveSettings({ topLinks: parseLinks(req.body.topLinks), footerLinks: parseLinks(req.body.footerLinks) });
  await audit.record(req, 'updated', 'settings', 'menus', 'Menus & navigation');
  flash(req, 'success', 'Menus saved.');
  res.redirect('/admin/menus');
}));

module.exports = router;
