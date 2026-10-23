const repo = require('./blog.repository');
const toursService = require('../tours/tours.service');

const list = async () => (await repo.findAll()).slice().sort((a, b) => b.published.localeCompare(a.published));

async function bySlugWithRelated(slug) {
  const post = await repo.findBySlug(slug);
  if (!post) return null;
  const tours = (await Promise.all((post.related || []).map((s) => toursService.bySlug(s)))).filter(Boolean);
  return { post, tours };
}

module.exports = { list, bySlugWithRelated, latest: async (n = 3) => (await list()).slice(0, n) };
