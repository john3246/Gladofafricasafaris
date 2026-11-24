/** "Label | /path" lines <-> [{label, href}] used by the Menus & Navigation editor. */
const parseLinks = (text = '') =>
  String(text)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, href] = l.split('|').map((s) => s.trim());
      return { label, href: href || '#' };
    })
    .filter((l) => l.label);

const linksToText = (links = []) => links.map((l) => `${l.label} | ${l.href}`).join('\n');

module.exports = { parseLinks, linksToText };
