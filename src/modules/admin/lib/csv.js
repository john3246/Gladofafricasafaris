const quote = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** Builds a CSV string (UTF-8 BOM so Excel opens accents correctly). */
const toCsv = (headers, rows) => `﻿${[headers, ...rows].map((r) => r.map(quote).join(',')).join('\r\n')}`;

module.exports = { toCsv, quote };
