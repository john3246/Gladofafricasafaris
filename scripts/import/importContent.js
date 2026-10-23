const fs = require('fs');
const path = require('path');
const { BASE, getHtml } = require('./http');
const { parsePost } = require('./parsePost');
const { parseFaq } = require('./parseFaq');
const { saveWebp, saveRaw } = require('./images');


const DATA = path.join(__dirname, '..', '..', 'src', 'data');
const POSTS = [
  '7-day-ndutu-calving-season-safari-tanzania-itinerary-costs',
  'serengeti-big-cats-the-tree-climbing-cats-experience',
  'great-migration-safari',
];

async function importPosts() {
  const out = path.join(DATA, 'posts', 'imported');
  fs.mkdirSync(out, { recursive: true });
  for (const slug of POSTS) {
    const post = parsePost(await getHtml(`${BASE}/${slug}/`), `${BASE}/${slug}/`);
    post.image = (await saveWebp(post.image, `images/blog/${slug}`, 1400)) || null;
    post.category = 'Safari Guide';
    post.readMinutes = Math.max(3, Math.round(post.sections.flatMap((s) => s.p).join(' ').split(' ').length / 220));
    post.metaTitle = `${post.title} | Glad Of Africa`;
    post.metaDescription = post.excerpt;
    post.related = [];
    fs.writeFileSync(path.join(out, `${slug}.json`), `${JSON.stringify(post, null, 1)}\n`);
    console.log(`  post ${slug} sections:${post.sections.length} date:${post.published}`);
  }
}

async function importFaq() {
  const faqs = parseFaq(await getHtml(`${BASE}/faq/`));
  fs.writeFileSync(path.join(DATA, 'faqs.json'), `${JSON.stringify(faqs, null, 1)}\n`);
  console.log(`  faqs ${faqs.length}, groups: ${[...new Set(faqs.map((f) => f.group))].join(' | ')}`);
}

/** Logos, hero and the four experience-card photos from the live home page. */
async function importSiteImages() {
  const home = await getHtml(`${BASE}/`);
  await saveRaw(`${BASE}/wp-content/uploads/2022/07/white-logo-4.png`, 'images/logo-white.png');
  await saveRaw(`${BASE}/wp-content/uploads/2022/07/GREEN-LOGO-2.png`, 'images/logo-green.png');
  const heroUrl = `${BASE}/wp-content/uploads/2025/11/mara-river-5730663_1280-1.jpg`;
  await saveWebp(heroUrl, 'images/hero', 1800);
  await saveWebp(heroUrl, 'images/og-default', 1200);
  const cards = ['2026/08/5.jpg', '2026/08/6.jpg', '2026/08/11.jpg', '2026/08/images-11.jpg'];
  for (const [i, c] of cards.entries()) await saveWebp(`${BASE}/wp-content/uploads/${c}`, `images/experiences/${i + 1}`, 900);
  console.log(`  site images done (hero from ${heroUrl})`);
}

module.exports = { importPosts, importFaq, importSiteImages };
