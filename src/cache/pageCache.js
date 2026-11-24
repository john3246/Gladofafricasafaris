const { state } = require('./redis');
const { env } = require('../config');
const { isPreview } = require('../utils/preview');

/** Caches rendered HTML for GET requests in Redis. No-op without Redis, and never for /admin or /uploads. */
function pageCache(ttl = env.pageCacheTtl) {
  return async (req, res, next) => {
    if (!state.client || req.method !== 'GET' || req.path.startsWith('/admin') || req.path.startsWith('/uploads')) return next();
    // Signed-in CMS users (preview cookie) and ?preview= requests may see unpublished content: never read or fill the shared cache.
    if (isPreview(req) || req.query.preview) return next();
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
}

/** Drops every cached page (called after any content edit in the CMS). */
async function flush() {
  if (!state.client) return;
  let cursor = '0';
  do {
    const [next, keys] = await state.client.scan(cursor, 'MATCH', 'page:*', 'COUNT', 200);
    cursor = next;
    if (keys.length) await state.client.del(...keys);
  } while (cursor !== '0');
}

module.exports = pageCache;
module.exports.flush = flush;
