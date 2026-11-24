const { en } = require('./insurance.data');

/** The travel insurance page as a CMS document (CMS > Policy pages). */
module.exports = [{
  slug: 'travel-insurance', h1: en.h1, sub: en.sub, intro: en.intro, metaTitle: en.meta.title, metaDescription: en.meta.description,
  sections: en.sections.map((s) => ({ h: s.h, p: s.p || [], ul: s.ul || [] })), faqs: en.faqs, sort: 0,
}];
