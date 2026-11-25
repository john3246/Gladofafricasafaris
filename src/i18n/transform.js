const { LANGS, href } = require('./index');
const dict = require('./dictionary');

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&rarr;': '→', '&larr;': '←', '&middot;': '·', '&nbsp;': ' ', '&bull;': '•', '&hellip;': '…', '&ndash;': '–', '&mdash;': '—', '&rsaquo;': '›', '&ldquo;': '“', '&rdquo;': '”', '&copy;': '©', '&minus;': '−' };
const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|apos|rarr|larr|middot|nbsp|bull|hellip|ndash|mdash|rsaquo|ldquo|rdquo|copy|minus|#39);/g, (m) => ENTITIES[m] || m);
const encode = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const encodeAttr = (s) => encode(s).replace(/"/g, '&quot;');

const SKIP_LINK = /^\/(?:admin|uploads|images|img|css|js|icons|video|vendor|robots\.txt|sitemap\.xml|llms|healthz|t\/|blog\/feed\.xml|feed|tours\.json|\.well-known)|^\/(?:es|it|fr|de|zh)(?:\/|$)|^\/\//;
const PAGE_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'big', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'br']);
const LETTERS = /[A-Za-zÀ-ÿ]/;

/** Translates one piece of text, keeping the spaces around it. Unknown text is returned unchanged (hit = false). */
function text(raw, lang) {
  const lead = raw.match(/^\s*/)[0];
  const trail = raw.match(/\s*$/)[0];
  const core = decode(raw).replace(/\s+/g, ' ').trim();
  if (!core) return { out: raw, hit: false, chars: 0, core };
  const tr = dict.translate(core, lang);
  if (tr === null) return { out: raw, hit: false, chars: LETTERS.test(core) ? core.length : 0, core };
  return { out: lead + encode(tr) + trail, hit: true, chars: core.length, core };
}

function rewriteLink(tag, lang) {
  if (/\sdata-nolang(?:\s|>|=)/.test(tag)) return tag;
  return tag.replace(/\s(href|action)="(\/[^"]*)"/g, (m, attr, url) => {
    if (SKIP_LINK.test(url) || /\.[a-z0-9]{2,5}(?:[?#]|$)/i.test(url.split('?')[0])) return m;
    return ` ${attr}="${href(lang, url)}"`;
  });
}

function translateAttrs(tag, lang, ctx, skipped) {
  let t = tag;
  for (const a of PAGE_ATTRS) {
    t = t.replace(new RegExp(`\\s${a}="([^"]*)"`), (m, v) => {
      const r = text(v, lang);
      if (!r.hit) { if (!skipped && ctx.onMiss && r.chars) ctx.onMiss(r.core, 'text'); return m; }
      return ` ${a}="${encodeAttr(decode(r.out).trim())}"`;
    });
  }
  return t;
}

/**
 * Builds the unit of text a human would translate: the words of one block (a paragraph, heading, list item...) with its
 * inline tags (links, bold, line breaks) replaced by numbered markers such as <a1>...</a1>, so the whole sentence is
 * translated at once and the tags can move to where the other language needs them.
 */
function unitOf(tokens) {
  const tags = {};
  const stack = [];
  let n = 0;
  let unit = '';
  for (const t of tokens) {
    if (t[0] !== '<') { unit += decode(t); continue; }
    const m = t.match(/^<(\/?)([a-z0-9]+)/i);
    const name = m[2].toLowerCase();
    if (/\/>$/.test(t) || name === 'br' || name === 'wbr') { n += 1; tags[`<${name}${n}/>`] = t; unit += `<${name}${n}/>`; continue; }
    if (m[1] === '/') {
      const open = stack.pop();
      if (open) { tags[`</${open.name}${open.n}>`] = t; unit += `</${open.name}${open.n}>`; } else unit += t;
      continue;
    }
    n += 1;
    stack.push({ name, n });
    tags[`<${name}${n}>`] = t;
    unit += `<${name}${n}>`;
  }
  return { unit: unit.replace(/\s+/g, ' ').trim(), tags };
}

/** Puts the original tags back into a translated unit. */
function restore(translated, tags, lang) {
  const used = new Set();
  const out = translated.replace(/<\/?[a-z0-9]+\d+\/?>/gi, (m) => {
    const t = tags[m];
    if (t === undefined) return '';
    used.add(m);
    return t[0] === '<' && /^<(a)\b/i.test(t) ? rewriteLink(t, lang) : t;
  });
  // text outside the tags is plain text: it was written unescaped, so escape it now
  const parts = out.split(/(<[^>]+>)/g).map((p) => (p[0] === '<' ? p : encode(decodeLoose(p))));
  return parts.join('');
}
const decodeLoose = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const LD_TEXT = new Set(['name', 'text', 'description', 'headline', 'alternateName', 'jobTitle', 'articleSection']);

/** Structured data (FAQ, breadcrumbs, lists, tours) in the visitor's language: known sentences are translated, the rest stays. */
function ldWalk(v, lang, ctx) {
  if (Array.isArray(v)) return v.map((x) => ldWalk(x, lang, ctx));
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      if (LD_TEXT.has(k) && typeof x === 'string') {
        const core = x.replace(/\s+/g, ' ').trim();
        const tr = core ? dict.translate(core, lang) : null;
        if (tr === null && core && /[A-Za-z]/.test(core) && core.length > 3 && ctx.onMiss && k !== 'name') ctx.onMiss(core, 'text');
        o[k] = tr === null || tr === undefined ? x : tr;
      } else o[k] = ldWalk(x, lang, ctx);
    }
    if (o['@type'] && 'inLanguage' in o) o.inLanguage = lang;
    return o;
  }
  return v;
}

function translateJsonLd(token, lang, ctx) {
  const m = token.match(/^(<script[^>]*>)([\s\S]*)(<\/script>)$/i);
  if (!m) return token;
  try {
    const json = ldWalk(JSON.parse(m[2].replace(/\\u003c/g, '<')), lang, ctx);
    return m[1] + JSON.stringify(json).replace(/</g, '\\u003c') + m[3];
  } catch (_) { return token; }
}

/**
 * Turns an English page into the page for `lang`: whole sentences from the dictionary (or fragment by fragment when a
 * sentence is not known yet), links kept inside the language, language and locale tags, and search-engine tags that tell
 * the truth. Parts marked data-i18n-skip (guest reviews) keep their own language and do not count.
 * ctx: { path, meta?, native?, onMiss?(text, kind) }; after the call ctx.share and ctx.complete are set.
 */
function transform(html, lang, ctx) {
  const parts = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<textarea[\s\S]*?<\/textarea>|<!--[\s\S]*?-->|<[^>]+>)/g).filter((p) => p !== '' && p !== undefined);
  const out = [];
  let seg = [];
  let total = 0; let translated = 0;
  let inMain = false;
  let skip = null;
  let afterTitle = false;
  let metaMissing = false; // the page title or description has no translation yet

  const flush = (kind) => {
    if (!seg.length) return;
    const texts = seg.filter((t) => t[0] !== '<');
    const joined = decode(texts.join('')).replace(/\s+/g, ' ').trim();
    if (!joined || !LETTERS.test(joined)) { out.push(...seg.map((t) => (t[0] === '<' ? finishTag(t) : t))); seg = []; return; }
    const skipped = Boolean(skip);
    const lead = (seg[0][0] !== '<' ? seg[0].match(/^\s*/)[0] : '');
    const last = seg[seg.length - 1];
    const trail = last[0] !== '<' ? last.match(/\s*$/)[0] : '';
    const hasTags = seg.some((t) => t[0] === '<');
    const { unit, tags } = unitOf(seg);
    const whole = kind === 'title' && ctx.meta ? ctx.meta.title : dict.translate(unit, lang);
    if (kind === 'title' && (whole === null || whole === undefined)) metaMissing = true;
    if (whole !== null && whole !== undefined) {
      const body = hasTags ? restore(whole, tags, lang) : encode(whole);
      out.push(lead + body + trail);
      if (inMain && !skipped) { total += joined.length; translated += joined.length; }
    } else {
      // not known as a whole: translate the pieces that are known and report the sentence as missing
      let missed = false;
      for (const t of seg) {
        if (t[0] === '<') { out.push(finishTag(t)); continue; }
        const r = text(t, lang);
        out.push(r.out);
        if (inMain && !skipped) { total += r.chars; if (r.hit) translated += r.chars; }
        if (!r.hit && r.chars) missed = true;
      }
      if (missed && !skipped && ctx.onMiss) ctx.onMiss(unit, kind || 'text');
    }
    seg = [];
  };

  const finishTag = (t) => {
    let tag = rewriteLink(translateAttrs(t, lang, ctx, Boolean(skip)), lang);
    if (/^<html\b/i.test(tag)) tag = tag.replace(/lang="[a-z-]+"/i, `lang="${lang}"`);
    if (/^<meta\b/i.test(tag)) {
      const loc = (LANGS.find((l) => l.code === lang) || {}).locale;
      if (/property="og:locale"/.test(tag) && loc) tag = tag.replace(/content="[^"]*"/, `content="${loc}"`);
      const isDesc = /(?:name="description"|property="og:description"|name="twitter:description")/.test(tag);
      const isTitle = /(?:property="og:title"|name="twitter:title"|property="og:image:alt")/.test(tag);
      if (isDesc || isTitle) {
        const m = tag.match(/content="([^"]*)"/);
        const en = m ? decode(m[1]) : '';
        const given = ctx.meta ? (isDesc ? ctx.meta.description : ctx.meta.title) : dict.translate(en, lang);
        if (given) tag = tag.replace(/content="[^"]*"/, `content="${encodeAttr(given)}"`);
        else if (en) { metaMissing = true; if (ctx.onMiss) ctx.onMiss(en, isDesc ? 'description' : 'title'); }
      }
    }
    return tag;
  };

  for (const p of parts) {
    if (p[0] !== '<') {
      seg.push(p);
      continue;
    }
    if (/^<script[^>]*application\/ld\+json/i.test(p)) { flush(); out.push(translateJsonLd(p, lang, ctx)); continue; }
    if (/^<(script|style|textarea|!--)/i.test(p)) { flush(); out.push(p); continue; }
    const m = p.match(/^<(\/?)([a-z0-9-]+)/i);
    if (!m) { flush(); out.push(p); continue; } // <!doctype ...>
    const name = m[2].toLowerCase();
    if (INLINE.has(name)) {
      // inline tags stay inside the sentence; skip bookkeeping still applies to them
      if (skip) { if (name === skip.name) { if (m[1]) skip.depth -= 1; else if (!/\/>$/.test(p)) skip.depth += 1; } }
      else if (!m[1] && /\sdata-i18n-skip(?:\s|>|=)/.test(p)) { flush(); skip = { name, depth: 1 }; }
      seg.push(p);
      if (skip && skip.depth <= 0) { flush(); skip = null; }
      continue;
    }
    // a block-level tag ends the sentence
    const wasTitle = afterTitle;
    flush(wasTitle ? 'title' : undefined);
    afterTitle = false;
    if (/^<title/i.test(p) && !m[1]) afterTitle = true;
    if (/^<main\b/i.test(p)) inMain = true;
    if (/^<\/main/i.test(p)) inMain = false;
    if (skip) {
      if (name === skip.name) { if (m[1]) skip.depth -= 1; else if (!/\/>$/.test(p)) skip.depth += 1; }
      if (skip.depth <= 0) skip = null;
    } else if (!m[1] && /\sdata-i18n-skip(?:\s|>|=)/.test(p) && !/\/>$/.test(p)) {
      skip = { name, depth: 1 };
    }
    out.push(finishTag(p));
  }
  flush();

  let result = out.join('');
  const share = ctx.native ? 1 : total ? translated / total : 1;
  // a language version is offered to search engines when nearly all of its main content is translated
  const complete = Boolean(ctx.native) || (share >= 0.9 && !metaMissing);
  ctx.share = share;
  ctx.complete = complete;
  if (!complete) result = result.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">');
  return result;
}

module.exports = { transform, text, unitOf, restore };
