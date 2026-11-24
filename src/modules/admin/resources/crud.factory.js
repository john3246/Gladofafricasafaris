const express = require('express');
const asyncHandler = require('../../../utils/asyncHandler');
const { parseBody, validate } = require('../lib/fields');
const audit = require('../lib/audit');
const { flash } = require('../lib/flash');
const { toCsv } = require('../lib/csv');
const { newId } = require('../../../store');
const extras = require('../../../services/extras.service');

const PAGE_SIZE = 20;
const isDraft = (d) => d.draft === true;
const asArray = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/**
 * Builds list / create / edit / delete / publish / duplicate / history routes for a resource definition
 * (see ./defs), plus bulk actions, column sorting and CSV export.
 * Mounted by admin.routes.js at /admin/<def.slug>.
 */
module.exports = function crud(def) {
  const router = express.Router();
  const base = `/admin/${def.slug}`;
  const col = def.collection;
  const key = col.keyField;
  const titleOf = (d) => String(def.title(d)).replace(/<[^>]+>/g, '');
  const canCreate = def.canCreate !== false;
  const canDelete = def.canDelete !== false;
  const publishing = def.publishing !== false;
  const bulkActions = [
    ...(publishing ? [{ value: 'publish', label: 'Publish' }, { value: 'unpublish', label: 'Move to drafts' }] : []),
    ...(def.bulkActions || []),
    ...(canDelete ? [{ value: 'delete', label: 'Delete', danger: true }] : []),
  ];

  const options = async () => (def.loadOptions ? def.loadOptions() : {});
  const locked = (doc) => !!(def.locked && def.locked(doc));
  /** The definition for this request: the fixed sections plus any custom fields the editor has added. */
  async function liveDef() {
    const extra = def.extras ? await extras.formFields(def.extras) : [];
    if (!extra.length) return def;
    const sections = [...def.sections];
    const at = sections.findIndex((s) => s.side);
    sections.splice(at < 0 ? sections.length : at, 0, { title: 'Extra details', fields: extra });
    return { ...def, sections, fields: sections.flatMap((s) => s.fields) };
  }
  const render = (res, view, data) =>
    res.render(`admin/views/resource/${view}`, { def, base, isLocked: locked, active: def.slug, pageTitle: def.label, canCreate, canDelete, publishing, bulkActions, ...data });
  const cmp = (a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true }));

  async function filtered(query) {
    const q = String(query.q || '').toLowerCase().trim();
    let items = await col.list();
    const total = items.length;
    if (q) items = items.filter((d) => JSON.stringify(def.searchText ? def.searchText(d) : d).toLowerCase().includes(q));
    if (query.status === 'draft') items = items.filter(isDraft);
    if (query.status === 'published') items = items.filter((d) => !isDraft(d));
    if (query.filter && def.filters) items = items.filter((d) => def.filters.fn(d, query.filter));
    const si = Number(query.sort);
    const c = def.columns[si];
    if (c) {
      const dir = query.dir === 'desc' ? -1 : 1;
      const val = c.sort || c.cell;
      items = [...items].sort((a, b) => dir * cmp(val(a), val(b)));
    }
    return { items, total };
  }

  router.get('/', asyncHandler(async (req, res) => {
    const { items, total } = await filtered(req.query);
    const page = Math.max(1, Number(req.query.page) || 1);
    render(res, 'list', {
      items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), q: req.query.q || '', status: req.query.status || '',
      filter: req.query.filter || '', sortCol: req.query.sort ?? '', dir: req.query.dir === 'desc' ? 'desc' : 'asc',
      page, pages: Math.max(1, Math.ceil(items.length / PAGE_SIZE)), count: items.length, total, titleOf, isDraft,
      filterOptions: def.filters ? (def.filters.load ? await def.filters.load() : def.filters.options) : [],
    });
  }));

  router.get('/export.csv', asyncHandler(async (req, res) => {
    const { items } = await filtered(req.query);
    const cols = def.csv || [...def.columns.map((c) => ({ label: c.label, value: c.cell })), { label: 'Status', value: (d) => (isDraft(d) ? 'Draft' : 'Published') }];
    res.type('text/csv').attachment(`${def.slug}.csv`).send(toCsv(cols.map((c) => c.label), items.map((d) => cols.map((c) => c.value(d)))));
  }));

  router.post('/bulk', asyncHandler(async (req, res) => {
    const keys = asArray(req.body.keys);
    const action = req.body.action;
    const spec = bulkActions.find((a) => a.value === action);
    if (!keys.length || !spec) {
      flash(req, 'error', keys.length ? 'Choose an action first.' : 'Select at least one item.');
      return res.redirect(req.get('referer') || base);
    }
    let done = 0;
    for (const k of keys) {
      const doc = await col.get(k);
      if (!doc) continue;
      if (action === 'delete' && locked(doc)) continue;
      if (action === 'delete') {
        await audit.snapshot(req, col.name, k, doc);
        await col.remove(k);
      } else {
        await audit.snapshot(req, col.name, k, doc);
        if (action === 'publish') delete doc.draft;
        else if (action === 'unpublish') doc.draft = true;
        else await spec.run(doc, req.body);
        await col.put(doc);
      }
      await audit.record(req, `bulk ${action}`, col.name, k, titleOf(doc));
      done += 1;
    }
    flash(req, 'success', `${done} ${done === 1 ? def.singular.toLowerCase() : def.label.toLowerCase()} updated (${spec.label.toLowerCase()}).`);
    res.redirect(req.get('referer') || base);
  }));

  if (canCreate) {
    router.get('/new', asyncHandler(async (req, res) => {
      const doc = { ...(def.defaults ? def.defaults() : {}), ...(def.prefill ? await def.prefill(req.query) : {}) };
      render(res, 'form', { def: await liveDef(), doc, isNew: true, errors: {}, opts: await options(), titleOf, history: [] });
    }));

    router.post('/new', asyncHandler(async (req, res) => {
      const D = await liveDef();
      const doc = parseBody(D, req.body, def.defaults ? def.defaults() : {});
      if (def.autoKey) doc[key] = doc[key] || (await def.autoKey(doc, newId));
      const errors = { ...validate(D, doc), ...(def.check ? def.check(doc) : {}) };
      if (!errors[key] && doc[key] && (await col.get(doc[key]))) errors[key] = 'That address is already used by another item';
      if (Object.keys(errors).length) {
        return render(res.status(422), 'form', { def: D, doc, isNew: true, errors, opts: await options(), titleOf, history: [] });
      }
      if (def.beforeSave) await def.beforeSave(doc);
      await col.put(extras.fold(doc));
      await audit.record(req, 'created', col.name, doc[key], titleOf(doc));
      flash(req, 'success', `${def.singular} created.`);
      res.redirect(`${base}/${encodeURIComponent(doc[key])}/edit`);
    }));
  }

  router.get('/:key/edit', asyncHandler(async (req, res, next) => {
    const doc = await col.get(req.params.key);
    if (!doc) return next();
    render(res, 'form', { def: await liveDef(), doc: extras.unfold(def.toForm ? def.toForm(doc) : doc), isNew: false, errors: {}, opts: await options(), titleOf, history: await audit.activity(col.name, doc[key]) });
  }));

  router.post('/:key', asyncHandler(async (req, res, next) => {
    const existing = await col.get(req.params.key);
    if (!existing) return next();
    const D = await liveDef();
    const doc = parseBody(D, req.body, extras.unfold(existing));
    doc[key] = existing[key]; // the address (slug/id) never changes after creation
    const errors = { ...validate(D, doc), ...(def.check ? def.check(doc) : {}) };
    if (Object.keys(errors).length) {
      return render(res.status(422), 'form', { def: D, doc, isNew: false, errors, opts: await options(), titleOf, history: [] });
    }
    await audit.snapshot(req, col.name, existing[key], existing);
    if (def.beforeSave) await def.beforeSave(doc);
    await col.put(extras.fold(doc));
    await audit.record(req, 'updated', col.name, doc[key], titleOf(doc));
    flash(req, 'success', `${def.singular} saved.`);
    res.redirect(`${base}/${encodeURIComponent(doc[key])}/edit`);
  }));

  router.post('/:key/toggle', asyncHandler(async (req, res, next) => {
    const doc = await col.get(req.params.key);
    if (!doc) return next();
    if (doc.draft) delete doc.draft; else doc.draft = true;
    await col.put(doc);
    await audit.record(req, doc.draft ? 'unpublished' : 'published', col.name, doc[key], titleOf(doc));
    flash(req, 'success', `${titleOf(doc)} is now ${doc.draft ? 'a draft' : 'published'}.`);
    res.redirect(req.get('referer') || base);
  }));

  if (canCreate && def.canDuplicate !== false) {
    router.post('/:key/duplicate', asyncHandler(async (req, res, next) => {
      const doc = await col.get(req.params.key);
      if (!doc) return next();
      const copy = { ...doc, draft: true, sort: undefined };
      copy[key] = def.autoKey ? await def.autoKey(copy, newId) : `${doc[key]}-copy-${Date.now().toString(36).slice(-3)}`;
      if (copy.title) copy.title = `${copy.title} (copy)`;
      if (copy.name) copy.name = `${copy.name} (copy)`;
      await col.put(copy);
      await audit.record(req, 'duplicated', col.name, copy[key], titleOf(copy));
      flash(req, 'success', 'Duplicated as a draft. Review it and publish when ready.');
      res.redirect(`${base}/${encodeURIComponent(copy[key])}/edit`);
    }));
  }

  if (canDelete) {
    router.post('/:key/delete', asyncHandler(async (req, res, next) => {
      const doc = await col.get(req.params.key);
      if (!doc) return next();
      if (locked(doc)) {
        flash(req, 'error', `"${titleOf(doc)}" is a core ${def.singular.toLowerCase()} and cannot be deleted. You can unpublish or edit it instead.`);
        return res.redirect(base);
      }
      await audit.snapshot(req, col.name, doc[key], doc);
      await col.remove(doc[key]);
      await audit.record(req, 'deleted', col.name, doc[key], titleOf(doc));
      flash(req, 'success', `"${titleOf(doc)}" deleted. A copy was kept in the revision history.`);
      res.redirect(base);
    }));
  }

  router.get('/:key/history', asyncHandler(async (req, res, next) => {
    const doc = await col.get(req.params.key);
    if (!doc) return next();
    render(res, 'history', { doc, titleOf, revs: await audit.history(col.name, doc[key]) });
  }));

  router.post('/:key/restore/:rev', asyncHandler(async (req, res, next) => {
    const doc = await col.get(req.params.key);
    const rev = (await audit.history(col.name, req.params.key)).find((r) => r.id === req.params.rev);
    if (!doc || !rev) return next();
    await audit.snapshot(req, col.name, doc[key], doc);
    await col.put({ ...rev.data, [key]: doc[key] });
    await audit.record(req, 'restored', col.name, doc[key], titleOf(doc));
    flash(req, 'success', 'Previous version restored.');
    res.redirect(`${base}/${encodeURIComponent(doc[key])}/edit`);
  }));

  return router;
};
