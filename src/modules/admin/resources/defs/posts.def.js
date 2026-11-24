const { posts, tours, destinations, users } = require('../../../../store/collections');
const resource = require('../resource');
const content = require('../../../blog/content');
const autolink = require('../../../blog/autolink');

const today = () => new Date().toISOString().slice(0, 10);
const slugTag = (t) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const isScheduled = (d) => d.published > today();
const unique = (list) => [...new Set(list.filter(Boolean))].sort();

module.exports = resource({
  slug: 'blog', label: 'Blog', singular: 'Post', icon: 'edit', collection: posts, extras: 'blog',
  title: (d) => d.title,
  publicUrl: (d) => `/blog/${d.slug}`,
  previewUrl: (d) => `/blog/${d.slug}?preview=1`,
  searchText: (d) => [d.title, d.slug, d.category, d.tags, d.author, d.excerpt, d.focusKeyword],
  filters: {
    label: 'Category',
    load: async () => unique((await posts.list()).map((p) => p.category)).map((c) => ({ value: c, label: c })),
    fn: (d, v) => d.category === v,
  },
  columns: [
    { label: 'Post', cell: (d) => d.title, thumb: (d) => d.image, sub: (d) => `${d.featured ? '★ Featured · ' : ''}${d.author || 'Glad Of Africa'}${d.wordCount ? ` · ${d.wordCount} words` : ''}` },
    { label: 'Category', cell: (d) => d.category, badge: true },
    { label: 'Date', cell: (d) => (isScheduled(d) ? `${d.published} (scheduled)` : d.published), sort: (d) => d.published },
  ],
  bulkActions: [
    { value: 'feature', label: 'Mark as featured', run: (doc) => { doc.featured = true; } },
    { value: 'unfeature', label: 'Remove featured', run: (doc) => { delete doc.featured; } },
  ],
  defaults: () => ({ category: 'Safari Guide', published: today(), content: '', autoLink: true, tags: [], related: [], relatedPosts: [] }),
  // Posts written before the rich editor store sections; open them in the editor as ordinary formatted text.
  toForm: (doc) => (doc.content || !doc.sections ? doc : { ...doc, content: content.fromSections(doc.sections) }),
  loadOptions: async () => {
    const [t, d, p, u] = await Promise.all([tours.list(), destinations.list(), posts.list(), users.list()]);
    return {
      tours: t.map((x) => ({ value: x.slug, label: x.title })),
      posts: p.map((x) => ({ value: x.slug, label: x.title })),
      authors: u.filter((x) => x.active !== false).map((x) => ({ value: x.name, label: x.name })),
      categories: unique(p.map((x) => x.category)),
      postTags: unique(p.flatMap((x) => x.tags || [])).map((v) => ({ value: v, label: v })),
      links: [
        ...t.map((x) => ({ group: 'Tour', label: x.title, href: `/tours/${x.slug}` })),
        ...d.map((x) => ({ group: 'Destination', label: x.name, href: `/destinations/${x.slug}` })),
        ...p.map((x) => ({ group: 'Post', label: x.title, href: `/blog/${x.slug}` })),
        { group: 'Page', label: 'Get a free quote', href: '/get-a-quote' },
        { group: 'Page', label: 'All safaris', href: '/tanzania-safaris' },
      ],
    };
  },
  afterParse(doc, body = {}) {
    doc.published = doc.published || today();
    const out = content.process(doc.content);
    doc.content = out.html;
    doc.toc = out.toc;
    doc.wordCount = out.words;
    doc.readMinutes = out.minutes;
    delete doc.sections; // the article now lives in `content`
    doc.tags = [...new Set([...(doc.tags || []), ...String(body.tags__new || '').split(',').map(slugTag).filter(Boolean)])];
    if (!doc.featured) delete doc.featured;
    if (!doc.author) delete doc.author;
    doc.updatedAt = new Date().toISOString();
    doc.metaTitle = doc.metaTitle || `${doc.title} | Glad Of Africa`;
    doc.metaDescription = doc.metaDescription || (doc.excerpt || '').slice(0, 155);
    return doc;
  },
  // Adds links from the article text to your destinations, categories and quote page (first mention only).
  async beforeSave(doc) {
    if (doc.autoLink && doc.content) doc.content = autolink.apply(doc.content, await autolink.rules());
  },
  check: (doc) => (doc.content && !String(doc.content).replace(/<[^>]+>/g, '').trim() ? { content: 'The article is empty' } : {}),
  sections: [
    { title: 'Basics', fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', required: true, from: 'title', help: 'Used in the URL: /blog/<slug>. Cannot be changed after saving.' },
      { name: 'excerpt', label: 'Excerpt (shown on cards and in search results)', type: 'textarea', rows: 3, required: true, max: 158 },
    ] },
    { title: 'Article', fields: [
      { name: 'content', label: 'Write your article', type: 'richtext', required: true, help: 'Use Heading 2 for main sections: they build the table of contents. Use "Link to..." to link your own tours and pages.' },
    ] },
    { title: 'Cover photo', fields: [
      { name: 'image', label: 'Cover photo', type: 'image', required: true },
      { name: 'imageAlt', label: 'Describe the cover photo', type: 'text', help: 'Short description for Google and screen readers.' },
    ] },
    { title: 'Organise', fields: [
      { name: 'category', label: 'Category', type: 'text', suggest: 'categories', help: 'Pick an existing category or type a new one.' },
      { name: 'tags', label: 'Tags', type: 'tags', optionsFrom: 'postTags', custom: true },
      { name: 'related', label: 'Show these tours under the article', type: 'tags', scroll: true, optionsFrom: 'tours' },
      { name: 'finder', label: 'Show the safari price finder under the article', type: 'checkbox' },
      { name: 'autoLink', label: 'Link place names and offers to your own pages automatically', type: 'checkbox', help: 'Links the first mention of each destination, Great Migration, quote and so on. Links you add yourself are never changed.' },
      { name: 'relatedPosts', label: 'Related articles (otherwise the same category is used)', type: 'tags', scroll: true, optionsFrom: 'posts' },
    ] },
    { title: 'Search engines (SEO)', fields: [
      { name: 'focusKeyword', label: 'Focus keyword', type: 'text', placeholder: 'e.g. tanzania safari cost', help: 'The phrase you want this article to rank for. The SEO assistant checks it for you.' },
      { name: 'metaTitle', label: 'SEO title', type: 'text', max: 60 },
      { name: 'metaDescription', label: 'SEO description', type: 'textarea', rows: 3, max: 158 },
      { name: 'noindex', label: 'Hide from search engines', type: 'checkbox' },
    ] },
    { title: 'Publishing', side: true, fields: [
      { name: 'status', label: 'Status', type: 'status' },
      { name: 'published', label: 'Publish date', type: 'date', help: 'A future date schedules the post: it goes live on that day.' },
      { name: 'author', label: 'Author', type: 'select', optionsFrom: 'authors', blank: 'Glad Of Africa team' },
      { name: 'authorTitle', label: 'Author role or credential (optional)', type: 'text', placeholder: 'Licensed safari guide, 10 years in the Serengeti', help: 'Shown to Google as the author job title. Type only what is true.' },
      { name: 'featured', label: 'Feature this post at the top of the blog', type: 'checkbox' },
    ] },
    { title: 'SEO assistant', side: true, fields: [{ name: 'seoPanel', type: 'seopanel', display: true }] },
  ],
});
