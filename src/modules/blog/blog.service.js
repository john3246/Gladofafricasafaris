const repo = require('./blog.repository');
const { posts } = require('../../store/collections');
const toursService = require('../tours/tours.service');

const PAGE_SIZE = 9;
const newestFirst = (a, b) => b.published.localeCompare(a.published);
const list = async () => (await repo.findAll()).slice().sort(newestFirst);

async function bySlugWithRelated(slug, { preview = false } = {}) {
  // Editors previewing from the CMS may open drafts and scheduled posts.
  const post = preview ? await posts.get(slug) : await repo.findBySlug(slug);
  if (!post) return null;
  const tours = (await Promise.all((post.related || []).map((s) => toursService.bySlug(s)))).filter(Boolean);
  return { post, tours };
}

/** Same-category articles (or the ones the editor picked), newest first. */
async function relatedPosts(post, limit = 3) {
  const all = (await list()).filter((p) => p.slug !== post.slug);
  if (post.relatedPosts && post.relatedPosts.length) return post.relatedPosts.map((s) => all.find((p) => p.slug === s)).filter(Boolean).slice(0, limit);
  const score = (p) => (p.category === post.category ? 2 : 0) + (p.tags || []).filter((t) => (post.tags || []).includes(t)).length;
  return all.sort((a, b) => score(b) - score(a) || newestFirst(a, b)).slice(0, limit);
}

/** Blog index: featured posts first, optional category/tag filter, 9 per page. */
async function page({ category, tag, page: n = 1 } = {}) {
  let all = await list();
  const categories = [...new Set(all.map((p) => p.category).filter(Boolean))].sort();
  if (category) all = all.filter((p) => p.category === category);
  if (tag) all = all.filter((p) => (p.tags || []).includes(tag));
  all.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || newestFirst(a, b));
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, Number(n) || 1), pages);
  return { posts: all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), total: all.length, categories, page: current, pages };
}

module.exports = { list, bySlugWithRelated, relatedPosts, page, latest: async (n = 3) => (await list()).slice(0, n) };
