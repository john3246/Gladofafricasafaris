/** Whole sentences up to ~200 characters (same rule the importer uses for tour summaries). */
function shortSummary(para = '') {
  let out = '';
  for (const s of String(para).split(/(?<=[.!?])\s+/)) {
    if (`${out} ${s}`.trim().length > 200) break;
    out = `${out} ${s}`.trim();
  }
  return out || `${String(para).slice(0, 197).replace(/\s+\S*$/, '')}${para.length > 197 ? '…' : ''}`;
}

const stripTags = (s = '') => String(s).replace(/<[^>]+>/g, '');

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

module.exports = { shortSummary, stripTags, slugify };
