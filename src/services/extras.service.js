const { customfields } = require('../store/collections');
const { isLive } = require('../store/publicRepository');

/**
 * Custom fields (CMS > Custom Fields): extra details an editor adds to tours, destinations or blog posts.
 * Values live in `doc.extras[key]`. This module serves both the CMS form and the public pages.
 */
const TYPES = [
  { value: 'text', label: 'Short text' }, { value: 'textarea', label: 'Long text' }, { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' }, { value: 'url', label: 'Web link' }, { value: 'select', label: 'Choice list' },
  { value: 'checkbox', label: 'Yes / no' }, { value: 'image', label: 'Photo' },
];

async function definitions(resource) {
  return (await customfields.list()).filter((f) => f.appliesTo === resource && isLive(f)).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

const isEmpty = (v) => v === undefined || v === null || v === '' || v === false;

/** Labelled values for the public site: only fields marked "show on website" that have a value. */
async function visible(resource, doc) {
  const values = (doc && doc.extras) || {};
  return (await definitions(resource))
    .filter((f) => f.showOnSite && !isEmpty(values[f.key]))
    .map((f) => ({ label: f.label, type: f.type, value: f.type === 'checkbox' ? 'Yes' : values[f.key] }));
}

/** Form-field definitions for the CMS editor (names are prefixed x_ and folded into doc.extras on save). */
async function formFields(resource) {
  return (await definitions(resource)).map((f) => ({
    name: `x_${f.key}`, label: f.label, help: f.help, required: !!f.required,
    type: f.type === 'url' ? 'text' : f.type,
    options: f.type === 'select' ? f.options || [] : undefined,
    blank: f.type === 'select' ? 'Not set' : undefined,
    wide: f.type === 'textarea' || f.type === 'image',
  }));
}

/** Copies x_* form values into doc.extras and removes them from the document root. */
function fold(doc) {
  const extras = { ...(doc.extras || {}) };
  Object.keys(doc).filter((k) => k.startsWith('x_')).forEach((k) => {
    if (isEmpty(doc[k])) delete extras[k.slice(2)]; else extras[k.slice(2)] = doc[k];
    delete doc[k];
  });
  if (Object.keys(extras).length) doc.extras = extras; else delete doc.extras;
  return doc;
}

/** The inverse: exposes doc.extras as x_* so the editor form can show them. */
const unfold = (doc) => ({ ...doc, ...Object.fromEntries(Object.entries(doc.extras || {}).map(([k, v]) => [`x_${k}`, v])) });

module.exports = { TYPES, definitions, visible, formFields, fold, unfold };
