// Region filter for the accommodations page. Every card is in the page already, so search engines see them all.
(function () {
  var root = document.querySelector('[data-lodges]');
  if (!root) return;
  var chips = [].slice.call(root.querySelectorAll('[data-chip]'));
  var cards = [].slice.call(root.querySelectorAll('[data-region]'));
  var empty = root.querySelector('[data-empty]');
  function show(id) {
    var shown = 0;
    cards.forEach(function (c) { var on = id === 'all' || c.getAttribute('data-region') === id; c.hidden = !on; if (on) shown += 1; });
    chips.forEach(function (b) { var on = b.getAttribute('data-chip') === id; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    if (empty) empty.classList.toggle('hidden', shown > 0);
  }
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-chip');
      show(id);
      try { history.replaceState(null, '', id === 'all' ? location.pathname : '#' + id); } catch (e) { /* ignore */ }
    });
  });
  var start = (location.hash || '').replace('#', '');
  if (start && chips.some(function (b) { return b.getAttribute('data-chip') === start; })) show(start);
})();
