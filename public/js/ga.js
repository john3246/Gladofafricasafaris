// Google Analytics (gtag) bootstrap. The measurement id comes from CMS > Site Settings via a data attribute,
// which keeps inline scripts out of the page (strict Content-Security-Policy).
// Google's own script is fetched only after the visitor first interacts or the browser is idle, so it never
// competes with the page's content for bandwidth (better Core Web Vitals); the first page view is still counted.
(function () {
  var el = document.currentScript;
  var id = el && el.getAttribute('data-id');
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true });
  var loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
  }
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, load, { once: true, passive: true }); });
  if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 5000 }); else setTimeout(load, 4000);
})();
