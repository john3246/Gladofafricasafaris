/** Editable site pages (CMS > Pages). `body` is HTML. */
module.exports = [
  require('./home.seed'),
  require('./calving.seo').page,
  {
    slug: 'about',
    title: 'Personal, responsible, <em>expertly guided</em>',
    subtitle: 'Glad Of Africa Safari & Tours is a trusted Tanzania tour operator built around one idea: your journey should feel written for you, not sold to you.',
    metaTitle: 'About Glad Of Africa: Locally Owned Arusha Safari Company',
    metaDescription: 'Meet the Arusha team behind Glad Of Africa Safari & Tours: personal, responsible, expertly guided northern Tanzania safaris and Kilimanjaro treks.',
    body: `<p>Every itinerary is shaped by local guides who know which valley holds the pride at 6am, and which camp pours the best coffee at dusk, so every detail exceeds what you pictured.</p>
<h2>What we believe</h2>
<ul>
<li><strong>Personalized itineraries.</strong> No two tours are the same.</li>
<li><strong>Responsible travel.</strong> Fair pay and respect for people and wildlife.</li>
<li><strong>Expert local guiding.</strong> Licensed guides with deep knowledge of the Serengeti, Ngorongoro and Tarangire.</li>
</ul>
<h2>Our commitment</h2>
<p>We don't sell safaris. We build the experience you'll talk about for the rest of your life.</p>`,
    sort: 1,
  },
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    subtitle: '',
    metaTitle: 'Terms and Conditions',
    metaDescription: 'Booking, payment and cancellation terms for Glad Of Africa Safari & Tours.',
    body: require('./legal.data').terms,
    sort: 2,
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    subtitle: '',
    metaTitle: 'Privacy Policy',
    metaDescription: 'How Glad Of Africa Safari & Tours collects and uses your personal data.',
    body: require('./legal.data').privacy,
    sort: 3,
  },
];
