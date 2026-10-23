// Hide broken images so the brand gradient behind them shows (CSP blocks inline onerror).
function hideBroken(img) { img.style.display = 'none'; }

document.addEventListener('error', function (e) {
  if (e.target && e.target.tagName === 'IMG') hideBroken(e.target);
}, true);

// Images that already failed before this deferred script ran.
document.querySelectorAll('img').forEach(function (img) {
  if (img.complete && img.naturalWidth === 0) hideBroken(img);
});
