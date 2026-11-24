const data = require('../data/insurance.data');

/** The Italian, French and German wording of the travel insurance page, paired sentence by sentence with the English text. */
const rows = [];
const add = (get) => { const en = get(data.en); if (en) rows.push([en, get(data.it), get(data.fr), get(data.de)]); };
add((d) => d.h1); add((d) => d.sub); add((d) => d.intro);
data.en.sections.forEach((s, i) => {
  add((d) => d.sections[i].h);
  (s.p || []).forEach((_, j) => add((d) => d.sections[i].p[j]));
  (s.ul || []).forEach((_, j) => add((d) => d.sections[i].ul[j]));
});
data.en.faqs.forEach((_, i) => { add((d) => d.faqs[i].q); add((d) => d.faqs[i].a); });
rows.push(['Questions about travel insurance', "Domande sull'assicurazione di viaggio", "Questions sur l'assurance voyage", 'Fragen zur Reiseversicherung']);
module.exports = rows;
