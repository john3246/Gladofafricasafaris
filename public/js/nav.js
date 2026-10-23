(function () {
  var btn = document.getElementById('nav-toggle');
  var menu = document.getElementById('mobile-nav');
  if (!btn || !menu) return;
  btn.addEventListener('click', function () {
    var open = menu.classList.toggle('hidden') === false;
    btn.setAttribute('aria-expanded', String(open));
  });
})();
