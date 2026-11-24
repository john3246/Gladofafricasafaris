/* CMS behaviour: layout, dropdowns, toasts, command palette, shortcuts, bulk actions, forms, repeaters, image picker, uploads. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } } };

  /* ---------- Sidebar (mobile drawer + desktop collapse) ---------- */
  var sidebar = $('#sidebar'), backdrop = $('#sidebar-backdrop');
  var tg = $('#sidebar-toggle');
  function drawer(open) {
    sidebar.classList.toggle('-translate-x-full', !open);
    backdrop.classList.toggle('hidden', !open);
    document.body.classList.toggle('nav-open', open);
    if (tg) tg.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (tg) tg.addEventListener('click', function () { drawer(sidebar.classList.contains('-translate-x-full')); });
  var closeBtn = $('#sidebar-close'); if (closeBtn) closeBtn.addEventListener('click', function () { drawer(false); });
  sidebar.addEventListener('click', function (e) { if (e.target.closest('a')) drawer(false); }); // tapping a menu link closes the drawer
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') drawer(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024) drawer(false); });
  if (backdrop) backdrop.addEventListener('click', function () { drawer(false); });
  if (store.get('glad-sb') === '1') document.body.classList.add('sb-collapsed');
  var col = $('#sidebar-collapse');
  if (col) col.addEventListener('click', function () { store.set('glad-sb', document.body.classList.toggle('sb-collapsed') ? '1' : '0'); });

  /* ---------- Dropdowns ---------- */
  function closeMenus(except) { $$('[data-dropdown]').forEach(function (b) { var m = $('#' + b.dataset.dropdown); if (m && m !== except) m.classList.add('hidden'); }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-dropdown]');
    if (b) { var m = $('#' + b.dataset.dropdown); closeMenus(m); m.classList.toggle('hidden'); return; }
    if (!e.target.closest('#notif-menu, #user-menu')) closeMenus();

    var t = e.target.closest('[data-dismiss]'); if (t) t.parentElement.remove();
    var c = e.target.closest('[data-confirm]');
    if (c && !window.confirm(c.getAttribute('data-confirm'))) e.preventDefault();
    var cp = e.target.closest('[data-copy]');
    if (cp) {
      var url = location.origin + cp.getAttribute('data-copy');
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () {
        var old = cp.innerHTML; cp.textContent = 'Copied!'; setTimeout(function () { cp.innerHTML = old; }, 1200);
      }, function () { window.prompt('Copy this link:', url); });
    }
  });
  $$('[data-autosubmit]').forEach(function (s) { s.addEventListener('change', function () { s.form.submit(); }); });

  /* ---------- Toasts fade out ---------- */
  $$('[data-toast]').forEach(function (t, i) {
    setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 450); }, 5000 + i * 800);
  });

  /* ---------- Command palette (Ctrl/Cmd + K) ---------- */
  var PAGES = [
    ['Dashboard', '/admin'], ['Analytics', '/admin/analytics'], ['Tours & Packages', '/admin/tours'], ['Add new tour', '/admin/tours/new'], ['Destinations', '/admin/destinations'],
    ['Add destination', '/admin/destinations/new'], ['Blog posts', '/admin/blog'], ['Write a blog post', '/admin/blog/new'], ['Pages & Website Content', '/admin/pages'], ['Media Library', '/admin/media'],
    ['Testimonials & Reviews', '/admin/reviews'], ['FAQs', '/admin/faqs'], ['Menus & Navigation', '/admin/menus'], ['SEO check', '/admin/seo'], ['Redirects & 404s', '/admin/redirects'],
    ['Inquiries', '/admin/inquiries'], ['New inquiries', '/admin/inquiries?status=new'], ['Bookings', '/admin/bookings'], ['New booking', '/admin/bookings/new'], ['Customers', '/admin/customers'],
    ['Subscribers', '/admin/subscribers'], ['Users & Roles', '/admin/users'], ['Audit log', '/admin/audit'], ['Backup & Restore', '/admin/backup'], ['Site Settings', '/admin/settings'], ['My profile', '/admin/profile'],
  ];
  var pal = $('#palette'), pin = $('#palette-input'), plist = $('#palette-list'), sel = 0, items = [], timer;
  function paint() {
    plist.innerHTML = items.map(function (it, i) {
      return '<li><a href="' + it.href + '" data-i="' + i + '" class="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ' + (i === sel ? 'bg-[#3e7b27] text-white' : 'hover:bg-gray-100') + '"><span class="truncate">' + it.title + '</span><span class="shrink-0 text-[11px] opacity-60">' + it.type + '</span></a></li>';
    }).join('') || '<li class="px-3 py-6 text-center text-sm text-gray-500">No matches</li>';
  }
  function build(q) {
    q = q.toLowerCase().trim();
    var pages = PAGES.filter(function (p) { return !q || p[0].toLowerCase().indexOf(q) !== -1; }).slice(0, 8).map(function (p) { return { title: p[0], href: p[1], type: 'Go to' }; });
    items = pages; sel = 0; paint();
    clearTimeout(timer);
    if (q.length >= 2) timer = setTimeout(function () {
      fetch('/admin/search/json?q=' + encodeURIComponent(q), { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (rows) {
        if (pin.value.toLowerCase().trim() !== q) return;
        items = pages.concat(rows); paint();
      });
    }, 200);
  }
  function openPalette() { pal.classList.remove('hidden'); pal.classList.add('flex'); pin.value = ''; build(''); pin.focus(); }
  function closePalette() { pal.classList.add('hidden'); pal.classList.remove('flex'); }
  $$('[data-palette-open]').forEach(function (b) { b.addEventListener('click', openPalette); });
  if (pal) {
    pin.addEventListener('input', function () { build(pin.value); });
    pal.addEventListener('click', function (e) { if (e.target === pal) closePalette(); });
    pin.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); paint(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
      else if (e.key === 'Enter' && items[sel]) { location.href = items[sel].href; }
    });
  }
  document.addEventListener('keydown', function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); if (pal) (pal.classList.contains('hidden') ? openPalette() : closePalette()); }
    else if (e.key === 'Escape') { closePalette(); closeMenus(); var m = $('#image-picker'); if (m) m.classList.add('hidden'); }
    else if (mod && e.key.toLowerCase() === 's') { var f = $('#resource-form') || $('form[data-dirty-guard]'); if (f) { e.preventDefault(); dirty = false; f.requestSubmit ? f.requestSubmit() : f.submit(); } }
  });

  /* ---------- Unsaved-changes guard ---------- */
  var dirty = false;
  $$('form[data-dirty-guard]').forEach(function (f) {
    f.addEventListener('input', function () { dirty = true; });
    f.addEventListener('submit', function () { dirty = false; });
  });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Bulk selection on lists ---------- */
  var bar = $('[data-bulk-bar]');
  if (bar) {
    var checks = $$('[data-row-check]'), all = $('[data-select-all]'), cnt = $('[data-bulk-count]'), act = $('[data-bulk-action]'), inp = $('[data-bulk-input]');
    var sync = function () {
      var n = checks.filter(function (c) { return c.checked; }).length;
      cnt.textContent = n; bar.classList.toggle('hidden', n === 0); bar.classList.toggle('flex', n > 0);
      if (all) all.checked = n && n === checks.length;
    };
    checks.forEach(function (c) { c.addEventListener('change', sync); });
    if (all) all.addEventListener('change', function () { checks.forEach(function (c) { c.checked = all.checked; }); sync(); });
    act.addEventListener('change', function () {
      var opt = act.options[act.selectedIndex];
      inp.classList.toggle('hidden', !opt.dataset.input); inp.placeholder = opt.dataset.placeholder || ''; inp.required = !!opt.dataset.input;
    });
    var apply = $('[data-confirm-bulk]');
    apply.addEventListener('click', function (e) {
      var opt = act.options[act.selectedIndex];
      if (opt && opt.value === 'delete' && !window.confirm('Delete the selected items? You can restore them from the Audit Log.')) e.preventDefault();
    });
  }

  /* ---------- Reply templates (inquiry page) ---------- */
  var tpl = $('#templates');
  if (tpl) {
    var data = JSON.parse(tpl.textContent);
    $$('[data-template]').forEach(function (b) {
      b.addEventListener('click', function () { var t = data[b.dataset.template]; $('#subject').value = t.subject; $('#body').value = t.body; $('#body').focus(); });
    });
  }

  /* ---------- Slug from title (new items only) ---------- */
  $$('[data-slug]').forEach(function (input) {
    var from = input.getAttribute('data-slug-from') && $('[name="' + input.getAttribute('data-slug-from') + '"]');
    if (!from || input.readOnly || input.value) return;
    from.addEventListener('input', function () {
      if (input.dataset.touched) return;
      input.value = from.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    });
    input.addEventListener('input', function () { input.dataset.touched = '1'; });
  });

  /* ---------- Character counters for SEO fields ---------- */
  $$('[data-max]').forEach(function (el) {
    var max = Number(el.getAttribute('data-max'));
    var note = document.createElement('p'); note.className = 'a-help'; el.insertAdjacentElement('afterend', note);
    var upd = function () { note.textContent = el.value.length + ' / ' + max + ' characters'; note.style.color = el.value.length > max ? '#b91c1c' : ''; };
    el.addEventListener('input', upd); upd();
  });

  /* ---------- Repeaters (itinerary days, article sections) ---------- */
  function renumber(rep) {
    var rows = $$('[data-row]', $('[data-items]', rep)).filter(function (r) { return r.closest('[data-repeater]') === rep; });
    rows.forEach(function (row, i) {
      var n = $('[data-row-number]', row); if (n) n.textContent = i + 1;
      $$('[name]', row).forEach(function (el) {
        el.name = el.name.replace(new RegExp('^' + rep.dataset.name.replace(/[[\]]/g, '\\$&') + '\\[[^\\]]*\\]'), rep.dataset.name + '[' + i + ']');
        if (el.id) el.id = el.id.replace(/-\d+-|-__i__-/, '-' + i + '-');
      });
    });
  }
  $$('[data-repeater]').forEach(function (rep) {
    var items = $('[data-items]', rep), tplEl = $('[data-template]', rep);
    $('[data-add-row]', rep).addEventListener('click', function () {
      var html = tplEl.innerHTML.replace(/__i__/g, String(items.children.length));
      var wrap = document.createElement('div'); wrap.innerHTML = html.trim();
      items.appendChild(wrap.firstElementChild); renumber(rep); dirty = true;
      var first = items.lastElementChild.querySelector('input,textarea'); if (first) first.focus();
    });
    rep.addEventListener('click', function (e) {
      var row = e.target.closest('[data-row]'); if (!row) return;
      if (e.target.closest('[data-remove-row]')) { if (window.confirm('Remove this entry?')) { row.remove(); renumber(rep); dirty = true; } }
      var mv = e.target.closest('[data-move]');
      if (mv) {
        var dir = Number(mv.dataset.move);
        var sib = dir < 0 ? row.previousElementSibling : row.nextElementSibling;
        if (sib) { dir < 0 ? items.insertBefore(row, sib) : items.insertBefore(sib, row); renumber(rep); dirty = true; }
      }
    });
  });

  /* ---------- Image picker modal ---------- */
  var modal, cache = null, onPick = null;
  function buildModal() {
    modal = document.createElement('div'); modal.id = 'image-picker';
    modal.className = 'fixed inset-0 z-[75] hidden items-center justify-center bg-black/60 p-4';
    modal.innerHTML = '<div class="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">' +
      '<div class="flex items-center justify-between border-b border-black/10 px-5 py-3"><strong>Choose a photo</strong><button type="button" data-close class="text-2xl leading-none">&times;</button></div>' +
      '<div class="flex gap-2 border-b border-black/10 px-5 py-2 text-sm font-semibold"><button type="button" data-tab="uploads" class="rounded-md px-3 py-1.5">My uploads</button><button type="button" data-tab="site" class="rounded-md px-3 py-1.5">Website images</button>' +
      '<input data-search placeholder="Search..." class="ml-auto w-48 rounded-md border border-black/15 px-3 py-1.5 text-sm font-normal"></div>' +
      '<div data-grid class="grid flex-1 grid-cols-3 gap-3 overflow-y-auto p-5 sm:grid-cols-4 md:grid-cols-5"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('[data-close]')) closePicker();
      var tab = e.target.closest('[data-tab]'); if (tab) { modal.dataset.tab = tab.dataset.tab; draw(); }
      var pick = e.target.closest('[data-url]'); if (pick) { onPick(pick.dataset.url); closePicker(); }
    });
    $('[data-search]', modal).addEventListener('input', draw);
  }
  function closePicker() { modal.classList.add('hidden'); modal.classList.remove('flex'); }
  function draw() {
    var tab = modal.dataset.tab || 'uploads', q = $('[data-search]', modal).value.toLowerCase();
    $$('[data-tab]', modal).forEach(function (b) { b.className = 'rounded-md px-3 py-1.5 ' + (b.dataset.tab === tab ? 'bg-[#3e7b27] text-white' : 'hover:bg-gray-100'); });
    var list = (cache[tab] || []).filter(function (i) { return (i.name + i.url).toLowerCase().indexOf(q) !== -1; }).slice(0, 150);
    $('[data-grid]', modal).innerHTML = list.length ? list.map(function (i) {
      return '<button type="button" data-url="' + i.url + '" class="group overflow-hidden rounded-lg border border-black/10 text-left hover:ring-2 hover:ring-[#3e7b27]"><img src="' + i.url + '" loading="lazy" class="aspect-square w-full object-cover"><span class="block truncate px-2 py-1 text-[11px]">' + i.name + '</span></button>';
    }).join('') : '<p class="col-span-full py-10 text-center text-gray-500">' + (tab === 'uploads' ? 'No uploads yet. Add photos in the Media Library.' : 'Nothing found.') + '</p>';
  }
  $('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = $(b.getAttribute('data-copy')); if (!el) return; el.select();
      var done = function () { b.textContent = 'Copied'; };
      if (navigator.clipboard) navigator.clipboard.writeText(el.value).then(done, function () { document.execCommand('copy'); done(); });
      else { document.execCommand('copy'); done(); }
    });
  });
  $('[data-find]').forEach(function (box) { // live filter for long tables
    box.addEventListener('input', function () {
      var q = box.value.toLowerCase().trim();
      $('[data-row][data-text]').forEach(function (r) { r.hidden = q && r.getAttribute('data-text').indexOf(q) === -1; });
    });
  });
  window.GladCms = { pickImage: function (cb) { openPicker(cb); } };
  function openPicker(cb) {
    if (!modal) buildModal();
    onPick = cb; modal.classList.remove('hidden'); modal.classList.add('flex');
    (cache ? Promise.resolve(cache) : fetch('/admin/media/json', { credentials: 'same-origin' }).then(function (r) { return r.json(); })).then(function (d) { cache = d; draw(); });
  }
  $$('[data-image-field]').forEach(function (box) {
    var input = $('[data-image-input]', box), img = $('[data-preview]', box);
    var show = function () { img.src = input.value; img.hidden = !input.value; };
    input.addEventListener('input', show);
    $('[data-pick-image]', box).addEventListener('click', function () { openPicker(function (u) { input.value = u; show(); dirty = true; }); });
  });
  $$('[data-gallery-field]').forEach(function (box) {
    var ta = $('[data-gallery-input]', box), thumbs = $('[data-gallery-thumbs]', box);
    function render() {
      thumbs.innerHTML = '';
      ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (u) {
        var im = document.createElement('img'); im.src = u; im.className = 'h-14 w-20 rounded object-cover ring-1 ring-black/10'; im.alt = ''; thumbs.appendChild(im);
      });
    }
    ta.addEventListener('input', render); render();
    $('[data-pick-gallery]', box).addEventListener('click', function () {
      openPicker(function (u) { ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + u; render(); dirty = true; });
    });
  });

  /* ---------- Drag & drop upload on the media page ---------- */
  var dz = $('[data-dropzone]');
  if (dz) {
    var fileInput = $('input[type=file]', dz);
    ['dragover', 'dragenter'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('bg-green-50'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function () { dz.classList.remove('bg-green-50'); }); });
    dz.addEventListener('drop', function (e) {
      e.preventDefault();
      if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; dz.submit(); }
    });
  }
})();
