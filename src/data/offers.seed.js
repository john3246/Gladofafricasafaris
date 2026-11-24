/**
 * The first set of offers: the calving season safaris and the safari-and-beach holiday packages. Only labels and a short
 * note are set; prices are the normal prices (a "was" price is added in the CMS only when there is a real saving).
 */
const CALVING = { offerLabel: 'Calving season 2027', offerNote: 'Calving usually peaks in February, and the camps around Ndutu fill up early. Book ahead for your dates.' };
const HOLIDAY = { offerLabel: 'Safari & beach holiday', offerNote: 'Finish with the Indian Ocean: a safari followed by beach days in Zanzibar, planned as one safari.' };

module.exports = {
  CALVING, HOLIDAY,
  byTour: {
    '5-day-ndutu-calving-season-ngorongoro-crater-safari': CALVING,
    '6-days-ndutu-safari': CALVING,
    '7-day-february-calving-season-safari': CALVING,
    '7-days-ndutu-calving-season-safari': CALVING,
    '8-days-experience-calving-season-in-tanzania': CALVING,
    '5-days-zanzibar-to-wildebeest-migration-ngorongoro-crater-safari': HOLIDAY,
    '8-days-fly-out-from-mara-river-crossing-experience-to-zanzibar': HOLIDAY,
    '10-day-tanzania-safari-and-zanzibar-tour': HOLIDAY,
  },
};
