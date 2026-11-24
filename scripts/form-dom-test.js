/**
 * Runs the booking form's real scripts (calendar + quote-form.js) inside a simulated browser (jsdom) against a running
 * server and checks what the guest's choices do. Run against a throwaway server:
 *   TEST_PORT=3079 node scripts/form-dom-test.js
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const B = `http://localhost:${process.env.TEST_PORT || 3000}`;
let fails = 0;
const ok = (name, cond, info = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : info}`); if (!cond) fails += 1; };
const root = path.join(__dirname, '..', 'public');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };

async function open(urlPath, width = 1280) {
  const html = await (await fetch(B + urlPath)).text();
  const dom = new JSDOM(html.replace(/<script[^>]*src=[^>]*><\/script>/g, ''), { runScripts: 'outside-only', pretendToBeVisual: true, url: B + urlPath });
  const { window } = dom;
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  window.eval(read('vendor/flatpickr/flatpickr.min.js'));
  window.eval(read('js/quote-form.js'));
  return window;
}
const fire = (window, el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

/** The safari style filter on /tanzania-safaris, run with the real board-filter.js. */
async function filterChecks() {
  const open2 = async (p) => {
    const html = await (await fetch(B + p)).text();
    const dom = new JSDOM(html.replace(/<script[^>]*src=[^>]*><\/script>/g, ''), { runScripts: 'outside-only', pretendToBeVisual: true, url: B + p });
    dom.window.eval(read('js/board-filter.js'));
    return dom.window;
  };
  const visible = (win) => [...win.document.querySelectorAll('[data-tour-card]')].filter((c) => !c.hidden);
  const box = (win, name) => [...win.document.querySelectorAll('[data-style-filter]')].find((b) => b.value === name);
  const tick = (win, name, on = true) => { const b = box(win, name); b.checked = on; b.dispatchEvent(new win.Event('change', { bubbles: true })); };

  let win = await open2('/tanzania-safaris');
  const all = visible(win).length;
  ok('all safaris show at first and the counter agrees', all >= 40 && Number(win.document.querySelector('[data-count]').textContent) === all, String(all));
  const luxury = [...win.document.querySelectorAll('[data-tour-card]')].filter((c) => c.dataset.styles.split('|').includes('Luxury')).length;
  tick(win, 'Luxury');
  ok('ticking a style shows only safaris with that style', visible(win).length === luxury && luxury > 0 && luxury < all, `${visible(win).length} vs ${luxury}`);
  const mig = [...win.document.querySelectorAll('[data-tour-card]')].filter((c) => c.dataset.styles.split('|').some((x) => ['Luxury', 'Great Migration'].includes(x))).length;
  tick(win, 'Great Migration');
  ok('several styles mean "any of them"', visible(win).length === mig && mig > luxury, `visible ${visible(win).length}, expected ${mig}, luxury ${luxury}, checked ${[...win.document.querySelectorAll('[data-style-filter]')].filter((b) => b.checked).map((b) => b.value).join('+')}`);
  ok('clear button and active badge appear', win.document.querySelector('aside [data-clear-filters]').hidden === false && win.document.querySelector('[data-active-count]').textContent === '2');
  win.document.querySelector('aside [data-clear-filters]').click();
  ok('clearing restores every safari', visible(win).length === all && !box(win, 'Luxury').checked);

  tick(win, 'Kilimanjaro climb');
  const price = win.document.querySelector('[data-max-price]'); price.value = '250'; price.dispatchEvent(new win.Event('input', { bubbles: true }));
  ok('an impossible combination shows the empty message', visible(win).length === 0 && win.document.querySelector('[data-empty]').hidden === false);
  win.document.querySelector('[data-empty] [data-clear-filters]').click();
  ok('"Clear the filters" in the empty message works', visible(win).length === all && win.document.querySelector('[data-empty]').hidden === true);

  win = await open2('/tanzania-safaris?style=Great%20Migration');
  ok('a shared link preselects the style', box(win, 'Great Migration').checked && visible(win).length > 0 && visible(win).length < all && visible(win).every((c) => c.dataset.styles.includes('Great Migration')));
  const q = new win.URL(win.location.href).searchParams.getAll('style');
  ok('the chosen style stays in the address', q.length === 1 && q[0] === 'Great Migration');
}

(async () => {
  // ---- form opened from a tour page
  let w = await open('/book/8-day-great-migration-moments');
  let f = w.document.querySelector('[data-quote-form]');
  ok('calendar replaces the plain date fields when scripts run', w.document.querySelector('[data-native]').hidden === true && w.document.querySelector('[data-picker]').hidden === false);
  ok('calendar was created, two months on a wide screen', !!w.document.querySelector('.flatpickr-calendar') === true || !!w.document.querySelector('input.flatpickr-input'));
  const fp = w.document.querySelector('[data-range]')._flatpickr;
  ok('flatpickr is attached with range mode, min today', fp && fp.config.mode === 'range' && fp.config.showMonths === 2 && fp.config.minDate && fp.config.disableMobile === true);

  const start = addDays(new Date(), 60);
  fp.setDate(w.Array.of(iso(start)), true, 'Y-m-d'); // the guest clicks one day (arrays must come from the page's own realm)
  const end = addDays(start, 7);
  ok('choosing the arrival day fills the departure from the tour length (8 days)', f.elements.startDate.value === iso(start) && f.elements.endDate.value === iso(end), `${f.elements.startDate.value} ${f.elements.endDate.value}`);
  ok('hint explains the dates', /8 days/.test(w.document.querySelector('[data-range-hint]').textContent), w.document.querySelector('[data-range-hint]').textContent);

  // the guest picks a different range by hand
  const end2 = addDays(start, 11);
  fp.setDate(w.Array.of(iso(start), iso(end2)), true, 'Y-m-d');
  ok('a hand-picked range is kept', f.elements.endDate.value === iso(end2));
  ok('hint warns when the range differs from the safari length', /the safari is 8 days/.test(w.document.querySelector('[data-range-hint]').textContent));

  // tour change recomputes the end
  const select = w.document.querySelector('[data-tour-select]');
  const other = [...select.options].find((o) => o.getAttribute('data-days') === '5');
  select.value = other.value; fire(w, select, 'change');
  ok('changing the safari recomputes the departure day', f.elements.endDate.value === iso(addDays(start, 4)), f.elements.endDate.value);

  // month buttons replace the dates
  const radios = [...f.querySelectorAll('input[name="travelMonth"]')];
  ok('there are 12 month buttons, the months are in the future', radios.length === 12 && new Date(`1 ${radios[0].value}`) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  radios[3].checked = true; fire(w, radios[3], 'change');
  ok('choosing a month clears the dates', f.elements.startDate.value === '' && f.elements.endDate.value === '' && fp.selectedDates.length === 0);
  fp.setDate(w.Array.of(iso(addDays(new Date(), 30))), true, 'Y-m-d');
  ok('choosing dates un-selects the month', radios.every((r) => !r.checked));

  // "no exact dates" toggle
  const toggle = w.document.querySelector('[data-no-dates]');
  const months = w.document.querySelector('[data-months]');
  ok('month buttons start hidden', months.classList.contains('hidden') && toggle.getAttribute('aria-expanded') === 'false');
  toggle.click();
  ok('"I do not have exact dates yet" reveals them', !months.classList.contains('hidden') && toggle.getAttribute('aria-expanded') === 'true');

  // steppers
  const adults = f.elements.adults;
  const stepper = adults.closest('[data-stepper]');
  const plus = stepper.querySelector('[data-step="1"]'); const minus = stepper.querySelector('[data-step="-1"]');
  const before = Number(adults.value);
  plus.click(); plus.click();
  ok('plus adds adults', Number(adults.value) === before + 2);
  for (let i = 0; i < 10; i += 1) minus.click();
  ok('minus stops at the minimum of 1 adult', Number(adults.value) === 1);
  const kids = f.elements.children; const kplus = kids.closest('[data-stepper]').querySelector('[data-step="1"]'); const kminus = kids.closest('[data-stepper]').querySelector('[data-step="-1"]');
  kminus.click();
  ok('children stop at 0', Number(kids.value) === 0);
  kplus.click();
  ok('children can be added', Number(kids.value) === 1);

  // what would be submitted
  const data = new w.FormData(f);
  ok('the submitted fields carry the chosen values', data.get('tourSlug') === other.value && data.get('adults') === '1' && data.get('children') === '1' && /^\d{4}-\d{2}-\d{2}$/.test(String(data.get('startDate'))));
  ok('no safari style field is submitted', !data.has('styles'));

  // ---- phone width: one month
  w = await open('/get-a-quote', 375);
  const fpPhone = w.document.querySelector('[data-range]')._flatpickr;
  ok('phones get a single-month calendar', fpPhone && fpPhone.config.showMonths === 1);
  ok('general form starts with no safari selected', w.document.querySelector('[data-tour-select]').value === '');

  // ---- form re-shown after an error keeps the dates and month
  w = await open('/book/8-day-great-migration-moments');
  ok('without a start date the hint explains the next step', /arrival day/.test(w.document.querySelector('[data-range-hint]').textContent));

  await filterChecks();

  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
