const fs = require('fs');
const path = require('path');
const c = require('../../../store/collections');
const analytics = require('../../../services/analytics');
const mailer = require('../../../services/mailer');
const { getSettings } = require('../../../services/settings.service');
const { env } = require('../../../config');
const { collectRows } = require('../lib/seoAudit');
const { stripTags } = require('../lib/text');

const DAY = 86400000;
const live = (d) => d.draft !== true;
const todayStr = () => new Date().toISOString().slice(0, 10);

/** Counts all public site images under /public/images (cached; they only change on deploy). */
let siteImageCount = null;
function countSiteImages() {
  if (siteImageCount !== null) return siteImageCount;
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.(webp|jpe?g|png)$/i.test(e.name) ? 1 : 0), 0);
  siteImageCount = walk(path.join(__dirname, '..', '..', '..', '..', 'public', 'images'));
  return siteImageCount;
}

// No percentage when there was nothing before to compare with (it would be a made-up "+100%")
const delta = (now, before) => (before ? Math.round(((now - before) / before) * 100) : null);

/** Everything the dashboard cards, tables and charts need, computed from the live collections. */
async function overview() {
  const [tours, dests, posts, faqs, reviews, pages, inquiries, bookings, subs, media, users, auditLog, traffic, settings, seoRows] = await Promise.all([
    c.tours.list(), c.destinations.list(), c.posts.list(), c.faqs.list(), c.reviews.list(), c.pages.list(), c.inquiries.list(), c.bookings.list(),
    c.subscribers.list(), c.media.list(), c.users.list(), c.audit.list(), analytics.summary(30), getSettings(), collectRows(),
  ]);
  const byNewest = [...inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recent30 = inquiries.filter((i) => Date.now() - new Date(i.createdAt) < 30 * DAY);
  const prev30 = inquiries.filter((i) => { const age = Date.now() - new Date(i.createdAt); return age >= 30 * DAY && age < 60 * DAY; });

  const active = bookings.filter((b) => b.status !== 'cancelled');
  const revenue = active.reduce((n, b) => n + (b.paid || 0), 0);
  const outstanding = active.reduce((n, b) => n + Math.max(0, (b.total || 0) - (b.paid || 0)), 0);
  const pipeline = inquiries.filter((i) => ['new', 'in-progress', 'replied'].includes(i.status)).reduce((n, i) => n + (i.value || 0), 0);
  const upcoming = active.filter((b) => b.status !== 'completed' && b.travelDate >= todayStr()).sort((a, b) => a.travelDate.localeCompare(b.travelDate));

  const typed = [
    ['Tours & Packages', tours, '#3e7b27'], ['Destinations', dests, '#D9A441'], ['Blog posts', posts, '#6b5bd2'],
    ['FAQs', faqs, '#e0603a'], ['Reviews', reviews, '#2b9aa8'], ['Pages', pages, '#85a947'],
  ];
  const drafts = [
    ...tours.filter((d) => !live(d)).map((d) => ({ type: 'Tour', title: d.title, href: `/admin/tours/${d.slug}/edit` })),
    ...dests.filter((d) => !live(d)).map((d) => ({ type: 'Destination', title: d.name, href: `/admin/destinations/${d.slug}/edit` })),
    ...posts.filter((d) => !live(d)).map((d) => ({ type: 'Blog post', title: d.title, href: `/admin/blog/${d.slug}/edit` })),
    ...faqs.filter((d) => !live(d)).map((d) => ({ type: 'FAQ', title: d.q, href: `/admin/faqs/${d.slug}/edit` })),
    ...pages.filter((d) => !live(d)).map((d) => ({ type: 'Page', title: stripTags(d.title), href: `/admin/pages/${d.slug}/edit` })),
  ];

  const seoIssues = seoRows.filter((r) => r.issues.length).length;
  const health = [
    { label: 'Email alerts for new quote requests', ok: await mailer.configured(), hint: 'Enter the mail server login in Email settings', href: '/admin/mail' },
    { label: 'Google Analytics connected', ok: Boolean(settings.gaId), hint: 'Add your measurement ID', href: '/admin/settings' },
    { label: 'SEO titles and descriptions', ok: seoIssues === 0, hint: `${seoIssues} page${seoIssues === 1 ? '' : 's'} need attention`, href: '/admin/seo?only=issues' },
    { label: 'Visible to search engines', ok: env.isProd && !settings.noindex, hint: env.isProd ? 'Switched off in Site Settings' : 'Only live on the production server', href: '/admin/settings' },
    { label: 'Maintenance mode is off', ok: !settings.maintenance, hint: 'Visitors currently see a maintenance page', href: '/admin/settings' },
    { label: 'No unanswered inquiries', ok: !inquiries.some((i) => i.status === 'new'), hint: `${inquiries.filter((i) => i.status === 'new').length} new inquiries waiting`, href: '/admin/inquiries?status=new' },
  ];

  const tourInterest = {};
  inquiries.forEach((i) => { if (i.tour) tourInterest[i.tour] = (tourInterest[i.tour] || 0) + 1; });

  return {
    stats: {
      tours: tours.length,
      publishedContent: [tours, dests, posts, faqs, reviews, pages].flat().filter(live).length,
      inquiries: inquiries.length, newInquiries: inquiries.filter((i) => i.status === 'new').length, inquiryDelta: delta(recent30.length, prev30.length),
      customers: new Set(inquiries.map((i) => i.email.toLowerCase())).size,
      bookings: bookings.length, revenue, outstanding, pipeline, subscribers: subs.filter((s) => !s.unsubscribed).length,
      media: media.length + countSiteImages(), users: users.length,
      views: traffic.views, viewsDelta: delta(traffic.views, traffic.prevViews), visitors: traffic.visitors, visitorsDelta: delta(traffic.visitors, traffic.prevVisitors),
      conversion: traffic.visitors ? Math.round((recent30.length / traffic.visitors) * 1000) / 10 : 0,
    },
    traffic,
    recentInquiries: byNewest.slice(0, 5),
    recentBookings: [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    upcoming: upcoming.slice(0, 5),
    byType: typed.map(([label, list, color]) => ({ label, color, count: list.length })),
    drafts: drafts.slice(0, 6),
    latestMedia: [...media].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6),
    activity: auditLog.filter((e) => e.action !== 'login').slice(0, 8),
    health,
    topTours: Object.entries(tourInterest).sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}

module.exports = { overview };
