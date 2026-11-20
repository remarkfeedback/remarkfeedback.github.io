// Tank Builder product reader.
// Turns a product page (HTML, or text the user pasted) into a 3D-ready item:
// what it is, its real size in cm, and the specs that matter for a tank.
// Runs in the browser, in the Cloudflare Worker and in Node tests.

// ---------- libraries ----------
// Adult sizes (cm) and colours for common fish and shrimp.
export const FISH = [
  { k: /neon tetra/, n: 'Neon tetra', len: 3.5, c: ['#2b7bff', '#e8392f'], school: true },
  { k: /cardinal/, n: 'Cardinal tetra', len: 4, c: ['#2b7bff', '#e8392f'], school: true },
  { k: /ember/, n: 'Ember tetra', len: 2, c: ['#ff6a2b', '#ff9a5b'], school: true },
  { k: /rummy|rummynose/, n: 'Rummy nose tetra', len: 5, c: ['#d9d9d0', '#d8261c'], school: true },
  { k: /harlequin|rasbora/, n: 'Harlequin rasbora', len: 4.5, c: ['#f08c5a', '#222'], school: true },
  { k: /chili rasbora|mosquito rasbora/, n: 'Chili rasbora', len: 2, c: ['#e8392f', '#ff7a5c'], school: true },
  { k: /celestial|galaxy rasbora|cpd/, n: 'Celestial pearl danio', len: 2.5, c: ['#28406b', '#ff7a3c'], school: true },
  { k: /zebra danio|danio/, n: 'Danio', len: 5, c: ['#d9d4c0', '#2a3a6b'], school: true },
  { k: /endler/, n: 'Endler', len: 3, c: ['#ff8a1e', '#2bd0a0'], school: true },
  { k: /guppy|guppies/, n: 'Guppy', len: 5, c: ['#ffb02e', '#3a7bff'], school: true },
  { k: /platy/, n: 'Platy', len: 6, c: ['#ff7a1e', '#ffb02e'], school: true },
  { k: /molly|mollies/, n: 'Molly', len: 10, c: ['#222', '#555'], school: true },
  { k: /betta|siamese fighting/, n: 'Betta', len: 6.5, c: ['#c4162a', '#2a2ac4'], school: false },
  { k: /honey gourami/, n: 'Honey gourami', len: 5, c: ['#ffb02e', '#ff8a1e'], school: false },
  { k: /gourami/, n: 'Gourami', len: 10, c: ['#7aa6d9', '#ff8a6a'], school: false },
  { k: /corydoras|cory\b|corys|pygmy cory/, n: 'Corydoras', len: 6, c: ['#bfb39a', '#444'], school: true, bottom: true },
  { k: /otocinclus|oto\b/, n: 'Otocinclus', len: 4, c: ['#a89a78', '#3a3a30'], school: true, bottom: true },
  { k: /kuhli/, n: 'Kuhli loach', len: 9, c: ['#e8a03c', '#2a2016'], school: true, bottom: true },
  { k: /pleco|bristlenose|ancistrus/, n: 'Bristlenose pleco', len: 12, c: ['#4a4436', '#2a261e'], school: false, bottom: true },
  { k: /angelfish|angel fish|scalare/, n: 'Angelfish', len: 15, c: ['#e8e4d8', '#222'], school: false, tall: true },
  { k: /discus/, n: 'Discus', len: 18, c: ['#d9622a', '#2a6bd9'], school: false, tall: true },
  { k: /goldfish/, n: 'Goldfish', len: 20, c: ['#ff8a1e', '#ffb02e'], school: true },
  { k: /clownfish|clown fish|ocellaris/, n: 'Clownfish', len: 9, c: ['#ff6a10', '#ffffff'], school: false },
  { k: /cherry shrimp|neocaridina|shrimp/, n: 'Shrimp', len: 2.5, c: ['#d8261c', '#ff6a5c'], school: true, bottom: true, shrimp: true },
  { k: /amano/, n: 'Amano shrimp', len: 5, c: ['#b8b0a0', '#6a6458'], school: true, bottom: true, shrimp: true },
  { k: /nerite|snail/, n: 'Nerite snail', len: 2.5, c: ['#3a2a1a', '#c8a050'], school: false, bottom: true, snail: true },
];

// Plants: zone and typical grown height (cm).
export const PLANTS = [
  { k: /monte carlo|micranthemum tweediei/, n: 'Monte Carlo', zone: 'carpet', h: 3, form: 'carpet', c: '#5fbf3a' },
  { k: /hemianthus|cuba|\bhc\b/, n: 'HC Cuba', zone: 'carpet', h: 2, form: 'carpet', c: '#62c43a' },
  { k: /glossostigma|glosso/, n: 'Glossostigma', zone: 'carpet', h: 3, form: 'carpet', c: '#5cb83a' },
  { k: /hairgrass|eleocharis/, n: 'Dwarf hairgrass', zone: 'carpet', h: 6, form: 'grass', c: '#4fae36' },
  { k: /lilaeopsis/, n: 'Lilaeopsis', zone: 'carpet', h: 5, form: 'grass', c: '#4a9e34' },
  { k: /sagittaria|sag\b/, n: 'Dwarf sagittaria', zone: 'fore', h: 8, form: 'grass', c: '#58a83a' },
  { k: /java moss|christmas moss|flame moss|taxiphyllum|vesicularia|\bmoss\b/, n: 'Moss', zone: 'moss', h: 3, form: 'moss', c: '#3f7a2a' },
  { k: /bucephalandra|buce/, n: 'Bucephalandra', zone: 'mid', h: 8, form: 'rosette', c: '#3a5a3a' },
  { k: /anubias/, n: 'Anubias', zone: 'mid', h: 12, form: 'rosette', c: '#2f6a2a' },
  { k: /java fern|microsorum|pteropus/, n: 'Java fern', zone: 'mid', h: 22, form: 'fern', c: '#3b7a2e' },
  { k: /cryptocoryne|crypt/, n: 'Cryptocoryne', zone: 'mid', h: 15, form: 'rosette', c: '#6b5a3a' },
  { k: /pogostemon helferi|downoi/, n: 'Pogostemon helferi', zone: 'fore', h: 8, form: 'rosette', c: '#5cae3a' },
  { k: /amazon sword|echinodorus/, n: 'Amazon sword', zone: 'back', h: 40, form: 'sword', c: '#3f8a2e' },
  { k: /vallisneria|vallis/, n: 'Vallisneria', zone: 'back', h: 50, form: 'ribbon', c: '#5aa83a' },
  { k: /rotala/, n: 'Rotala', zone: 'back', h: 35, form: 'stem', c: '#d8723a' },
  { k: /ludwigia/, n: 'Ludwigia', zone: 'back', h: 35, form: 'stem', c: '#c0503a' },
  { k: /hygrophila/, n: 'Hygrophila', zone: 'back', h: 35, form: 'stem', c: '#4f9a32' },
  { k: /limnophila/, n: 'Limnophila', zone: 'back', h: 40, form: 'stem', c: '#5ab83a' },
  { k: /cabomba/, n: 'Cabomba', zone: 'back', h: 45, form: 'stem', c: '#62b83a' },
  { k: /bacopa/, n: 'Bacopa', zone: 'back', h: 30, form: 'stem', c: '#5a9a32' },
  { k: /alternanthera/, n: 'Alternanthera', zone: 'mid', h: 25, form: 'stem', c: '#a03a4a' },
  { k: /staurogyne/, n: 'Staurogyne repens', zone: 'fore', h: 8, form: 'stem', c: '#4f9a32' },
  { k: /marimo/, n: 'Marimo ball', zone: 'fore', h: 5, form: 'ball', c: '#2f6a2a' },
  { k: /red root floater|salvinia|frogbit|duckweed|floating/, n: 'Floating plants', zone: 'float', h: 1, form: 'float', c: '#6ab83a' },
];

// Hardscape colours and densities (g/cm³) so "5kg" can become real pieces.
export const HARDSCAPE = [
  { k: /seiryu|ryuoh|mini landscape|grey mountain/, n: 'Seiryu stone', type: 'rock', c: '#7d868c', d: 2.65 },
  { k: /dragon stone|ohko|dragon rock/, n: 'Dragon stone', type: 'rock', c: '#a07f52', d: 2.0 },
  { k: /lava/, n: 'Lava rock', type: 'rock', c: '#4a3c37', d: 1.3 },
  { k: /frodo/, n: 'Frodo stone', type: 'rock', c: '#6d7068', d: 2.6 },
  { k: /slate/, n: 'Slate', type: 'rock', c: '#4b5157', d: 2.7, flat: true },
  { k: /holey|texas/, n: 'Texas holey rock', type: 'rock', c: '#d6cfbd', d: 1.8 },
  { k: /pagoda/, n: 'Pagoda stone', type: 'rock', c: '#8c7660', d: 2.4 },
  { k: /elephant skin/, n: 'Elephant skin stone', type: 'rock', c: '#5f6266', d: 2.6 },
  { k: /\brock|\bstone/, n: 'Rock', type: 'rock', c: '#8a8d88', d: 2.5 },
  { k: /spider ?wood|azalea/, n: 'Spider wood', type: 'wood', c: '#c09a6c', form: 'twiggy' },
  { k: /manzanita/, n: 'Manzanita', type: 'wood', c: '#7e4f34', form: 'twiggy' },
  { k: /mopani/, n: 'Mopani wood', type: 'wood', c: '#6a4a2c', form: 'chunky' },
  { k: /redmoor|red moor/, n: 'Redmoor root', type: 'wood', c: '#7a4632', form: 'twiggy' },
  { k: /malaysian|bogwood|bog wood/, n: 'Bogwood', type: 'wood', c: '#4a3324', form: 'chunky' },
  { k: /cholla/, n: 'Cholla wood', type: 'wood', c: '#b39566', form: 'log' },
  { k: /cork/, n: 'Cork bark', type: 'wood', c: '#5a4030', form: 'log' },
  { k: /driftwood|wood|branch|root/, n: 'Driftwood', type: 'wood', c: '#7a5a3a', form: 'twiggy' },
];

const SUBSTRATE_COLOURS = [
  [/aqua ?soil|amazonia|controsoil|soil|tropica|fluval stratum|stratum/, '#3b2a22', 'Aqua soil'],
  [/black sand|black gravel/, '#262626', 'Black sand'],
  [/sand/, '#e1d3b2', 'Sand'],
  [/gravel|pebble/, '#9a8f84', 'Gravel'],
];

// Default sizes (cm) when a page gives none. Marked as estimated.
const DEFAULTS = {
  tank: { l: 60, w: 30, h: 36 },
  stand: { l: 60, w: 30, h: 72 },
  filter_canister: { l: 20, w: 20, h: 35 },
  filter_internal: { l: 8, w: 6, h: 20 },
  filter_hob: { l: 18, w: 10, h: 16 },
  filter_sponge: { l: 8, w: 8, h: 14 },
  heater: { l: 3, w: 3, h: 22 },
  light: { l: 60, w: 9, h: 2 },
  rock: { l: 14, w: 10, h: 9 },
  wood: { l: 30, w: 15, h: 20 },
  ornament: { l: 12, w: 10, h: 10 },
  co2: { l: 7, w: 7, h: 30 },
  airpump: { l: 12, w: 7, h: 6 },
};

// ---------- text helpers ----------
const NUM = '(\\d+(?:[.,]\\d+)?)';
const toNum = s => parseFloat(String(s).replace(',', '.'));
const UNIT = { mm: 0.1, cm: 1, m: 100, in: 2.54, inch: 2.54, inches: 2.54, '"': 2.54, '″': 2.54 };
const unitOf = u => UNIT[(u || '').toLowerCase().replace(/\.$/, '')] || null;

function decodeEntities(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&times;/g, '×').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

export function htmlToText(html) {
  return decodeEntities(String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h\d|\/td|\/th|\/dt|\/dd)[^>]*>/gi, '\n').replace(/<(td|th|dd)[^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ')).replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

// Remove upsells, related products and reviews so their sizes and prices don't leak in.
const CUT_START = /^(complete your setup|useful additions|you may also like|you might also like|customers? (also )?(bought|viewed)|other customers also bought|frequently bought together|related products|recently viewed|not right\??|similar products|people also bought|recommended for you|you may also need|shop the look|more from this brand)/i;
const RESUME = /^(description|details|product details|specifications?|technical (data|details|specifications)|at a glance|more information|features|key features|dimensions|product information|overview)\s*:?$/i;
const STOP = /^(customer reviews|reviews?\s*\(|product reviews|write a review|review highlights|customers say|questions? (and|&) answers|store reviews|delivery (&|and) returns|returns policy)/i;

export function mainText(text) {
  const lines = String(text).split(/\n+/).map(l => l.trim()).filter(Boolean);
  const out = [];
  let skipping = false;
  for (const l of lines) {
    if (STOP.test(l)) break;
    if (CUT_START.test(l)) { skipping = true; continue; }
    if (skipping && RESUME.test(l)) skipping = false;
    if (!skipping) out.push(l);
  }
  return out.join('\n');
}

// ---------- structured data ----------
export function readStructured(html) {
  const res = {};
  if (!html) return res;
  const blocks = [...String(html).matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const products = [];
  const walk = x => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) return x.forEach(walk);
    const t = [].concat(x['@type'] || []).join(' ');
    if (/Product/.test(t)) products.push(x);
    if (x['@graph']) walk(x['@graph']);
    if (x.hasVariant) walk(x.hasVariant);
  };
  for (const b of blocks) { try { walk(JSON.parse(b.trim())); } catch { /* broken JSON-LD is common */ } }
  const p = products.find(x => /Product\b/.test([].concat(x['@type']).join(' ')) && x.offers) || products[0];
  if (p) {
    res.name = p.name;
    const img = [].concat(p.image || [])[0];
    res.image = typeof img === 'object' ? img.url || img.contentUrl : img;
    const offers = [].concat(p.offers || []);
    const o = offers[0] || {};
    const price = o.price ?? o.lowPrice ?? (o.priceSpecification && o.priceSpecification.price);
    if (price != null && !isNaN(+price)) { res.price = +price; res.currency = o.priceCurrency || 'GBP'; }
    res.description = p.description;
    const dim = (v) => v && (typeof v === 'object' ? { v: toNum(v.value), u: v.unitCode || v.unitText } : { v: toNum(v), u: (String(v).match(/[a-z]+/i) || [])[0] });
    const cv = d => { if (!d || isNaN(d.v)) return null; const u = String(d.u || 'cm').toLowerCase(); const f = u === 'mmt' || u === 'mm' ? 0.1 : u === 'inh' || u.startsWith('in') ? 2.54 : u === 'mtr' || u === 'm' ? 100 : 1; return d.v * f; };
    const w = cv(dim(p.width)), h = cv(dim(p.height)), d = cv(dim(p.depth));
    if (w && h) res.dims = { l: w, w: d || w / 2, h };
    if (p.additionalProperty) res.props = [].concat(p.additionalProperty).map(a => `${a.name}: ${a.value}${a.unitText ? ' ' + a.unitText : ''}`).join('\n');
  }
  const meta = (prop) => { const m = String(html).match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i')) || String(html).match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i')); return m ? decodeEntities(m[1]) : null; };
  res.ogTitle = meta('og:title');
  res.ogImage = meta('og:image');
  const amt = meta('product:price:amount') || meta('og:price:amount');
  if (res.price == null && amt && !isNaN(+amt)) { res.price = +amt; res.currency = meta('product:price:currency') || 'GBP'; }
  const h1 = String(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  res.h1 = h1 ? decodeEntities(h1[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : null;
  const t = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  res.title = t ? decodeEntities(t[1]).trim() : null;
  return res;
}

// ---------- measurements from text ----------
const BAD_CONTEXT = /(package|packaging|parcel|shipping|box size|carton|delivery|postage|item model number|pot\b|cup\b)/i;
const GOOD_CONTEXT = /(dimension|size|measure|l\s*x\s*w|lxwxh|l x d x h|w x d x h|length|footprint|external)/i;

// Every "A x B x C unit" (or "unit: A x B x C") with its surrounding context.
export function findTriples(text) {
  const out = [];
  const sep = '\\s*(?:x|×|\\*|by)\\s*';
  const tag = '\\s*(?:[lwdh]|cm|mm)?\\s*';
  const re = new RegExp(`${NUM}${tag}(?:cm|mm)?${sep}${NUM}${tag}(?:cm|mm)?${sep}${NUM}\\s*(?:[lwdh](?![a-z]))?\\s*(mm|cm|m|in(?:ch(?:es)?)?|"|″)?(?![a-z])`, 'gi');
  for (const m of text.matchAll(re)) {
    const before = text.slice(Math.max(0, m.index - 70), m.index);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 25);
    let u = unitOf(m[4]);
    if (!u) { const inner = m[0].match(/(mm|cm)/i); if (inner) u = unitOf(inner[1]); }
    if (!u) { const b = before.match(/\b(mm|cm|inches|inch|in)\b[^a-z\d]*$/i) || before.match(/\((mm|cm)\)/i); if (b) u = unitOf(b[1]); }
    if (!u) { const a = after.match(/^\s*\(?(mm|cm)\b/i); if (a) u = unitOf(a[1]); }
    const vals = [m[1], m[2], m[3]].map(toNum);
    if (!u) u = Math.max(...vals) > 300 ? 0.1 : 1; // bare numbers: big ones are mm
    const label = before.match(/\(?\s*([lwdh])\s*x\s*([lwdh])\s*x\s*([lwdh])\s*\)?[^a-z]*$/i);
    out.push({ vals: vals.map(v => +(v * u).toFixed(1)), order: label ? [label[1], label[2], label[3]].map(s => s.toLowerCase()) : null, before, index: m.index, bad: BAD_CONTEXT.test(before.slice(-45)), good: GOOD_CONTEXT.test(before) });
  }
  return out;
}

// "Length 410 mm", "Height: 37cm", "L:42cm", "Depth - 24 cm", "Width 24cm (0ft 9ins)"
export function findLabelled(text) {
  const got = {};
  const re = new RegExp(`\\b(length|width|wide|depth|deep|height|high|tall|diameter|\\bl|\\bw|\\bd|\\bh)\\b\\s*(?:\\(([a-z]+)\\))?\\s*[:\\-–=|]?\\s*${NUM}\\s*(mm|cm|m|in(?:ch(?:es)?)?|"|″)\\b`, 'gi');
  for (const m of text.matchAll(re)) {
    const ctx = text.slice(Math.max(0, m.index - 40), m.index);
    if (BAD_CONTEXT.test(ctx)) continue;
    const k = m[1].toLowerCase();
    const key = /^(length|l)$/.test(k) ? 'l' : /^(width|wide|w)$/.test(k) ? 'w' : /^(depth|deep|d)$/.test(k) ? 'd' : /^diameter$/.test(k) ? 'dia' : 'h';
    const v = toNum(m[3]) * (unitOf(m[4]) || unitOf(m[2]) || 1);
    if (got[key] == null) got[key] = +v.toFixed(1);
  }
  // unit-first table rows: "Dimensions (L x W x H) mm : 240 x 240 x 370" is handled by findTriples; "Height (cm) 39"
  return got;
}

// "approx. 10 - 30 cm", "size 6-16cm", "20-30cm long", "up to 40cm"
export function findRange(text) {
  const m = text.match(new RegExp(`(?:approx\\.?|approximately|size|sizes|length|between|around|roughly|measures?|~)?\\s*${NUM}\\s*(?:-|–|to)\\s*${NUM}\\s*(mm|cm|in(?:ch(?:es)?)?|")\\b`, 'i'));
  if (m) { const u = unitOf(m[3]) || 1; return { min: toNum(m[1]) * u, max: toNum(m[2]) * u }; }
  return null;
}

const firstNum = (text, re) => { const m = text.match(re); return m ? toNum(m[1]) : null; };

export function findSpecs(text) {
  const t = text.replace(/ /g, ' ');
  const s = {};
  // litres: "57 L", "57 Litres", "57L capacity", "15 US Gal"
  const lit = [...t.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:l|ltr|ltrs|litres?|liters?)\b(?!\s*\/\s*h|ph| per hour)/gi)]
    .filter(m => !/(up to|for aquariums?|suitable for|max(imum)?\.?\s*(aquarium|tank)?\s*(volume|size)?|tank\)|filter volume|pre-?filter|media|bag|tub)/i.test(t.slice(Math.max(0, m.index - 40), m.index)))
    .map(m => toNum(m[1])).filter(v => v >= 5 && v <= 3000);
  if (lit.length) s.litres = lit[0];
  const gal = firstNum(t, /(\d+(?:\.\d+)?)\s*(?:us\s*)?gal(?:lon)?s?\b/i);
  if (!s.litres && gal) s.litres = +(gal * 3.785).toFixed(0);
  // filters/heaters: "for aquariums up to 250 litres", "Suitable for Aquariums Up To | 250 l"
  const mt = t.match(/(?:up to|for aquariums? (?:up to|of)|suitable for (?:aquariums? )?(?:up to)?|max(?:imum)?\.?\s*(?:aquarium|tank)\s*(?:volume|size)?)[^\d\n]{0,25}(\d{2,4})\s*(?:l|ltr|litres?|liters?)\b/i);
  if (mt) s.maxTank = toNum(mt[1]);
  const range = t.match(/(?:aquariums?|tanks?)\s*(?:of|from|between)?\s*(\d{2,4})\s*(?:-|–|to)\s*(\d{2,4})\s*(?:l|litres?|liters?)\b/i);
  if (range) { s.minTank = toNum(range[1]); s.maxTank = s.maxTank || toNum(range[2]); }
  // flow: "900 l/h", "900 Litres Per Hour", "500 Lph", "Max. flow rate l/h 900", "250 GPH"
  const flows = [...t.matchAll(/(\d{2,5})\s*(?:l\s*\/\s*h|lph|l\.?p\.?h|litres?\s*(?:per|\/)\s*h(?:our|r)?|liters?\s*(?:per|\/)\s*h(?:our|r)?)\b/gi)].map(m => toNum(m[1]));
  const flowUnitFirst = t.match(/flow\s*rate[^\d\n]{0,12}(?:l\s*\/\s*h|lph)[^\d\n]{0,6}(\d{2,5})/i);
  if (flowUnitFirst) flows.push(toNum(flowUnitFirst[1]));
  const gph = firstNum(t, /(\d{2,4})\s*gph\b/i);
  if (gph) flows.push(Math.round(gph * 3.785));
  if (flows.length) s.flow = Math.max(...flows);
  // watts: biggest plausible "150w" / "150 watts" (heater in thermo filters is the big one)
  const watts = [...t.matchAll(/(\d{1,4}(?:\.\d+)?)\s*(?:w|watts?)\b/gi)].map(m => toNum(m[1])).filter(v => v > 0 && v <= 1000);
  if (watts.length) { s.watts = Math.max(...watts); s.wattsAll = [...new Set(watts)]; }
  // weight: "5kg", "0.8kg-2.7kg", "15lbs"
  const kg = t.match(/(\d+(?:[.,]\d+)?)\s*(?:-|–|to)?\s*(?:\d+(?:[.,]\d+)?\s*)?(?:kg|kgs|kilos?|kilograms?)\b/i);
  if (kg) s.kg = toNum(kg[1]);
  const lbs = firstNum(t, /(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds)\b/i);
  if (!s.kg && lbs) s.kg = +(lbs * 0.4536).toFixed(2);
  // pack quantity: "pack of 10", "x10", "10 pack", "set of 3", "10 fish"
  const q = t.match(/(?:pack of|set of|bundle of|group of|(?<![\d.]\s?)\bx)\s?(\d{1,3})\b|\b(\d{1,3})\s*(?:pack|pcs|pieces|fish|shrimp|stems|portions)\b/i);
  if (q) s.qty = toNum(q[1] || q[2]);
  // glass thickness "6mm glass"
  const glass = firstNum(t, /(\d{1,2})\s*mm\s*(?:thick\s*)?glass/i);
  if (glass) s.glassMm = glass;
  // plant height "grows to 10-20cm", "height: 30 cm"
  const ph = t.match(/(?:grows? (?:up )?to|height(?: of)?|max(?:imum)?\.? height|reaches|growth height)\s*:?\s*(?:approx\.?\s*)?(\d{1,3}(?:\.\d)?)(?:\s*(?:-|–|to)\s*(\d{1,3}(?:\.\d)?))?\s*cm/i);
  if (ph) s.plantHeight = toNum(ph[2] || ph[1]);
  // "for 60cm tanks"/"suits tanks 60-90cm" (lights)
  const fits = t.match(/(?:for|fits?|suits?|suitable for)\s*(?:aquariums?|tanks?)?\s*(?:of\s*)?(\d{2,3})\s*(?:-|–|to)\s*(\d{2,3})\s*cm/i);
  if (fits) s.fitsTank = { min: toNum(fits[1]), max: toNum(fits[2]) };
  return s;
}

// ---------- what is it? ----------
export function categorise(name, text = '') {
  const n = ' ' + String(name || '').toLowerCase() + ' ';
  const t = String(text || '').toLowerCase().slice(0, 1500);
  const has = re => re.test(n);
  if (has(/\b(cabinet|stand)\b/) && !has(/stand ?alone|freestanding light/)) return { cat: 'stand' };
  if (has(/heater|thermostat|heatup/) && !has(/filter/)) return { cat: 'heater' };
  if (has(/filter/)) {
    if (has(/canister|external|biomaster|eheim (classic|professionel|pro)|fluval \d{3}|\bfx\d|jbl cristalprofi e|oase biomaster/)) return { cat: 'filter', sub: 'canister' };
    if (has(/hang ?on|\bhob\b|aquaclear|power filter/)) return { cat: 'filter', sub: 'hob' };
    if (has(/sponge/)) return { cat: 'filter', sub: 'sponge' };
    return { cat: 'filter', sub: 'internal' };
  }
  if (has(/\b(led|light|lighting|luminaire|lamp)\b/) && !has(/kit|aquarium set|starter/)) return { cat: 'light' };
  if (has(/co2|co₂|diffuser|regulator/)) return { cat: 'co2' };
  if (has(/air ?pump|airstone|air stone/)) return { cat: 'airpump' };
  if (has(/soil|substrate|gravel|sand\b|pebbles?\b|stratum|amazonia/) && !has(/rock|stone(?!s?\s*substrate)/)) {
    const sc = SUBSTRATE_COLOURS.find(([re]) => re.test(n)) || [null, '#9a8f84', 'Substrate'];
    return { cat: 'substrate', colour: sc[1], label: sc[2] };
  }
  const plant = PLANTS.find(p => p.k.test(n));
  if (plant && !has(/fertili[sz]er|food|tweezer|scissor|tool|clip|glue/)) return { cat: 'plant', info: plant };
  const fish = FISH.find(f => f.k.test(n));
  if (fish && !has(/food|net|flakes|pellets|wafers|trap|feeder|ornament|decor/)) return { cat: 'fish', info: fish };
  const hs = HARDSCAPE.find(h => h.k.test(n));
  if (hs && !has(/glue|adhesive|cement|background|poster/)) return { cat: hs.type, info: hs };
  if (has(/ornament|decor|decoration|cave|castle|ship|skull|statue|figure|resin/)) return { cat: 'ornament' };
  if (has(/aquarium|tank|nano|cube|rimless|opti-?white|vivarium|paludarium/) || has(/\b\d{2,4}\s*(l|ltr|litres?|liters?)\b/) || has(/fluval (flex|spec|siena|roma|vicenza|shaker|evo)|juwel|dennerle scaper|aquael|superfish|ciano|aqua one/)) return { cat: 'tank' };
  if (/\b(plant|aquatic plant|in vitro|1-2-grow|potted)\b/.test(n + t)) return { cat: 'plant', info: { n: 'Plant', zone: 'mid', h: 15, form: 'rosette', c: '#3f8a2e' } };
  return { cat: 'ornament' };
}

// Map a triple onto length (side to side), width (front to back), height.
function orientTriple(tr, cat) {
  const [a, b, c] = tr.vals;
  if (tr.order) {
    const o = {}; tr.order.forEach((k, i) => { o[k] = tr.vals[i]; });
    const l = o.l ?? (o.w != null && o.d != null ? o.w : a);
    const w = o.d ?? (o.l != null && o.w != null ? o.w : b);
    return { l, w, h: o.h ?? c };
  }
  if (cat === 'heater' || cat === 'co2') { const s = [a, b, c].sort((x, y) => x - y); return { l: s[0], w: s[1], h: s[2] }; }
  if (cat === 'light') { const s = [a, b, c].sort((x, y) => y - x); return { l: s[0], w: s[1], h: s[2] }; }
  return { l: a, w: b, h: c };
}

function pickTriple(triples, cat) {
  const ok = triples.filter(t => !t.bad && t.vals.every(v => v > 0.3 && v < 400));
  if (!ok.length) return null;
  // stands: prefer the one that says stand/cabinet; tanks: one near "aquarium"
  const scored = ok.map((t, i) => {
    let s = 0;
    if (t.good) s += 3;
    if (t.order) s += 2;
    if (cat === 'stand' && /(stand|cabinet)/i.test(t.before)) s += 4;
    if (cat === 'tank' && /(aquarium|tank)/i.test(t.before) && !/(stand|cabinet)/i.test(t.before.slice(-30))) s += 2;
    if (cat === 'tank' && /(stand|cabinet)/i.test(t.before.slice(-35))) s -= 4;
    s -= i * 0.05; // earlier on the page = more likely the main product
    return { t, s };
  }).sort((x, y) => y.s - x.s);
  return scored[0].t;
}

const tidy = s => String(s || '').replace(/\s+/g, ' ').trim();
const cleanTitle = s => tidy(String(s || '').replace(/\s+[|–—]\s+[^|–—]{2,40}$/, '').replace(/\s+-\s+[^-]{2,30}$/, ''));
function nameFromUrl(url) {
  try { const u = new URL(url); const seg = u.pathname.split('/').filter(Boolean).pop() || u.hostname; return decodeURIComponent(seg).replace(/\.(html?|php|aspx)$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); } catch { return ''; }
}

// ---------- main ----------
function absImg(src, base) {
  if (!src || typeof src !== 'string') return null;
  try { const u = new URL(src.trim(), base || undefined); return /^https?:$/.test(u.protocol) ? u.href : null; } catch { return /^https?:\/\//.test(src) ? src.trim() : null; }
}

export function parseProduct({ url = '', html = '', text = '' } = {}) {
  const st = readStructured(html);
  const rawText = text || htmlToText(html);
  const body = mainText(rawText);
  const firstLines = body.split('\n').slice(0, 8).join(' ');
  const name = tidy(st.name) || tidy(st.h1) || cleanTitle(st.ogTitle) || cleanTitle(st.title) || (text ? tidy(body.split('\n').find(l => l.length > 6 && l.length < 140 && !/^(home|skip|menu|›|basket|cart|sku|regular price|special price|£)/i.test(l))) : '') || nameFromUrl(url) || 'Product';
  const all = [st.description || '', st.props || '', body].join('\n');
  const { cat, sub, info, colour, label } = categorise(name, all);
  const specs = findSpecs(name + '\n' + all);
  const notes = [];

  // price: structured data, else first £ amount near the top
  let price = st.price, currency = st.currency || 'GBP';
  if (price == null) {
    const head = body.slice(0, 1500);
    const pm = [...head.matchAll(/£\s?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/g)].map(m => toNum(m[1].replace(',', '')));
    if (pm.length) price = pm.length > 1 && /special price|sale price|now/i.test(head) ? Math.min(pm[0], pm[1]) : pm[0];
  }

  // size
  let dims = null, estimated = false;
  const triple = pickTriple(findTriples(all), cat);
  if (triple) dims = orientTriple(triple, cat);
  const lab = findLabelled(all);
  if (!dims && (lab.l || lab.w || lab.h)) {
    dims = { l: lab.l || lab.w, w: lab.d || (lab.l && lab.w ? lab.w : null), h: lab.h };
  }
  if (st.dims && !dims) dims = st.dims;
  if (dims && lab.dia && (cat === 'heater' || cat === 'co2' || sub === 'canister')) { dims.l = dims.l || lab.dia; dims.w = dims.w || lab.dia; }

  const item = {
    id: Math.random().toString(36).slice(2, 9),
    url, shop: (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } })(),
    name, cat, sub: sub || null, price: price != null ? +(+price).toFixed(2) : null, currency,
    image: absImg(st.image || st.ogImage, url),
    specs, notes, qty: 1,
  };

  if (cat === 'tank') {
    if (!dims && specs.litres) {
      // estimate from litres with a classic 2:1:1.2 shape
      const v = specs.litres * 1000; const w = Math.cbrt(v / (2 * 1.2)); dims = { l: 2 * w, w, h: 1.2 * w }; estimated = true;
      notes.push('Size worked out from the volume');
    }
    if (dims && !specs.litres) specs.litres = Math.round(dims.l * dims.w * dims.h / 1000);
    item.style = /rimless|opti-?white|ultra ?clear|low iron/i.test(name + firstLines) ? 'rimless' : /curved|flex/i.test(name) ? 'curved' : 'framed';
    item.colour = /white/i.test(name) ? '#f2f2f0' : /oak|wood/i.test(name) ? '#9a7550' : '#1d1f22';
  }
  if (cat === 'stand') item.colour = /white/i.test(name) ? '#f2f2f0' : /oak/i.test(name) ? '#a07a52' : /grey|gray|slate/i.test(name) ? '#5c6166' : /walnut/i.test(name) ? '#5a3d2a' : '#1d1f22';
  if (cat === 'light') {
    item.colour = /white|silver/i.test(name) ? '#d8dadc' : '#202225';
    if (!dims) { const one = all.match(/(\d{2,3})\s*cm\b/); if (one) { dims = { l: toNum(one[1]), w: 9, h: 2 }; estimated = true; } }
  }
  if (cat === 'filter') item.colour = /oase/i.test(name) ? '#cfd3d6' : /eheim/i.test(name) ? '#3a6b8a' : /fluval/i.test(name) ? '#2a2a2a' : '#2d3033';
  if (cat === 'heater') item.colour = '#bfc7cc';
  if (cat === 'substrate') {
    item.colour = colour; item.label = label;
    if (specs.litres) item.bagLitres = specs.litres; else if (specs.kg) item.bagLitres = +(specs.kg / 1.1).toFixed(1);
  }
  if (cat === 'plant') {
    item.plant = { ...info, k: undefined, h: specs.plantHeight || info.h };
    item.qty = specs.qty && specs.qty < 50 ? specs.qty : 1;
  }
  if (cat === 'fish') {
    item.fish = { ...info, k: undefined };
    item.qty = specs.qty && specs.qty < 100 ? specs.qty : 1;
    if (!specs.qty) notes.push('Shops often sell fish singly: set how many you want');
  }
  if (cat === 'rock' || cat === 'wood') {
    item.hs = { ...info, k: undefined };
    item.colour = info.c;
    const range = findRange(all);
    if (cat === 'rock') {
      // turn kg into pieces: one main stone, a couple of supports, some small ones
      const kg = specs.kg || null;
      if (dims) item.pieces = [{ ...dims }];
      else if (kg && !/single|xl piece|one piece|1 piece/i.test(firstLines)) {
        const vol = kg * 1000 / (info.d || 2.5); // cm³
        const shares = kg >= 8 ? [0.3, 0.18, 0.14, 0.1, 0.08, 0.07, 0.07, 0.06] : kg >= 3 ? [0.38, 0.2, 0.15, 0.11, 0.09, 0.07] : [0.5, 0.3, 0.2];
        item.pieces = shares.map(f => { const v = vol * f; const s = Math.cbrt(v / (1.4 * 1 * 0.8 * 0.55)); return { l: +(1.4 * s).toFixed(1), w: +(1 * s).toFixed(1), h: +(0.8 * s * (info.flat ? 0.4 : 1)).toFixed(1) }; });
        notes.push(`${kg}kg is roughly ${item.pieces.length} pieces of ${Math.round(item.pieces[item.pieces.length - 1].l)}–${Math.round(item.pieces[0].l)}cm`);
        estimated = true;
      } else if (range) {
        const n = 4; item.pieces = Array.from({ length: n }, (_, i) => { const L = range.max - (range.max - range.min) * i / (n - 1); return { l: +L.toFixed(1), w: +(L * 0.7).toFixed(1), h: +(L * 0.6).toFixed(1) }; });
        estimated = true; notes.push(`Pieces between ${Math.round(range.min)} and ${Math.round(range.max)}cm`);
      } else { item.pieces = [{ ...DEFAULTS.rock }]; estimated = true; }
      dims = item.pieces[0];
    } else {
      if (!dims && range) { dims = { l: range.max, w: range.max * 0.45, h: range.max * 0.6 }; estimated = true; notes.push(`Piece about ${Math.round(range.max)}cm`); }
      item.woodForm = info.form || 'twiggy';
    }
  }

  if (!dims) {
    const key = cat === 'filter' ? `filter_${sub}` : cat;
    if (DEFAULTS[key]) { dims = { ...DEFAULTS[key] }; estimated = true; }
  }
  if (dims) { for (const k of ['l', 'w', 'h']) if (!dims[k] || isNaN(dims[k])) { dims[k] = (DEFAULTS[cat] || DEFAULTS.ornament)[k]; estimated = true; } }
  item.dims = dims ? { l: +(+dims.l).toFixed(1), w: +(+dims.w).toFixed(1), h: +(+dims.h).toFixed(1) } : null;
  item.estimated = estimated;
  if (estimated && !notes.length && item.dims) notes.push('Size estimated: the page did not list it');
  return item;
}
