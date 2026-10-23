/** Header + footer navigation. Items mirror gladofafricasafari.com; the mega-menu layout follows gmsafaris.com. */
const d = (slug, label) => ({ label, href: `/destinations/${slug}` });

module.exports = {
  topLinks: [
    { label: 'Blog', href: '/blog' },
    { label: 'About Us', href: '/about-us' },
    { label: 'FAQs', href: '/faqs' },
  ],
  tourStyles: [
    { label: 'Exclusive Fly-In Safaris', href: '/tanzania-safaris/luxury' },
    { label: 'Joining Group Safaris', href: '/tanzania-safaris/group' },
    { label: 'Migration Safaris', href: '/tanzania-safaris/migration' },
    { label: 'Midrange Lodge Safaris', href: '/tanzania-safaris/midrange' },
    { label: 'Budget Safaris', href: '/tanzania-safaris/budget' },
    { label: 'Hiking & Trekking', href: '/tanzania-safaris/trekking' },
    { label: 'Day Trip Experience', href: '/tanzania-safaris/day-trips' },
  ],
  destinationGroups: [
    {
      title: 'Northern Circuit',
      href: '/destinations#northern',
      items: [
        d('serengeti-national-park', 'Serengeti National Park'),
        d('ngorongoro-crater', 'Ngorongoro Crater'),
        d('tarangire-national-park', 'Tarangire National Park'),
        d('lake-manyara-national-park', 'Lake Manyara National Park'),
        d('arusha-national-park', 'Arusha National Park'),
        d('mkomazi-national-park', 'Mkomazi National Park'),
        d('kilimanjaro-national-park', 'Kilimanjaro National Park'),
      ],
    },
    {
      title: 'Southern Circuit',
      href: '/destinations#southern',
      items: [
        d('udzungwa-mountains-national-park', 'Udzungwa Mountains'),
        d('mikumi-national-park', 'Mikumi National Park'),
        d('nyerere-national-park', 'Nyerere National Park'),
        d('ruaha-national-park', 'Ruaha National Park'),
      ],
    },
    {
      title: 'Hiking & Trekking',
      href: '/destinations#trekking',
      items: [d('mount-ol-donyo-lengai', 'Mount Ol Donyo Lengai'), d('mount-meru', 'Mount Meru'), d('mount-kilimanjaro', 'Mount Kilimanjaro')],
    },
    {
      title: 'Zanzibar Beaches',
      href: '/destinations#zanzibar',
      items: [
        d('chole-island', 'Chole Island'),
        d('chumbe-island', 'Chumbe Island'),
        d('mafia-island', 'Mafia Island'),
        d('nungwi-beach', 'Nungwi Beach'),
        d('mnemba-island', 'Mnemba Island'),
        d('stone-town', 'Stone Town'),
      ],
    },
  ],
  pages: [
    { label: 'About Us', href: '/about-us' },
    { label: 'Blog', href: '/blog' },
    { label: "FAQ's", href: '/faqs' },
    { label: 'Contact', href: '/contact-us' },
  ],
  footerLinks: [
    { label: 'Terms And Conditions', href: '/terms-and-conditions' },
    { label: 'Privacy & Policy', href: '/privacy-policy' },
    { label: 'Contact Channels', href: '/contact-us' },
    { label: 'About Us', href: '/about-us' },
    { label: 'Travel Blog & Tips', href: '/blog' },
    { label: 'Get a Quote', href: '/get-a-quote' },
  ],
};
