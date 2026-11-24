/* CMS page builder: shows only the fields that apply to each section's type and keeps row titles in step with it. */
(function () {
  function apply(row) {
    var sel = row.querySelector('[data-block-type]');
    if (!sel) return;
    var type = sel.value;
    row.querySelectorAll('[data-show-for]').forEach(function (el) {
      if (el.closest('[data-row]') !== row) return;
      el.hidden = el.getAttribute('data-show-for').split(',').indexOf(type) === -1;
    });
    var label = row.querySelector('[data-row-title]');
    if (label) label.textContent = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text.split(' (')[0] : '';
  }
  function all() { document.querySelectorAll('[data-repeater] [data-row]').forEach(apply); }
  document.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('[data-block-type]')) apply(e.target.closest('[data-row]'));
  });
  // Rows added with "Add section" are created after load; watch for them.
  new MutationObserver(all).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', all);
  all();
})();
