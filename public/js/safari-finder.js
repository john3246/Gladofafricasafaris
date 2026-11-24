/* Safari price finder. The answer is built with textContent and createElement only, and every link is encoded. */
(function () {
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var el = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  function init(root) {
    var holder = root.querySelector('[data-finder-data]');
    if (!holder) return;
    var data;
    try { data = JSON.parse(holder.textContent); } catch (e) { return; }
    var form = root.querySelector('[data-finder-form]');
    var out = root.querySelector('[data-finder-result]');
    var monthSel = form.querySelector('[data-finder-month]');
    monthSel.value = String(new Date().getMonth() + 1);

    // best match: closest number of days, then the one that fits the season, then the lowest price
    function pick(type, days, month) {
      var list = data.tours.filter(function (t) { return t.y.indexOf(type) > -1; });
      var inCalving = month >= 1 && month <= 3;
      var inCrossings = month >= 7 && month <= 10;
      list.sort(function (a, b) {
        var sa = Math.abs(a.d - days) * 1000 - ((inCalving && a.c) || (inCrossings && a.m && !a.c) ? 500 : 0) + a.p / 100;
        var sb = Math.abs(b.d - days) * 1000 - ((inCalving && b.c) || (inCrossings && b.m && !b.c) ? 500 : 0) + b.p / 100;
        return sa - sb;
      });
      return list[0] || null;
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var month = parseInt(monthSel.value, 10) || 1;
      var type = form.querySelector('[data-finder-type]').value;
      var days = Math.min(14, Math.max(1, parseInt(form.querySelector('[data-finder-days]').value, 10) || 1));
      var people = Math.min(20, Math.max(1, parseInt(form.querySelector('[data-finder-travellers]').value, 10) || 1));
      var t = pick(type, days, month);
      out.textContent = '';
      out.classList.remove('hidden');
      if (!t) { out.appendChild(el('p', 'text-sm', 'We have no listed safari of this type yet. Ask for a free quote and we will plan one for you.')); return; }

      var total = t.p * people;
      var season = '';
      if (month >= 1 && month <= 3 && t.c) season = ' It runs in calving season, when thousands of calves are born around Ndutu.';
      else if (month >= 7 && month <= 10 && t.m) season = ' It follows the Great Migration to the Mara River crossings.';
      out.appendChild(el('p', 'text-xs font-bold uppercase tracking-wider text-forest-500', 'Closest match for ' + MONTHS[month - 1]));
      var h = el('h3', 'mt-1 text-xl font-bold');
      var link = el('a', 'hover:text-forest-500', t.t);
      if (/^[a-z0-9-]+$/.test(t.s)) link.setAttribute('href', '/tours/' + encodeURIComponent(t.s));
      h.appendChild(link);
      out.appendChild(h);
      out.appendChild(el('p', 'mt-1 text-sm text-ink/70', t.d + (t.d === 1 ? ' day' : ' days') + ', from ' + money(t.p) + ' per person.' + season));
      out.appendChild(el('p', 'mt-3 text-2xl font-bold text-forest-900', 'About ' + money(total) + ' for ' + people + (people === 1 ? ' traveller' : ' travellers')));
      out.appendChild(el('p', 'text-xs text-ink/55', 'An estimate from our published per-person prices in US dollars. Your free quote confirms the exact total for your dates and group.'));

      var actions = el('div', 'mt-4 flex flex-wrap gap-3');
      var msg = 'Hello Glad Of Africa, I would like a quote for "' + t.t + '" (' + t.d + ' days), ' + people + ' traveller' + (people === 1 ? '' : 's') + ', travelling in ' + MONTHS[month - 1] + '. Estimate ' + money(total) + '.';
      if (/^\d{6,15}$/.test(data.phone)) {
        var wa = el('a', 'btn-primary', 'Send this to WhatsApp');
        wa.setAttribute('href', 'https://wa.me/' + data.phone + '?text=' + encodeURIComponent(msg));
        wa.setAttribute('target', '_blank');
        wa.setAttribute('rel', 'noopener noreferrer');
        actions.appendChild(wa);
      }
      var more = el('a', 'btn-dark', 'See this safari');
      if (/^[a-z0-9-]+$/.test(t.s)) more.setAttribute('href', '/tours/' + encodeURIComponent(t.s));
      actions.appendChild(more);
      out.appendChild(actions);
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-safari-finder]'), init);
})();
