/** Whole sentences up to ~200 chars; falls back to a word-boundary cut with an ellipsis. */
function shortSummary(para = '') {
  let out = '';
  for (const s of para.split(/(?<=[.!?])\s+/)) {
    if (`${out} ${s}`.trim().length > 200) break;
    out = `${out} ${s}`.trim();
  }
  return out || `${para.slice(0, 197).replace(/\s+\S*$/, '')}…`;
}

const PROPER = ['Zanzibar', 'Serengeti', 'Arusha', 'Tarangire', 'Ngorongoro Crater', 'Mara River', 'Kilimanjaro', 'Great Migration', 'Mount Meru'];

/** Restores capitalisation of place names that the source documents sometimes write in lower case. */
const properNouns = (s) => PROPER.reduce((acc, p) => acc.replace(new RegExp(p, 'gi'), p), s);

/** "DAY 1: ARRIVAL IN ARUSHA" style shouting -> "Arrival in Arusha"; mixed case keeps its words. */
function tidyTitle(s) {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t !== t.toUpperCase()) return properNouns(t.charAt(0).toUpperCase() + t.slice(1));
  const small = /\b(In|To|Of|And|The|From)\b/g;
  return properNouns(t.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(small, (w) => w.toLowerCase()).replace(/^./, (c) => c.toUpperCase()));
}

module.exports = { shortSummary, tidyTitle };
