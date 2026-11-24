const { tidyTitle } = require('./text');

const DAY = /^\s*day\s*(\d+)\s*[:\-–—]\s*(.*)$/i;
const ACCOMMODATION = /accommodation\s*:\s*(.+?)\s*$/i;

/** Joins hard-wrapped lines (PDF text) into paragraphs; a line that ends a sentence closes the paragraph. */
function paragraphs(lines) {
  const out = [];
  let cur = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { if (cur) out.push(cur); cur = ''; continue; }
    cur = cur ? `${cur} ${line}` : line;
    if (/[.!?:]$/.test(line)) { out.push(cur); cur = ''; }
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * Parses an itinerary document (text extracted from the client's .docx/.pdf) into
 * { title, description[], itinerary[{day,title,text,accommodation}], priceFrom }.
 */
function parsePackage(raw) {
  const lines = raw.replace(/\r/g, '').split('\n');
  const dayAt = lines.map((l, i) => (DAY.test(l) ? i : -1)).filter((i) => i >= 0);
  const priceLine = lines.findIndex((l) => /^\s*price/i.test(l));
  const price = priceLine >= 0 ? Number((lines[priceLine].match(/([\d][\d,]*)/) || [])[1]?.replace(/,/g, '')) : 0;

  const introLines = lines.slice(0, dayAt[0]).filter((l) => !/day-by-day/i.test(l));
  const [title, ...desc] = paragraphs(introLines);

  const itinerary = dayAt.map((start, n) => {
    const end = dayAt[n + 1] ?? (priceLine > start ? priceLine : lines.length);
    const [, num, head] = lines[start].match(DAY);
    let accommodation = '';
    const body = lines.slice(start + 1, end).map((l) => {
      const m = l.match(ACCOMMODATION);
      if (!m) return l;
      accommodation = m[1].replace(/[.\s]+$/, '');
      return l.replace(ACCOMMODATION, '');
    }).filter((l) => !/^\s*overnight\s*:/i.test(l));
    return { day: Number(num), title: tidyTitle(head), text: paragraphs(body).join('\n\n'), accommodation };
  });

  return { title: (title || '').trim(), description: desc, itinerary, priceFrom: price };
}

module.exports = { parsePackage };
