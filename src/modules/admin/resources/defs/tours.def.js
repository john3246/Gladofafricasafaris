const { tours, destinations } = require('../../../../store/collections');
const resource = require('../resource');
const { shortSummary } = require('../../lib/text');
const { tourVocabulary } = require('../../lib/taxonomy');
const { getSettings } = require('../../../../services/settings.service');

const slugTag = (t) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

module.exports = resource({
  slug: 'tours', label: 'Tours & Packages', singular: 'Tour', icon: 'map', collection: tours, extras: 'tours',
  title: (d) => d.title,
  publicUrl: (d) => `/tours/${d.slug}`,
  searchText: (d) => [d.title, d.slug, d.tier, d.tags, d.style],
  filters: {
    label: 'Level',
    load: async () => (await tourVocabulary()).levels.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) })),
    fn: (d, v) => d.tier === v,
  },
  columns: [
    { label: 'Tour', cell: (d) => d.title, thumb: (d) => d.image, sub: (d) => `${d.days} day${d.days > 1 ? 's' : ''} · ${d.style || ''}` },
    { label: 'Level', cell: (d) => d.tier, badge: true },
    { label: 'Price (pp)', cell: (d) => `$${Number(d.priceFrom).toLocaleString('en-US')}`, align: 'right' },
  ],
  bulkActions: [{
    value: 'price', label: 'Change prices by %', input: { name: 'percent', placeholder: 'e.g. 5 or -10' },
    run: (doc, body) => {
      const p = Number(body.percent);
      if (Number.isFinite(p) && doc.priceFrom) doc.priceFrom = Math.max(0, Math.round((doc.priceFrom * (1 + p / 100)) / 10) * 10);
    },
  }],
  csv: [
    { label: 'Title', value: (d) => d.title }, { label: 'Slug', value: (d) => d.slug }, { label: 'Level', value: (d) => d.tier }, { label: 'Days', value: (d) => d.days },
    { label: 'Price from (USD)', value: (d) => d.priceFrom }, { label: 'Tags', value: (d) => (d.tags || []).join(' ') }, { label: 'Status', value: (d) => (d.draft ? 'Draft' : 'Published') },
  ],
  defaults: () => ({ tier: 'midrange', style: 'Private', tags: [], destinations: [], itinerary: [], includes: [], excludes: [], gallery: [], highlights: [], description: [] }),
  loadOptions: async () => {
    const vocab = await tourVocabulary();
    const styles = ((await getSettings()).tripStyles || []).map((v) => ({ value: v, label: v }));
    return { destinations: (await destinations.list()).map((d) => ({ value: d.slug, label: d.name })), levels: vocab.levels, tags: vocab.tags, styles };
  },
  afterParse(doc, body = {}) {
    doc.tier = slugTag(doc.tier || '') || 'midrange';
    const added = String(body.tags__new || '').split(',').map(slugTag).filter(Boolean);
    doc.tags = [...new Set([...(doc.tags || []), ...added])];
    doc.itinerary = (doc.itinerary || []).map((d, i) => ({ day: i + 1, title: d.title || `Day ${i + 1}`, text: d.text || '', accommodation: d.accommodation || '', image: d.image || '', destination: d.destination || '', wildlife: d.wildlife || '', activities: d.activities || '', meals: d.meals || '' }));
    if (doc.itinerary.length) doc.days = doc.itinerary.length;
    doc.days = doc.days || 1;
    doc.styles = (doc.styles || []).filter(Boolean);
    if (!doc.bestSeller) { delete doc.bestSeller; delete doc.bestSellerHome; delete doc.bestSellerOrder; }
    doc.priceConfirmed = true;
    if (doc.priceWas === undefined) doc.priceWas = null;
    doc.summary = doc.summary || shortSummary((doc.description || [])[0] || '');
    doc.metaTitle = doc.metaTitle || `${doc.title} | Glad Of Africa`;
    doc.metaDescription = doc.metaDescription || doc.summary.slice(0, 155);
    return doc;
  },
  sections: [
    { title: 'Basics', fields: [
      { name: 'title', label: 'Tour title', type: 'text', required: true },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', required: true, help: 'Used in the URL: /tours/<slug>. Cannot be changed after saving.', from: 'title' },
      { name: 'tier', label: 'Level', type: 'text', required: true, suggest: 'levels', help: 'Luxury, midrange, budget or any level of your own. Tour categories can pick tours by level.' },
      { name: 'style', label: 'Style', type: 'text', placeholder: 'Private, Joining group, Trek...' },
      { name: 'priceFrom', label: 'Price from (USD per person)', type: 'number', required: true },
      { name: 'priceWas', label: 'Old price (optional, shown struck through)', type: 'number' },
      { name: 'badge', label: 'Badge (optional)', type: 'text', placeholder: 'Best seller' },
      { name: 'offerLabel', label: 'Special offer label (optional)', type: 'text', placeholder: 'Calving season 2027', help: 'A safari with a label appears in the Special offers section on the home page and on the Offers page, grouped by this label.' },
      { name: 'offerNote', label: 'Offer note (optional)', type: 'text', placeholder: 'Book early: calving camps fill up', help: 'One short sentence shown under the safari on the Offers page. Add a "was" price below only if there is a real saving.' },
      { name: 'styles', label: 'Safari styles (guests filter safaris by these)', type: 'tags', scroll: true, optionsFrom: 'styles', help: 'Tick every style this safari fits. The list is edited in Site Settings.' },
      { name: 'bestSeller', label: 'Best-selling safari (own page, badge on the card)', type: 'checkbox', help: 'You can also manage all best sellers together in Best-selling safaris.' },
      { name: 'bestSellerHome', label: 'Show it in the home page best-sellers section', type: 'checkbox' },
      { name: 'bestSellerOrder', label: 'Best-seller order (1 = first)', type: 'number' },
      { name: 'tags', label: 'Tags', type: 'tags', optionsFrom: 'tags', custom: true, help: 'Categories and page sections pick tours by tag. Tick existing tags or add new ones below.' },
    ] },
    { title: 'Photos', fields: [
      { name: 'image', label: 'Main photo', type: 'image', required: true },
      { name: 'gallery', label: 'Gallery photos', type: 'gallery', help: 'One image address per line, or use "Add photo".' },
    ] },
    { title: 'Description', fields: [
      { name: 'summary', label: 'Short summary (card text)', type: 'textarea', rows: 3, help: 'Leave empty to use the first sentences of the description.' },
      { name: 'description', label: 'Full description', type: 'paragraphs', rows: 10, help: 'Separate paragraphs with a blank line.' },
      { name: 'highlights', label: 'Highlights', type: 'lines', rows: 5, help: 'One per line.' },
    ] },
    { title: 'Itinerary', fields: [
      { name: 'itinerary', label: 'Day-by-day itinerary', type: 'repeater', itemLabel: 'Day', fields: [
        { name: 'title', label: 'Day title', type: 'text' },
        { name: 'text', label: 'What happens', type: 'textarea', rows: 5 },
        { name: 'accommodation', label: 'Overnight / lodge', type: 'text' },
        { name: 'destination', label: 'Main destination (optional)', type: 'text', help: 'Worked out from the day automatically when empty.' },
        { name: 'wildlife', label: 'Wildlife you may see (optional, comma separated)', type: 'text' },
        { name: 'activities', label: 'Activities (optional, comma separated)', type: 'text' },
        { name: 'meals', label: 'Meals (optional)', type: 'text', placeholder: 'Breakfast, Lunch, Dinner' },
        { name: 'image', label: 'Photo for this day (optional)', type: 'image', help: 'Leave empty to use a photo from the gallery automatically.' },
      ] },
    ] },
    { title: 'Included & excluded', fields: [
      { name: 'includes', label: 'Included', type: 'lines', rows: 7, help: 'One per line.' },
      { name: 'excludes', label: 'Not included', type: 'lines', rows: 7, help: 'One per line.' },
    ] },
    { title: 'Places', fields: [
      { name: 'destinations', label: 'Destinations visited', type: 'tags', optionsFrom: 'destinations' },
    ] },
    { title: 'Search engines (SEO)', fields: [
      { name: 'metaTitle', label: 'SEO title', type: 'text', max: 60, help: 'Ideal: under 60 characters.' },
      { name: 'metaDescription', label: 'SEO description', type: 'textarea', rows: 3, max: 158, help: 'Ideal: 120 to 158 characters.' },
      { name: 'sort', label: 'Display order', type: 'number', help: 'Lower numbers appear first.' },
    ] },
    { title: 'Publishing', side: true, fields: [{ name: 'status', label: 'Status', type: 'status' }] },
  ],
});
