// Client-side sort/filter for the safari board (GM-style). Server renders every card so crawlers see all of them.
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
  var tiers = board.querySelectorAll('[data-tier-filter]');

  function apply() {
    var max = Number(maxPrice.value);
    var minDays = Number(length.value);
    var active = Array.prototype.filter.call(tiers, function (c) { return c.checked; }).map(function (c) { return c.value; });
    priceLabel.textContent = max >= Number(maxPrice.max) ? 'Any' : '$' + max.toLocaleString('en-US');
    var shown = cards.filter(function (c) {
      var ok = Number(c.dataset.price) <= max && Number(c.dataset.days) >= minDays && (!active.length || active.indexOf(c.dataset.tier) !== -1);
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
  }

  [sort, maxPrice, length].forEach(function (el) { el.addEventListener('input', apply); });
  Array.prototype.forEach.call(tiers, function (c) { c.addEventListener('change', apply); });
  apply();
})();
