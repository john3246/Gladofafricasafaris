/* CMS SEO assistant: Google preview and a live checklist for an article (focus keyword, title, description, content, photo). */
(function () {
  var panel = document.querySelector('[data-seo-panel]');
  if (!panel) return;
  var f = panel.closest('form');
  var val = function (n) { var e = f.elements[n]; return e ? String(e.value || '').trim() : ''; };
  var strip = function (h) { var d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function render() {
    var title = val('metaTitle') || val('title'), desc = val('metaDescription') || val('excerpt'), key = val('focusKeyword').toLowerCase();
    var html = val('content'), text = strip(html), words = text ? text.split(/\s+/).length : 0;
    var first = strip((html.match(/<p>[\s\S]*?<\/p>/) || [''])[0]).toLowerCase();
    var heads = (html.match(/<h[23][^>]*>[\s\S]*?<\/h[23]>/g) || []).map(strip).join(' ').toLowerCase();
    var has = function (s) { return !!key && s.toLowerCase().indexOf(key) !== -1; };
    var internal = /href="(\/|https?:\/\/[^"]*gladofafricasafari)/.test(html);
    var checks = [
      [title.length >= 30 && title.length <= 60, 'SEO title is 30-60 characters (' + title.length + ')'],
      [desc.length >= 110 && desc.length <= 158, 'Description is 110-158 characters (' + desc.length + ')'],
      [words >= 600, 'Article has 600+ words (' + words + ')'],
      [/<h[23]/.test(html), 'Uses headings to structure the article'],
      [!!val('image'), 'Has a cover photo'],
      [!!val('imageAlt'), 'Cover photo has a description (alt text)'],
      [internal, 'Links to another page on your site'],
    ];
    if (key) checks.push([has(title), 'Focus keyword is in the title'], [has(desc), 'Focus keyword is in the description'], [has(first), 'Focus keyword is in the first paragraph'], [has(heads), 'Focus keyword is in a heading'], [has(val('slug').replace(/-/g, ' ')), 'Focus keyword is in the web address']);
    else checks.unshift([false, 'Set a focus keyword (the phrase people search for)']);
    var score = Math.round(checks.filter(function (c) { return c[0]; }).length / checks.length * 100);
    var colour = score >= 80 ? '#2f8f3a' : score >= 50 ? '#d9a441' : '#c0392b';
    panel.innerHTML =
      '<div class="rounded-lg border border-ink/10 bg-white p-3"><p style="color:#1a0dab;font-size:16px;line-height:1.3">' + esc(title.slice(0, 62) || 'Your SEO title') + '</p>' +
      '<p style="color:#006621;font-size:12px">' + esc((panel.dataset.baseUrl || '').replace(/^https?:\/\//, '') + '/blog/' + (val('slug') || 'your-post')) + '</p>' +
      '<p style="color:#545454;font-size:12.5px">' + esc(desc.slice(0, 160) || 'Your description appears here.') + '</p></div>' +
      '<p class="mt-3 flex items-center justify-between text-sm font-bold">SEO score <span style="color:' + colour + '">' + score + '%</span></p>' +
      '<div class="mt-1 h-1.5 rounded bg-ink/10"><div style="width:' + score + '%;background:' + colour + '" class="h-1.5 rounded"></div></div>' +
      '<ul class="mt-3 space-y-1 text-[12.5px]">' + checks.map(function (c) { return '<li style="color:' + (c[0] ? '#2f8f3a' : '#8a8a8a') + '">' + (c[0] ? '&#10003; ' : '&#9675; ') + esc(c[1]) + '</li>'; }).join('') + '</ul>';
  }
  var t; f.addEventListener('input', function () { clearTimeout(t); t = setTimeout(render, 250); });
  document.addEventListener('DOMContentLoaded', render);
  render();
})();
