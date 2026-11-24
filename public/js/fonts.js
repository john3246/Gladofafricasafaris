// Loads the Google Fonts stylesheet without blocking the first paint: the <link> starts as media="print"
// (the browser fetches it at low priority) and is switched on once it has loaded. A <noscript> link covers no-JS visitors.
(function () {
  var link = document.querySelector('link[data-async-font]');
  if (!link) return;
  function on() { link.media = 'all'; }
  if (link.sheet) on(); else link.addEventListener('load', on);
})();
