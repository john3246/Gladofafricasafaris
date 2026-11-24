const { secrets } = require('../store/collections');
const { events } = require('../store');
const { encrypt, decrypt } = require('../utils/secretBox');

/**
 * The translator's settings (CMS > Translations): the Claude API key (stored encrypted, never shown again), the model,
 * and whether new content is translated automatically. ANTHROPIC_API_KEY on the server is used when nothing is saved.
 */
const KEY = 'translate';
let cache;
events.on('change', (name) => { if (name === 'secrets') cache = undefined; });
const load = async () => { if (cache === undefined) cache = (await secrets.get(KEY)) || {}; return cache; };

const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (best wording)', in: 4, out: 20 },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (good wording, half the price)', in: 2, out: 10 },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (cheapest, simpler wording)', in: 0.1, out: 0.5 },
];

/** Everything the translator needs, or null when no API key is available. */
async function get() {
  const c = await load();
  const apiKey = decrypt(c.apiKeyEnc) || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return null;
  return { apiKey, baseURL: process.env.I18N_API_BASE || undefined, model: c.model || MODELS[0].id, auto: c.auto !== false, dailyCap: Number(c.dailyCap) || 6000 };
}

/** What the CMS may show (never the key itself). */
async function summary() {
  const c = await load();
  return { hasKey: Boolean(decrypt(c.apiKeyEnc)), envKey: Boolean(process.env.ANTHROPIC_API_KEY), model: c.model || MODELS[0].id, auto: c.auto !== false, dailyCap: Number(c.dailyCap) || 6000, updatedAt: c.updatedAt || '' };
}

async function save({ apiKey, clearKey, model, auto, dailyCap }) {
  const c = await load();
  const next = { ...c, key: KEY, model: MODELS.some((m) => m.id === model) ? model : c.model || MODELS[0].id, auto: Boolean(auto), dailyCap: Math.min(50000, Math.max(100, Number(dailyCap) || 6000)), updatedAt: new Date().toISOString() };
  if (clearKey) next.apiKeyEnc = '';
  else if (apiKey && apiKey.trim()) next.apiKeyEnc = encrypt(apiKey.trim());
  await secrets.put(next);
  cache = undefined;
}

module.exports = { get, summary, save, MODELS };
