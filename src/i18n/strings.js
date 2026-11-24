// Hand-written rows [English, Italian, French, German] and regular-expression PATTERNS.
// In a pattern's replacement: $1 is the matched text as it is, {1} the matched text translated (recursively).
const STRINGS = [
  ['1 Day', '1 giorno', '1 jour', '1 Tag'],
  ['Arusha NP', 'Parco di Arusha', 'Parc d\'Arusha', 'Arusha-Nationalpark'],
  ['Serengeti', 'Serengeti', 'Serengeti', 'Serengeti'],
  ['Tarangire', 'Tarangire', 'Tarangire', 'Tarangire'],
  ['Ngorongoro', 'Ngorongoro', 'Ngorongoro', 'Ngorongoro'],
  ['Kilimanjaro', 'Kilimangiaro', 'Kilimandjaro', 'Kilimandscharo'],
  ['Mount Meru', 'Monte Meru', 'Mont Meru', 'Mount Meru'],
  ['Ol Donyo Lengai', 'Ol Donyo Lengai', 'Ol Donyo Lengai', 'Ol Donyo Lengai'],
  ['Lake Manyara', 'Lago Manyara', 'Lac Manyara', 'Manyarasee'],
  // form messages and the thank-you page
  ['Required', 'Obbligatorio', 'Obligatoire', 'Pflichtfeld'],
  ['required', 'obbligatorio', 'obligatoire', 'Pflichtfeld'],
  ['Enter a valid email', "Inserisci un'e-mail valida", 'Saisissez une adresse e-mail valide', 'Geben Sie eine gültige E-Mail-Adresse ein'],
  ['Please enter your name', 'Inserisci il tuo nome', 'Veuillez saisir votre nom', 'Bitte geben Sie Ihren Namen ein'],
  ['Choose your travel dates, or a month if you do not have dates yet', 'Scegli le date di viaggio, o un mese se non hai ancora le date', "Choisissez vos dates de voyage, ou un mois si vous n'avez pas encore de dates", 'Wählen Sie Ihre Reisedaten oder einen Monat, wenn Sie noch keine Daten haben'],
  ['The start date is in the past', 'La data di inizio è nel passato', 'La date de début est dans le passé', 'Das Anfangsdatum liegt in der Vergangenheit'],
  ['Add the start date too', 'Aggiungi anche la data di inizio', 'Ajoutez aussi la date de début', 'Geben Sie auch das Anfangsdatum an'],
  ['The end date is before the start date', 'La data di fine è precedente alla data di inizio', 'La date de fin est antérieure à la date de début', 'Das Enddatum liegt vor dem Anfangsdatum'],
  ['Request received', 'Richiesta ricevuta', 'Demande reçue', 'Anfrage erhalten'],
  ['Thank you. A member of our Arusha team will reply within 24 hours with your tailor-made quote.', 'Grazie. Un membro del nostro team di Arusha ti risponderà entro 24 ore con il tuo preventivo su misura.', 'Merci. Un membre de notre équipe d\'Arusha vous répondra sous 24 heures avec votre devis sur mesure.', 'Vielen Dank. Ein Mitglied unseres Teams in Arusha antwortet Ihnen innerhalb von 24 Stunden mit Ihrem maßgeschneiderten Angebot.'],
  ['Tour', 'Tour', 'Circuit', 'Tour'],
  ['Dates', 'Date', 'Dates', 'Reisedaten'],
  ['Travellers', 'Viaggiatori', 'Voyageurs', 'Reisende'],
  ['Travel insurance is mandatory for every guest.', "L'assicurazione di viaggio è obbligatoria per ogni ospite.", "L'assurance voyage est obligatoire pour chaque client.", 'Eine Reiseversicherung ist für jeden Gast Pflicht.'],
  ['Read the requirements', 'Leggi i requisiti', 'Lisez les exigences', 'Anforderungen lesen'],
  ['Tailor-made safari', 'Safari su misura', 'Safari sur mesure', 'Maßgeschneiderte Safari'],
  ['Browse safaris while you wait', 'Sfoglia i safari mentre aspetti', 'Parcourez les safaris en attendant', 'Stöbern Sie in den Safaris, während Sie warten'],
];

const PATTERNS = [
  ['Explore the (.+) itinerary', 'Scopri l\'itinerario: {1}', 'Découvrez l\'itinéraire : {1}', 'Reiseverlauf ansehen: {1}'],
  ['Explore (.+) and its safaris →', 'Scopri {1} e i suoi safari →', 'Découvrir {1} et ses safaris →', '{1} und die Safaris dorthin entdecken →'],
  ['From USD ([\\d,]+) / person', 'Da USD $1 / persona', 'À partir de $1 USD / personne', 'Ab $1 USD / Person'],
  ['(\\d+) Days? / (\\d+) Nights? · From \\$([\\d,]+) pp', '$1 giorni / $2 notti · Da $$3 a persona', '$1 jours / $2 nuits · À partir de $$3 par personne', '$1 Tage / $2 Nächte · Ab $$3 pro Person'],
  ['(.+) \\(1 day\\)', '{1} (1 giorno)', '{1} (1 jour)', '{1} (1 Tag)'],
  ['(.+) \\((\\d+) days\\)', '{1} ($2 giorni)', '{1} ($2 jours)', '{1} ($2 Tage)'],
  ['(\\d+) Days', '$1 giorni', '$1 jours', '$1 Tage'],
  ['(\\d+)\\+ days', '$1+ giorni', '$1+ jours', '$1+ Tage'],
  ['(.+) · (.+)', '{1} · {2}', '{1} · {2}', '{1} · {2}'],
];

const facts = require('./strings.facts');
module.exports = { STRINGS: [...STRINGS, ...facts.ROWS], PATTERNS: [...PATTERNS, ...facts.PATTERNS] };
