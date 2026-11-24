/* CMS rich-text editor (Quill): headings, lists, quotes, links, photos from the media library, video embeds, live word count. */
(function () {
  function init(box) {
    if (!window.Quill || box.dataset.ready) return;
    box.dataset.ready = '1';
    var input = box.querySelector('[data-rt-input]'), stats = box.querySelector('[data-rt-stats]'), jump = box.querySelector('[data-rt-link]');
    var quill = new Quill(box.querySelector('[data-rt-editor]'), {
      theme: 'snow', placeholder: 'Start writing your article here...',
      modules: { toolbar: { container: [
        [{ header: [2, 3, 4, false] }], ['bold', 'italic', 'underline', 'strike'], [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link', 'image', 'video'], [{ align: [] }], ['clean']],
      handlers: { image: pickPhoto } } },
    });
    quill.setContents(quill.clipboard.convert({ html: input.value }), 'silent');

    function pickPhoto() {
      var at = (quill.getSelection(true) || { index: quill.getLength() }).index;
      window.GladCms.pickImage(function (url) {
        var alt = window.prompt('Describe the photo in a few words (helps Google and screen readers):', '') || '';
        quill.insertEmbed(at, 'image', url, 'user');
        quill.formatText(at, 1, 'alt', alt, 'user');
        quill.setSelection(at + 1, 0, 'silent');
      });
    }

    function sync() {
      var empty = quill.getText().trim() === '' && !quill.root.querySelector('img,iframe');
      input.value = empty ? '' : quill.root.innerHTML;
      var text = quill.getText().trim(), words = text ? text.split(/\s+/).length : 0;
      var h = quill.root.querySelectorAll('h2,h3').length, img = quill.root.querySelectorAll('img').length;
      if (stats) stats.textContent = words + ' words · about ' + Math.max(1, Math.round(words / 220)) + ' min read · ' + h + ' headings · ' + img + ' photos';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    quill.on('text-change', function (d, o, source) { if (source !== 'silent') sync(); });
    sync();

    // "Link to..." menu: turns the selected text (or inserts the page title) into a link to your own content.
    var links = []; try { links = JSON.parse(box.dataset.links || '[]'); } catch (e) { links = []; }
    if (jump) {
      jump.innerHTML = '<option value="">Link to a tour, destination or post...</option>' +
        links.map(function (l) { return '<option value="' + l.href + '">' + l.group + ': ' + l.label.replace(/</g, '&lt;') + '</option>'; }).join('');
      jump.addEventListener('change', function () {
        if (!jump.value) return;
        var r = quill.getSelection(true) || { index: quill.getLength() - 1, length: 0 };
        if (r.length) quill.formatText(r.index, r.length, 'link', jump.value, 'user');
        else { var label = jump.options[jump.selectedIndex].text.replace(/^[^:]+: /, ''); quill.insertText(r.index, label, 'link', jump.value, 'user'); }
        jump.value = '';
      });
    }
  }
  function all() { document.querySelectorAll('[data-richtext]').forEach(init); }
  document.addEventListener('DOMContentLoaded', all);
  window.addEventListener('load', all);
  all();
})();
