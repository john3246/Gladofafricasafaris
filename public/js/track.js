// First-party click counters for the CMS analytics: which contact buttons visitors use. Sends only the button name.
(function () {
  var sent = {};
  function send(name) {
    if (sent[name] > 2) return; // a visitor cannot inflate one counter
    sent[name] = (sent[name] || 0) + 1;
    try {
      var body = new URLSearchParams({ e: name });
      if (navigator.sendBeacon) navigator.sendBeacon('/t/e', body); else fetch('/t/e', { method: 'POST', body: body, keepalive: true });
    } catch (e) { /* tracking must never get in the way */ }
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)/i.test(h)) send('whatsapp');
    else if (/^tel:/i.test(h)) send('phone');
    else if (/^mailto:/i.test(h)) send('email');
  });
  document.addEventListener('focusin', function (ev) {
    if (ev.target.form && ev.target.form.matches && ev.target.form.matches('form[data-quote-form]')) send('quote-start');
  });
})();
