const { buildMeta } = require('../../seo/meta');
const breadcrumb = require('../../seo/schema/breadcrumb');
const orgSchema = require('../../seo/schema/organization');
const reviews = require('../../data/reviews.data');

const PAGES = {
  about: {
    view: 'pages/views/about',
    name: 'About Us',
    title: 'About Glad Of Africa: Locally Owned Arusha Safari Company',
    description: 'Meet the Arusha team behind Glad Of Africa Safari & Tours: personal, responsible, expertly guided northern Tanzania safaris and Kilimanjaro treks.',
  },
  terms: {
    view: 'pages/views/terms',
    name: 'Terms & Conditions',
    title: 'Terms and Conditions',
    description: 'Booking, payment and cancellation terms for Glad Of Africa Safari & Tours.',
    noindex: false,
  },
  privacy: {
    view: 'pages/views/privacy',
    name: 'Privacy Policy',
    title: 'Privacy Policy',
    description: 'How Glad Of Africa Safari & Tours collects and uses your personal data.',
  },
};

exports.show = (key) => (req, res) => {
  const page = PAGES[key];
  res.locals.seo = buildMeta({ title: page.title, description: page.description, noindex: page.noindex });
  const crumbs = [{ name: 'Home', href: '/' }, { name: page.name }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), ...(key === 'about' ? [orgSchema()] : [])];
  res.render(page.view, { reviews });
};

exports.contact = (req, res) => {
  res.locals.seo = buildMeta({
    title: 'Contact Us & Get a Free Tanzania Safari Quote',
    description: 'Contact our Arusha team on WhatsApp, phone or email and get a free tailor-made Tanzania safari quote within 24 hours.',
  });
  const crumbs = [{ name: 'Home', href: '/' }, { name: 'Contact' }];
  res.locals.breadcrumbs = crumbs;
  res.locals.schemas = [breadcrumb(crumbs), orgSchema()];
  res.render('inquiry/views/contact', { errors: {}, values: { tour: req.query.tour || '' } });
};
