// Keeps parts of the CMS up to date without reloading the page. An element with data-live="<url>" gets its content replaced
// by the HTML the url returns, every data-interval milliseconds (default 10 s) while the tab is visible.
// A data-alert value that goes up (new inquiries) shows a short notice.
(function () {
  var blocks = [].slice.call(document.querySelectorAll('[data-live]'));
  if (!blocks.length) return;

  function toast(text) {
    var t = document.createElement('div');
    t.setAttribute('role', 'status');
    t.className = 'fixed bottom-5 right-5 z-50 rounded-lg bg-forest-900 px-4 py-3 text-sm font-semibold text-white shadow-xl';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 6000);
  }

  function alertValue(el) {
    var a = el.querySelector('[data-alert]');
    return a ? Number(a.getAttribute('data-alert')) : null;
  }

  blocks.forEach(function (el) {
    var url = el.getAttribute('data-live');
    var every = Number(el.getAttribute('data-interval')) || 10000;
    var last = el.innerHTML;
    var seen = alertValue(el);

    function tick() {
      if (document.hidden) return;
      fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'fetch' }, cache: 'no-store' })
        .then(function (r) {
          if (r.status === 401 || r.redirected) { location.reload(); return null; }
          return r.ok ? r.text() : null;
        })
        .then(function (html) {
          if (!html || html === last) return;
          last = html;
          el.innerHTML = html;
          var now = alertValue(el);
          if (seen !== null && now !== null && now > seen) toast('New quote request received');
          seen = now;
        })
        .catch(function () { /* offline: try again next time */ });
    }

    setInterval(tick, every);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  });
})();
