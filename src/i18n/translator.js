const Anthropic = require('@anthropic-ai/sdk');

const NAMES = { es: 'Spanish', it: 'Italian', fr: 'French', de: 'German', zh: 'Simplified Chinese' };
const MARKER = /<\/?[a-z0-9]+\d+\/?>/gi;

const system = (lang) => `You translate website text for Glad Of Africa Safari & Tours, a locally owned Tanzania safari and Kilimanjaro operator in Arusha, from English into ${NAMES[lang]}.
Write natural, warm, accurate ${NAMES[lang]} that a travel company would publish: no word-for-word calques, no extra claims, nothing added or left out.
Keep unchanged: brand and place names (Serengeti, Ngorongoro, Arusha, Zanzibar...), people's names, numbers, prices, currency signs, e-mail addresses, web addresses and phone numbers. Use the usual ${NAMES[lang]} names for Kilimanjaro, Mount Meru, Lake Manyara and "Big Five".
The text may contain numbered tags such as <a1>...</a1>, <strong2>...</strong2> or <br3/>. Keep every tag, with the same name and number, around the matching words in the translation (you may move them where the grammar needs). Never add tags.
For Simplified Chinese, titles stay within 30 characters and descriptions within 80 characters. Items marked kind "title" must stay within 60 characters; kind "description" within 155 characters and at least 145 if the English is that long.
You receive a JSON array of {"id", "kind", "text"}. Reply with ONLY a JSON object that maps every id to its translation. No explanations, no code fences.`;

const tagsOf = (s) => (s.match(MARKER) || []).map((t) => t.toLowerCase()).sort().join('|');

function parseJson(text) {
  const t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  return JSON.parse(t.slice(start, end + 1));
}

/**
 * Translates [{ id, text, kind }] into one language with the Claude API. Returns { translations: {id: text}, rejected: [id], usage }.
 * A translation is accepted only if it keeps exactly the same tags and, for titles, fits its length.
 */
async function translateBatch(items, lang, cfg) {
  const client = new Anthropic({ apiKey: cfg.apiKey, baseURL: cfg.baseURL, maxRetries: 3, timeout: 5 * 60 * 1000 });
  const res = await client.messages.create({
    model: cfg.model,
    max_tokens: 16000,
    output_config: { effort: 'low' },
    system: system(lang),
    messages: [{ role: 'user', content: JSON.stringify(items.map(({ id, kind, text }) => ({ id, kind: kind || 'text', text }))) }],
  });
  if (res.stop_reason === 'refusal') return { translations: {}, rejected: items.map((i) => i.id), usage: res.usage };
  const raw = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  let map = {};
  try { map = parseJson(raw); } catch (_) { return { translations: {}, rejected: items.map((i) => i.id), usage: res.usage }; }
  const translations = {}; const rejected = [];
  for (const it of items) {
    const tr = typeof map[it.id] === 'string' ? map[it.id].trim() : '';
    const fits = it.kind === 'title' ? tr.length <= 62 : it.kind === 'description' ? tr.length <= 160 : true;
    if (tr && tagsOf(tr) === tagsOf(it.text) && fits) translations[it.id] = tr; else rejected.push(it.id);
  }
  return { translations, rejected, usage: res.usage };
}

module.exports = { translateBatch, NAMES };
