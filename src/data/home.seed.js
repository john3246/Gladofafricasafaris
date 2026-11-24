/**
 * The home page as an ordered list of sections (CMS > Pages > Home page). Editors can reorder, edit, hide,
 * delete and add sections of any type. Tour picks below match the original hand-built layout.
 */
const b = (type, o = {}) => ({ type, ...o });

const blocks = require('./home.gm');

module.exports = {
  slug: 'home', title: 'Home', subtitle: '', body: '', sort: 0, menu: 'none', bestSellerBlockAdded: true,
  metaTitle: 'Tanzania Safari Tours: Luxury, Midrange & Budget | Glad Of Africa',
  metaDescription: 'Locally owned Arusha tour operator for northern Tanzania safaris: Serengeti Great Migration, Ngorongoro Crater and Kilimanjaro. Luxury to budget. Get a free quote.',
  blocks,
};
