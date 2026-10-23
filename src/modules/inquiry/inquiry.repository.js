const { state } = require('../../db/pool');
const logger = require('../../utils/logger');

exports.save = async (i) => {
  if (!state.pool) {
    logger.info('Inquiry received (no DB):', JSON.stringify(i));
    return;
  }
  await state.pool.query(
    `INSERT INTO inquiries (name, email, phone, tour, tier, travel_month, travellers, message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [i.name, i.email, i.phone, i.tour, i.tier, i.travelMonth, i.travellers, i.message]
  );
};
