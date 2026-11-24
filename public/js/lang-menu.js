/* Closes the language dropdown when you click elsewhere or press Escape. The menu itself works without this script. */
(function () {
  var menu = document.querySelector('details[data-lang-switcher]');
  if (!menu) return;
  document.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.open) { menu.open = false; var s = menu.querySelector('summary'); if (s) s.focus(); } });
})();
