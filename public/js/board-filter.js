// Client-side sort/filter for the safari board. The server renders every card so crawlers see all of them.
// Safari styles are "any of the ticked ones"; links like /tanzania-safaris?style=Honeymoon%20%26%20romance preselect a style.
(function () {
  var board = document.querySelector('[data-board]');
  if (!board) return;
  var grid = board.querySelector('[data-grid]');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-tour-card]'));
  var count = board.querySelector('[data-count]');
  var sort = board.querySelector('[data-sort]');
  var maxPrice = board.querySelector('[data-max-price]');
  var priceLabel = board.querySelector('[data-price-label]');
  var length = board.querySelector('[data-length]');
  var styleBoxes = Array.prototype.slice.call(board.querySelectorAll('[data-style-filter]'));
  var clearBtns = board.querySelectorAll('[data-clear-filters]');
  var empty = board.querySelector('[data-empty]');
  var badge = board.querySelector('[data-active-count]');
  var panel = board.querySelector('[data-filter-panel]');

  // preselect styles from the address (?style=A&style=B)
  try {
    var wanted = new URLSearchParams(location.search).getAll('style');
    styleBoxes.forEach(function (b) { b.checked = wanted.indexOf(b.value) !== -1; });
  } catch (e) { /* old browser: no preselection */ }

  // on phones the filters start folded away, on desktop they are always open
  function fold() { if (panel) panel.open = window.innerWidth >= 1024; }
  fold();
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024) panel.open = true; });

  function apply() {
    var max = Number(maxPrice.value);
    var minDays = Number(length.value);
    var styles = styleBoxes.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
    priceLabel.textContent = max >= Number(maxPrice.max) ? 'Any' : '$' + max.toLocaleString('en-US');
    var shown = cards.filter(function (c) {
      var own = (c.dataset.styles || '').split('|');
      var okStyle = !styles.length || styles.some(function (s) { return own.indexOf(s) !== -1; });
      var okPrice = max >= Number(maxPrice.max) || Number(c.dataset.price) <= max; // slider at the end means "any price"
      var ok = okPrice && Number(c.dataset.days) >= minDays && okStyle;
      c.hidden = !ok;
      return ok;
    });
    var by = {
      popular: null,
      'price-asc': function (a, b) { return a.dataset.price - b.dataset.price; },
      'price-desc': function (a, b) { return b.dataset.price - a.dataset.price; },
      'days-asc': function (a, b) { return a.dataset.days - b.dataset.days; },
      'days-desc': function (a, b) { return b.dataset.days - a.dataset.days; },
    }[sort.value];
    var ordered = by ? shown.slice().sort(by) : cards.filter(function (c) { return !c.hidden; });
    ordered.forEach(function (c) { grid.appendChild(c); });
    count.textContent = shown.length;
    if (empty) empty.hidden = shown.length > 0;
    var active = styles.length + (max < Number(maxPrice.max) ? 1 : 0) + (minDays > 1 ? 1 : 0);
    Array.prototype.forEach.call(clearBtns, function (b) { if (b.closest('[data-empty]') === null) b.hidden = active === 0; });
    if (badge) { badge.hidden = active === 0; badge.textContent = active; }
    try { // keep the chosen styles in the address so the page can be shared
      var url = new URL(location.href); url.searchParams.delete('style');
      styles.forEach(function (s) { url.searchParams.append('style', s); });
      history.replaceState(null, '', url.pathname + url.search);
    } catch (e) { /* ignore */ }
  }

  [sort, maxPrice, length].forEach(function (el) { el.addEventListener('input', apply); });
  styleBoxes.forEach(function (c) { c.addEventListener('change', apply); });
  Array.prototype.forEach.call(clearBtns, function (b) {
    b.addEventListener('click', function () {
      styleBoxes.forEach(function (c) { c.checked = false; });
      maxPrice.value = maxPrice.max; length.value = '1';
      apply();
    });
  });
  apply();
})();
