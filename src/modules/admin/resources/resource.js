/** Flattens a resource's form sections into `fields` (used by the form parser). */
module.exports = (def) => ({ ...def, fields: def.sections.flatMap((s) => s.fields) });
