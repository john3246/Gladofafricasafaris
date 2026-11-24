/* Quote form: a two-month calendar for arrival/departure, month buttons for guests without dates, and +/- steppers.
   Without JavaScript the plain date fields and number boxes still work and submit the same field names. */
(function () {
  var form = document.querySelector('[data-quote-form]');
  if (!form) return;
  var q = function (s) { return form.querySelector(s); };

  /* ---- steppers ---- */
  Array.prototype.forEach.call(form.querySelectorAll('[data-stepper]'), function (box) {
    var input = box.querySelector('input');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-step]'); if (!b) return;
      var v = (Number(input.value) || 0) + Number(b.getAttribute('data-step'));
      input.value = Math.min(Number(input.max), Math.max(Number(input.min), v));
    });
  });

  /* ---- dates ---- */
  var native = q('[data-native]'), picker = q('[data-picker]'), range = q('[data-range]'), hint = q('[data-range-hint]');
  var start = form.elements.startDate, end = form.elements.endDate, tour = q('[data-tour-select]');
  var months = q('[data-months]'), noDates = q('[data-no-dates]');
  var radios = Array.prototype.slice.call(form.querySelectorAll('input[name="travelMonth"]'));
  var fp = null, busy = false;

  var tourDays = function () { var o = tour && tour.options[tour.selectedIndex]; return o ? Number(o.getAttribute('data-days')) || 0 : 0; };
  var iso = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  var plus = function (d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
  var nice = function (d) { return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); };
  var nights = function (a, b) { return Math.round((b - a) / 86400000); };

  function message(dates) {
    var n = tourDays();
    if (!hint) return;
    if (dates.length === 2) hint.textContent = nice(dates[0]) + ' to ' + nice(dates[1]) + ' · ' + (nights(dates[0], dates[1]) + 1) + ' days' + (n > 1 && nights(dates[0], dates[1]) + 1 !== n ? ' (the safari is ' + n + ' days)' : '');
    else hint.textContent = n > 1 ? 'Pick your arrival day: we add the ' + n + ' days of this safari for you.' : 'Pick the day you arrive, then the day you leave.';
  }
  function commit(dates) {
    start.value = dates[0] ? iso(dates[0]) : '';
    end.value = dates[1] ? iso(dates[1]) : '';
    if (dates[0]) { radios.forEach(function (r) { r.checked = false; }); }
    message(dates);
  }

  if (window.flatpickr && range) {
    native.hidden = true; picker.hidden = false;
    var initial = [start.value, end.value].filter(Boolean);
    fp = window.flatpickr(range, {
      mode: 'range', minDate: 'today', dateFormat: 'Y-m-d', showMonths: window.innerWidth >= 768 ? 2 : 1, disableMobile: true,
      altInput: true, altFormat: 'D, j M Y', altInputClass: 'input cursor-pointer pr-10', allowInput: false,
      locale: { firstDayOfWeek: 1, rangeSeparator: '  →  ' }, defaultDate: initial,
      onChange: function (dates, str, inst) {
        if (busy) return;
        var n = tourDays();
        if (dates.length === 1 && n > 1) { busy = true; inst.setDate([dates[0], plus(dates[0], n - 1)], true); busy = false; dates = inst.selectedDates; }
        commit(dates);
      },
    });
    if (initial.length === 2) message(fp.selectedDates);
  }

  if (tour) tour.addEventListener('change', function () {
    var n = tourDays();
    if (fp && fp.selectedDates[0] && n > 1) { busy = true; fp.setDate([fp.selectedDates[0], plus(fp.selectedDates[0], n - 1)], true); busy = false; commit(fp.selectedDates); }
    else if (!fp && start.value && n > 1) { var d = new Date(start.value + 'T00:00:00'); end.value = iso(plus(d, n - 1)); }
    else message(fp ? fp.selectedDates : []);
  });
  if (start && !fp) start.addEventListener('input', function () { end.min = start.value; var n = tourDays(); if (n > 1 && start.value) end.value = iso(plus(new Date(start.value + 'T00:00:00'), n - 1)); });

  /* ---- "I don't have exact dates yet": month buttons replace the dates ---- */
  if (noDates) noDates.addEventListener('click', function () {
    var open = months.classList.toggle('hidden') === false;
    noDates.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  radios.forEach(function (r) {
    r.addEventListener('change', function () { if (fp) fp.clear(); start.value = ''; end.value = ''; message([]); });
  });
  message(fp ? fp.selectedDates : []);
})();
