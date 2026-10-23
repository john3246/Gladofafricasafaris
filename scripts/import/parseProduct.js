const { text, meta, all } = require('./html');

const upload = (u) => /wp-content\/uploads\/\d{4}\/\d{2}\//.test(u) && !/logo|\/2022\/07\//i.test(u);
const fullSize = (u) => u.replace(/-\d+x\d+(\.\w+)$/, '$1');

/** Gallery images are embedded as escaped JSON in a data attribute. */
function galleryImages(html) {
  const found = [...html.matchAll(/&quot;src&quot;:&quot;([^&]+?)&quot;/g)].map((m) => m[1].replace(/\\\//g, '/'));
  const og = meta(html, 'og:image');
  return [...new Set([og, ...found].filter(Boolean).map(fullSize).filter(upload))];
}

function section(html, id) {
  const m = html.match(new RegExp(`id="${id}">([\\s\\S]*?)(?=<div class="content-product-item|<!--\\s*Tour|$)`));
  return m ? m[1] : '';
}

function itinerary(html) {
  const plan = html.slice(html.indexOf('id="tour-plan"'));
  const days = [...plan.matchAll(/tour-plan-day">\s*(?:Day\s*)?(\d+)[\s\S]*?tour-plan-label">([\s\S]*?)<\/span>[\s\S]*?tour-plan-description">([\s\S]*?)<\/div>/g)];
  const ACC = /<strong[^>]*>\s*(?:Accommodation|Overnight|Stay)\s*:?\s*<\/strong>\s*:?\s*([\s\S]*?)(?:<\/p>|$)/i;
  return days.map((m) => {
    const body = m[3];
    const acc = body.match(ACC);
    const main = body.replace(/(?:<br[^>]*>\s*)?<strong[^>]*>\s*(?:Accommodation|Overnight|Stay)[\s\S]*$/i, '');
    return { day: Number(m[1]), title: text(m[2]), text: text(main), accommodation: acc ? text(acc[1]) : '' };
  });
}

function parseProduct(html, url) {
  const desc = section(html, 'tour-description');
  // Skip heading-like paragraphs ("Tour Overview", "(Best Travel Period: ...)").
  const paras = all(desc, /<p[^>]*>([\s\S]*?)<\/p>/g).filter((p) => p.length > 60);
  const price = Number((meta(html, 'product:price:amount') || '0').replace(/,/g, ''));
  const incl = all(html, /<li class="item-tour-included">([\s\S]*?)<\/li>/g);
  const excl = all(html, /<li class="item-tour-excluded">([\s\S]*?)<\/li>/g);
  const highlights = all(desc.slice(desc.search(/Highlights/i)), /<li[^>]*>([\s\S]*?)<\/li>/g);

  return {
    slug: url.split('/product/')[1].replace(/\/$/, '').replace(/-2$/, ''),
    title: meta(html, 'og:title').replace(/\s+-\s+Glad Of Africa.*$/i, ''),
    priceFrom: price,
    description: paras,
    highlights,
    includes: incl,
    excludes: excl,
    itinerary: itinerary(html),
    images: galleryImages(html),
  };
}

module.exports = { parseProduct };
