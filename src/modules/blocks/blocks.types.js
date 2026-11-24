/**
 * Page sections ("blocks"): the building pieces of the home page and every custom page.
 * The CMS form (fields) and the public renderer (blocks.service + views/blocks/*.ejs) both read this file,
 * so adding a section type means: one entry here + one template in src/views/blocks.
 */
const THEMES = {
  white: { cls: 'bg-white', dark: false },
  sand: { cls: 'bg-sand', dark: false },
  cream: { cls: 'bg-cream', dark: false },
  stone: { cls: 'bg-stone', dark: false },
  forest: { cls: 'on-dark bg-forest-900 text-white', dark: true },
  deep: { cls: 'on-dark bg-forest-950 text-white', dark: true },
  green: { cls: 'on-dark bg-forest-600 text-white', dark: true },
};

const TYPES = [
  { value: 'hero', label: 'Hero banner (big photo and headline)' },
  { value: 'richtext', label: 'Text (heading and paragraphs)' },
  { value: 'image-text', label: 'Photo with text' },
  { value: 'whyus', label: 'Why choose us (photo and numbered reasons)' },
  { value: 'tours', label: 'Tours / packages' },
  { value: 'destinations', label: 'Destinations' },
  { value: 'regions', label: 'Regions (big photo cards)' },
  { value: 'tiles', label: 'Photo tiles (your own links)' },
  { value: 'features', label: 'Feature list (title and text)' },
  { value: 'gallery', label: 'Photo gallery' },
  { value: 'reviews', label: 'Guest reviews' },
  { value: 'blog', label: 'Latest blog posts' },
  { value: 'faq', label: 'Frequently asked questions' },
  { value: 'cta', label: 'Call-to-action band' },
  { value: 'finder', label: 'Safari price finder (month, type, days, travellers)' },
  { value: 'facts', label: 'Safari prices at a glance (table)' },
  { value: 'html', label: 'Custom HTML (advanced)' },
];

const ALL = TYPES.map((t) => t.value);
const not = (...x) => ALL.filter((t) => !x.includes(t));
const BUTTONS = ['hero', 'richtext', 'image-text', 'whyus', 'tours', 'destinations', 'regions', 'tiles', 'features', 'gallery', 'reviews', 'blog', 'faq', 'cta'];

/** Fields of one section row. `showFor` lists the section types a field applies to (others hide it). */
const fields = [
  { name: 'type', label: 'Section type', type: 'select', options: TYPES, blockType: true, required: true },
  { name: 'theme', label: 'Background', type: 'select', showFor: not('hero', 'html'), options: [
    { value: 'white', label: 'White' }, { value: 'sand', label: 'Warm sand' }, { value: 'cream', label: 'Cream' }, { value: 'stone', label: 'Stone' },
    { value: 'forest', label: 'Dark green' }, { value: 'deep', label: 'Very dark green' }, { value: 'green', label: 'Bright green' }] },
  { name: 'eyebrow', label: 'Small label above the heading', type: 'text', showFor: not('html') },
  { name: 'heading', label: 'Heading', type: 'text', showFor: not('html'), help: 'Wrap a word in <em>…</em> to colour it, e.g. Your safari, <em>your way</em>.' },
  { name: 'intro', label: 'Short paragraph', type: 'textarea', rows: 3, showFor: not('html', 'gallery', 'features') },
  { name: 'body', label: 'Text / HTML', type: 'html', rows: 8, showFor: ['richtext', 'image-text', 'html'], help: 'Use <p>, <h2>, <ul><li>, <strong>, <a href="">.' },
  { name: 'image', label: 'Photo', type: 'image', showFor: ['hero', 'image-text', 'whyus'] },
  { name: 'useSiteHero', label: 'Use the headline, text and photo from Site Settings', type: 'checkbox', showFor: ['hero'] },
  { name: 'imageSide', label: 'Photo position', type: 'select', showFor: ['image-text', 'whyus'], options: [{ value: 'right', label: 'Photo on the right' }, { value: 'left', label: 'Photo on the left' }] },
  { name: 'items', label: 'Items', type: 'lines', rows: 5, showFor: ['tiles', 'features', 'whyus'], help: 'Features and reasons: Title | text.   Photo tiles: Title | Small label | Description | /link | /images/photo.webp' },
  { name: 'gallery', label: 'Photos', type: 'gallery', showFor: ['gallery'] },
  { name: 'category', label: 'Tour category', type: 'select', optionsFrom: 'categories', blank: 'All tours', showFor: ['tours'] },
  { name: 'tourSlugs', label: 'Or pick tours by hand (overrides the category)', type: 'tags', scroll: true, optionsFrom: 'tours', showFor: ['tours'] },
  { name: 'layout', label: 'Layout', type: 'select', showFor: ['tours'], options: [
    { value: 'grid', label: 'Grid of cards' }, { value: 'carousel', label: 'Sliding carousel' }, { value: 'spotlight', label: 'One big spotlight (first tour)' }] },
  { name: 'showCategories', label: 'Show category buttons under the heading', type: 'checkbox', showFor: ['tours'] },
  { name: 'region', label: 'Region', type: 'select', optionsFrom: 'regions', blank: 'All regions', showFor: ['destinations'] },
  { name: 'destSlugs', label: 'Or pick destinations by hand (overrides the region)', type: 'tags', scroll: true, optionsFrom: 'destinations', showFor: ['destinations'] },
  { name: 'faqGroup', label: 'Only questions from this group (optional)', type: 'text', showFor: ['faq'], help: 'Type a group name exactly as in CMS > FAQs, e.g. Calving season & Ndutu. Empty shows the first questions overall.' },
  { name: 'count', label: 'How many to show', type: 'number', showFor: ['tours', 'destinations', 'regions', 'blog', 'faq', 'reviews'], help: 'Leave empty for a sensible default.' },
  { name: 'buttons', label: 'Buttons', type: 'lines', rows: 3, showFor: BUTTONS, help: 'One per line: Button text | /link   (the first is the main button).' },
  { name: 'hidden', label: 'Hide this section for now (keep it, but do not show it)', type: 'checkbox' },
];

const DEFAULT_COUNT = { tours: 3, destinations: 6, regions: 3, blog: 3, faq: 6, reviews: 0 };

module.exports = { THEMES, TYPES, fields, DEFAULT_COUNT };
