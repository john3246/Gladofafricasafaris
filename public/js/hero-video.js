// Home hero background video. The photo (the video's first frame) is in the page already, so the page looks right at once;
// the video is fetched afterwards and fades in over it. It is skipped for visitors who prefer reduced motion, have
// Data Saver on or a very slow connection, and when the tab is hidden it pauses to save battery.
(function () {
  var v = document.querySelector('[data-hero-video]');
  if (!v) return;
  var conn = navigator.connection || {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')) return;

  var small = window.matchMedia('(max-width: 767px)').matches;
  v.src = (small && v.getAttribute('data-src-small')) || v.getAttribute('data-src');
  v.muted = true;

  v.addEventListener('playing', function () { v.classList.remove('opacity-0'); v.classList.add('opacity-100'); });
  v.addEventListener('error', function () { v.remove(); }); // a missing file just leaves the photo

  function play() { var p = v.play(); if (p && p.catch) p.catch(function () { /* autoplay refused: the photo stays */ }); }
  function start() { play(); }
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 1500 }); else setTimeout(start, 300);

  document.addEventListener('visibilitychange', function () { if (document.hidden) v.pause(); else play(); });
})();
