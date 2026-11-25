// Spanish for the words around every page (menus, footer, common buttons): [English, Spanish].
// Everything else is translated by the CMS translator (CMS > Translations) once an API key is added.
const ROWS = [
  ['Home', 'Inicio'], ['Tours', 'Tours'], ['Offers', 'Ofertas'], ['Reviews', 'Opiniones'], ['Accommodations', 'Alojamientos'], ['Blog', 'Blog'], ['About Us', 'Sobre nosotros'], ['FAQs', 'Preguntas frecuentes'],
  ['Safari styles', 'Tipos de safari'], ['Browse all safaris →', 'Ver todos los safaris →'], ['Best-selling Safaris', 'Safaris más vendidos'], ['Exclusive Fly-In Safaris', 'Safaris exclusivos en avioneta'],
  ['Joining Group Safaris', 'Safaris en grupo compartido'], ['Migration Safaris', 'Safaris de la migración'], ['Midrange Lodge Safaris', 'Safaris en lodges de gama media'], ['Budget Safaris', 'Safaris económicos'],
  ['Hiking & Trekking', 'Senderismo y trekking'], ['Day Excursions', 'Excursiones de un día'], ['Signature journeys', 'Viajes destacados'], ['Featured journey', 'Viaje recomendado'],
  ['Destinations', 'Destinos'], ['Northern Circuit', 'Circuito norte'], ['Southern Circuit', 'Circuito sur'], ['Browse all destinations →', 'Ver todos los destinos →'],
  ['Group Safaris', 'Safaris en grupo'], ['Experiences', 'Experiencias'], ['Great Migration', 'Gran Migración'], ['Calving season (Ndutu)', 'Temporada de partos (Ndutu)'], ['Big Five', 'Los cinco grandes'],
  ['Big cats & photography', 'Grandes felinos y fotografía'], ['Cultural & Maasai visits', 'Visitas culturales y masái'], ['Kilimanjaro climb', 'Ascenso al Kilimanjaro'], ['Mount Meru trek', 'Trekking al monte Meru'],
  ['Zanzibar beach extension', 'Extensión de playa en Zanzíbar'], ['Safari + beach combination', 'Safari y playa'], ['All experiences →', 'Todas las experiencias →'],
  ['Get a Quote', 'Pedir presupuesto'], ['Contact', 'Contacto'], ['Start Planning', 'Empezar a planificar'], ['Book this safari', 'Reservar este safari'], ['Plan your safari', 'Planifique su safari'],
  ['Safari tips & offers in your inbox', 'Consejos y ofertas de safari en su correo'], ['Subscribe', 'Suscribirse'], ['We accept', 'Aceptamos'],
  ['Important Links', 'Enlaces importantes'], ['Terms And Conditions', 'Términos y condiciones'], ['Privacy & Policy', 'Política de privacidad'], ['Travel Insurance', 'Seguro de viaje'], ['Contact Channels', 'Canales de contacto'],
  ['Travel Blog & Tips', 'Blog y consejos de viaje'], ['Contact Info', 'Información de contacto'], ['WhatsApp us', 'Escríbanos por WhatsApp'],
  ['© 2026 Glad Of Africa. All Rights Reserved.', '© 2026 Glad Of Africa. Todos los derechos reservados.'],
  ['We offer Kilimanjaro treks, wildlife safaris, and Zanzibar beach holidays in Tanzania with a dedicated team committed to quality service and safety.',
    'Ofrecemos ascensos al Kilimanjaro, safaris de fauna y vacaciones de playa en Zanzíbar, en Tanzania, con un equipo dedicado al buen servicio y la seguridad.'],
  ['Kilimanjaro', 'Kilimanjaro'], ['Mount Meru', 'Monte Meru'], ['Lake Manyara', 'Lago Manyara'],
  ['Serengeti National Park', 'Parque Nacional del Serengeti'], ['Ngorongoro Crater', 'Cráter del Ngorongoro'], ['Tarangire National Park', 'Parque Nacional de Tarangire'], ['Lake Manyara National Park', 'Parque Nacional del Lago Manyara'],
  ['Arusha National Park', 'Parque Nacional de Arusha'], ['Kilimanjaro National Park', 'Parque Nacional del Kilimanjaro'], ['Mount Kilimanjaro', 'Monte Kilimanjaro'], ['Zanzibar Beaches', 'Playas de Zanzíbar'], ['Stone Town', 'Ciudad de Piedra'],
  ['Required', 'Obligatorio'], ['Travellers', 'Viajeros'], ['Dates', 'Fechas'], ['Days', 'Días'], ['Duration', 'Duración'], ['Included', 'Incluido'], ['Best months', 'Mejores meses'],
  ['Safari prices at a glance', 'Precios de safari de un vistazo'], ['Starting price (USD)', 'Precio desde (USD)'], ['Safari category', 'Categoría de safari'],
];

// Spanish for the patterns in strings.js, keyed by the same regular expression.
const PATTERNS = {
  'Explore the (.+) itinerary': 'Ver el itinerario: {1}',
  'Explore (.+) and its safaris →': 'Descubrir {1} y sus safaris →',
  'From USD ([\\d,]+) / person': 'Desde USD $1 / persona',
  '(\\d+) Days? / (\\d+) Nights? · From \\$([\\d,]+) pp': '$1 días / $2 noches · Desde $$3 por persona',
  '(.+) \\(1 day\\)': '{1} (1 día)',
  '(.+) \\((\\d+) days\\)': '{1} ($2 días)',
  '(\\d+) Days': '$1 días',
  '(\\d+)\\+ days': '$1+ días',
  '(.+) · (.+)': '{1} · {2}',
};
module.exports = { ROWS, PATTERNS };
