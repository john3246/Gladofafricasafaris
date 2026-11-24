/**
 * Form engine for CMS resources. A resource definition lists fields; this module turns a submitted
 * form body into a document (parse) and checks it (validate). Rendering lives in views/partials/field.ejs.
 *
 * Field types: hidden, text, slug, number, date, textarea, html, select, status, checkbox, tags, lines,
 * paragraphs, richtext, image, gallery, repeater. `display: true` fields render a widget but store nothing.
 */
const toArray = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const lines = (v) => String(v ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
const last = (v) => (Array.isArray(v) ? v[v.length - 1] : v);

function parseField(f, raw) {
  switch (f.type) {
    case 'number': {
      const v = last(raw);
      return v === undefined || v === '' ? undefined : Number(String(v).replace(/,/g, ''));
    }
    case 'checkbox': return ['1', 'on', 'true'].includes(String(last(raw)));
    case 'tags': return toArray(raw).filter(Boolean);
    case 'lines': case 'gallery': return lines(raw);
    case 'paragraphs': return String(raw ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    case 'repeater': {
      const rows = raw && typeof raw === 'object' ? Object.values(raw) : [];
      return rows
        .map((row) => Object.fromEntries(f.fields.map((sub) => [sub.name, parseField(sub, row[sub.name])])))
        .filter((row) => Object.values(row).some((v) => (Array.isArray(v) ? v.length : v !== undefined && v !== '' && v !== false)));
    }
    default: return String(last(raw) ?? '').trim();
  }
}

/** Builds the document: starts from `existing` so fields not in the form are preserved. */
function parseBody(def, body, existing = {}) {
  const doc = { ...existing };
  for (const f of def.fields) {
    if (f.display) continue; // display-only widgets (e.g. the SEO panel) have no stored value
    if (f.type === 'status') {
      if (last(body[f.name]) === 'draft') doc.draft = true; else delete doc.draft;
      continue;
    }
    if (f.readonly && existing[f.name] !== undefined) continue;
    const value = parseField(f, body[f.name]);
    if (value === undefined) delete doc[f.name]; else doc[f.name] = value;
  }
  return def.afterParse ? def.afterParse(doc, body) : doc;
}

function validate(def, doc) {
  const errors = {};
  for (const f of def.fields) {
    if (f.display) continue;
    const v = doc[f.name];
    const empty = v === undefined || v === '' || (Array.isArray(v) && !v.length);
    if (f.required && empty && f.type !== 'status') errors[f.name] = `${f.label} is required`;
    if (f.type === 'slug' && v && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v)) errors[f.name] = 'Use lowercase letters, numbers and hyphens only';
    if (f.type === 'number' && v !== undefined && Number.isNaN(v)) errors[f.name] = `${f.label} must be a number`;
  }
  return errors;
}

/** Value shown in a form input for a stored document value. */
function toInput(f, v) {
  if (v === undefined || v === null) return f.type === 'checkbox' ? false : f.type === 'tags' || f.type === 'repeater' ? [] : '';
  if (f.type === 'lines' || f.type === 'gallery') return v.join('\n');
  if (f.type === 'paragraphs') return v.join('\n\n');
  return v;
}

module.exports = { parseBody, validate, toInput, parseField };
