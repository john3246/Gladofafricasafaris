const { state } = require('./redis');
const { env } = require('../config');

/** Caches rendered HTML for GET requests in Redis. No-op without Redis. */
module.exports = (ttl = env.pageCacheTtl) => async (req, res, next) => {
  if (!state.client || req.method !== 'GET') return next();
  const key = `page:${req.originalUrl}`;
  try {
    const hit = await state.client.get(key);
    if (hit) return res.set('X-Cache', 'HIT').type('html').send(hit);
  } catch (_) {
    return next();
  }

  const send = res.send.bind(res);
  res.send = (body) => {
    if (res.statusCode === 200 && typeof body === 'string') {
      state.client.set(key, body, 'EX', ttl).catch(() => {});
    }
    res.set('X-Cache', 'MISS');
    return send(body);
  };
  next();
};
