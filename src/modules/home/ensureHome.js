const { pages } = require('../../store/collections');

const BEST_SELLERS_BLOCK = require('../../data/bestsellers.block');

/**
 * Adds the best-selling section to a home page created before it existed, once. Editors can move, edit or delete it
 * afterwards; it is not added again because the page remembers that it was offered.
 */
async function addBestSellers() {
  const home = await pages.get('home');
  if (!home || home.bestSellerBlockAdded) return false;
  const blocks = [...(home.blocks || [])];
  if (!blocks.some((b) => b.category === 'best-selling')) {
    const after = blocks.findIndex((b) => b.type === 'regions') + 1;
    blocks.splice(Math.min(after || 2, blocks.length), 0, { ...BEST_SELLERS_BLOCK });
  }
  await pages.put({ ...home, blocks, bestSellerBlockAdded: true });
  return true;
}

module.exports = { addBestSellers, BEST_SELLERS_BLOCK };
