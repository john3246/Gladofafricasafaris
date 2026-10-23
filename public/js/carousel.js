// Horizontal scroll-snap carousel with prev/next buttons ([data-carousel] > [data-track], [data-prev], [data-next]).
document.querySelectorAll('[data-carousel]').forEach(function (root) {
  var track = root.querySelector('[data-track]');
  if (!track) return;
  var step = function (dir) {
    var slide = track.querySelector('[data-slide]');
    var w = slide ? slide.getBoundingClientRect().width + 20 : 300;
    track.scrollBy({ left: dir * w, behavior: 'smooth' });
  };
  var prev = root.querySelector('[data-prev]');
  var next = root.querySelector('[data-next]');
  if (prev) prev.addEventListener('click', function () { step(-1); });
  if (next) next.addEventListener('click', function () { step(1); });
});
