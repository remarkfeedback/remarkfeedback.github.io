import { parseProduct, PLANTS, FISH, HARDSCAPE } from './parse.js';
import { TankScene, hashStr, rng } from './scene.js';
import { getPhoto, plantColours, bodyColour } from './photo.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const API = (document.querySelector('meta[name="tb-api"]')?.content || '').trim().replace(/\/$/, '');
const KEY = 'tb-build-v1';
const ICON = { tank: '🟦', stand: '🗄️', filter: '🌀', heater: '🌡️', light: '💡', substrate: '🟫', rock: '🪨', wood: '🪵', plant: '🌿', fish: '🐟', ornament: '🏺', co2: '🫧', airpump: '🫧' };
const LABEL = { tank: 'Tank', stand: 'Stand', filter: 'Filter', heater: 'Heater', light: 'Light', substrate: 'Substrate', rock: 'Rock', wood: 'Wood', plant: 'Plant', fish: 'Fish', ornament: 'Decoration', co2: 'CO₂', airpump: 'Air pump' };
const ORDER = ['tank', 'stand', 'light', 'filter', 'heater', 'co2', 'airpump', 'substrate', 'rock', 'wood', 'plant', 'ornament', 'fish'];

let state = { items: [] };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s?.items) state = s; } catch {}
// photo looks, worked out in the browser (not saved: they're recomputed from the photo link)
const photos = new Map();
const look = it => (it && it.image && !it.noPhoto) ? photos.get(it.image) || null : null;
let photoTimer = null;
function ensurePhotos() {
  for (const it of state.items) {
    if (!it.image || it.noPhoto || photos.has(it.image)) continue;
    photos.set(it.image, undefined);
    getPhoto(it.image, API).then(a => { photos.set(it.image, a || null); clearTimeout(photoTimer); photoTimer = setTimeout(() => render(), 120); });
  }
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

// ---------- layout: turn items into a placed scene ----------
function layout() {
  const items = state.items.filter(i => !i.pending);
  const tankItem = items.find(i => i.cat === 'tank');
  const tank = tankItem ? { ...tankItem } : { id: 'virtual', name: 'No tank yet: showing 60cm', dims: { l: 60, w: 30, h: 36 }, style: 'rimless', specs: { litres: 54 }, virtual: true };
  const t = tank.dims;
  const standRaw = items.find(i => i.cat === 'stand');
  const sl = look(standRaw);
  const standItem = standRaw ? { ...standRaw, ...(sl ? { tex: sl.patch, colour: bodyColour(sl) } : {}) } : null;
  const standH = standItem ? standItem.dims.h : 0;
  const glass = 0.6; const inL = t.l - glass * 2, inW = t.w - glass * 2;
  const L = { tank, stand: standItem || null, standH, objects: [], fish: [] };

  const subLitres = items.filter(i => i.cat === 'substrate').reduce((a, i) => a + (i.bagLitres || 0) * (i.qty || 1), 0);
  const subItem = items.find(i => i.cat === 'substrate');
  if (subItem) {
    const avg = Math.max(0.5, Math.min(14, (subLitres || 3) * 1000 / (inL * inW)));
    const su = look(subItem); const loose = su && su.fullFrame; // a photo of the gravel itself, not the bag
    L.substrate = { front: avg * 0.6, back: avg * 1.4, colour: loose ? su.main : subItem.colour || '#9a8f84', tex: loose ? su.patch : null, avg };
  }
  const placed = (item, i, def) => ({ ...def, ...(item.place?.[i] || {}) });
  const skip = (item, i) => item.removed?.includes(i);

  // equipment
  for (const it0 of items) {
    const el = ['light', 'filter', 'co2', 'airpump'].includes(it0.cat) ? look(it0) : null;
    const it = el ? { ...it0, colour: bodyColour(el) } : it0;
    const d = it.dims; if (!d) continue;
    const key = i => `${it.id}:${i}`;
    if (it.cat === 'light') L.objects.push(placed(it, 0, { key: key(0), item: it.id, kind: 'light', size: d, colour: it.colour, where: 'top', x: 0, z: 0, legs: d.l > t.l + 3 ? 6 : 0 }));
    if (it.cat === 'filter') {
      if (it.sub === 'canister') L.objects.push(placed(it, 0, { key: key(0), item: it.id, kind: 'canister', size: d, colour: it.colour, where: 'outside', x: (standItem ? standItem.dims.l / 2 : t.l / 2) + d.l / 2 + 5, z: -t.w / 2 + d.w / 2, y: 0, hoses: true }));
      else if (it.sub === 'sponge') L.objects.push(placed(it, 0, { key: key(0), item: it.id, kind: 'box', size: d, colour: '#2f2f2f', where: 'floor', x: -inL / 2 + d.l / 2 + 1.5, z: -inW / 2 + d.w / 2 + 1.5 }));
      else L.objects.push(placed(it, 0, { key: key(0), item: it.id, kind: 'box', size: d, colour: it.colour, where: 'back', x: -inL / 2 + d.l / 2 + 2, z: -inW / 2 + d.w / 2 + 0.6, y: Math.max(glass + 2, t.h - 3 - d.h - 1) }));
    }
    if (it.cat === 'heater') L.objects.push(placed(it, 0, { key: key(0), item: it.id, kind: 'heater', size: d, where: 'back', x: inL / 2 - 4, z: -inW / 2 + d.l / 2 + 1, y: Math.max(glass + 3, t.h - 3 - d.h - 1) }));
    if (it.cat === 'co2' || it.cat === 'airpump') L.objects.push(placed(it, 0, { key: key(0), item: it.id, kind: 'box', size: d, colour: it.cat === 'co2' ? '#2a2d30' : '#e8e8e8', where: 'outside', x: -((standItem ? standItem.dims.l / 2 : t.l / 2) + d.l / 2 + 8), z: -4, y: 0 }));
  }

  // hardscape: main stone on a third, wood on the other third
  const r = rng(hashStr(items.map(i => i.id).join('')));
  let rockSlot = 0, woodSlot = 0;
  const anchors = [];
  for (const it of items.filter(i => i.cat === 'rock')) {
    const pieces = (it.pieces || [it.dims]).slice().sort((a, b) => b.l * b.h - a.l * a.h);
    const cx = rockSlot === 0 ? -inL / 6 : rockSlot === 1 ? inL / 4 : (r() - 0.5) * inL * 0.6;
    const cz = -inW * 0.08;
    anchors.push({ x: cx, z: cz, r: pieces[0].l });
    pieces.forEach((p, i) => {
      if (skip(it, i)) return;
      const ang = i === 0 ? 0 : i * 2.2 + r() * 0.6;
      const dist = i === 0 ? 0 : pieces[0].l * 0.45 + p.l * 0.5 + i * 1.2;
      const x = Math.max(-inL / 2 + p.l / 2, Math.min(inL / 2 - p.l / 2, cx + Math.cos(ang) * dist));
      const z = Math.max(-inW / 2 + p.w / 2, Math.min(inW / 2 - p.w / 2, cz + Math.sin(ang) * dist * 0.6));
      const lk = look(it);
      L.objects.push(placed(it, i, { key: `${it.id}:${i}`, item: it.id, kind: 'rock', size: p, colour: lk ? bodyColour(lk) : it.colour, tex: lk?.patch, flat: it.hs?.flat, where: 'floor', x, z, ry: r() * 6.28, sink: p.h * 0.12 }));
    });
    rockSlot++;
  }
  for (const it of items.filter(i => i.cat === 'wood')) {
    const n = Math.max(1, it.qty || 1);
    for (let i = 0; i < n; i++) {
      if (skip(it, i)) continue;
      const d = it.dims;
      const x = woodSlot === 0 ? inL / 5 : -inL / 5 + (r() - 0.5) * 10; const z = -inW * 0.12;
      anchors.push({ x, z, r: d.l * 0.5, wood: true });
      const lk = look(it);
      L.objects.push(placed(it, i, { key: `${it.id}:${i}`, item: it.id, kind: 'wood', size: d, colour: lk ? bodyColour(lk) : it.colour, tex: lk?.patch, form: it.woodForm, where: 'floor', x: Math.max(-inL / 2 + d.l * 0.3, Math.min(inL / 2 - d.l * 0.3, x)), z, ry: (r() - 0.5) * 1.2, sink: 1 }));
      woodSlot++;
    }
  }
  for (const it of items.filter(i => i.cat === 'ornament')) {
    if (skip(it, 0)) continue;
    const lk = look(it);
    L.objects.push(placed(it, 0, { key: `${it.id}:0`, item: it.id, kind: 'ornament', size: it.dims, colour: lk ? bodyColour(lk) : it.colour, tex: lk?.patch, where: 'floor', x: (r() - 0.5) * inL * 0.3, z: inW * 0.05 }));
  }

  // plants by zone
  const zoneSlot = { carpet: 0, fore: 0, mid: 0, back: 0, moss: 0, float: 0 };
  for (const it of items.filter(i => i.cat === 'plant')) {
    const pc = look(it) ? plantColours(look(it)) : null;
    const base = { ...(it.plant || { form: 'rosette', h: 15, zone: 'mid', c: '#3f8a2e' }), ...(pc || {}) };
    const room = t.h - 3 - glass - (L.substrate ? L.substrate.back : 0) - 1.5;
    const info = base.zone === 'float' ? base : { ...base, h: Math.min(base.h, room) };
    const n = Math.max(1, Math.min(24, it.qty || 1));
    for (let i = 0; i < n; i++) {
      if (skip(it, i)) continue;
      const k = zoneSlot[info.zone] = (zoneSlot[info.zone] || 0) + 1;
      const pr = rng(hashStr(it.id + i));
      let x, z, radius = 5, where = 'floor';
      if (info.zone === 'carpet') { radius = Math.min(9, Math.sqrt(inL * inW * 0.35 / Math.PI / Math.max(1, n))); x = -inL / 2 + radius + ((k - 1) % 4 + pr() * 0.6) * (inL - radius * 2) / 3.5; z = inW * (0.12 + ((k - 1) % 2) * 0.18) + pr() * 2; }
      else if (info.zone === 'fore') { radius = 3.5; x = (pr() - 0.5) * inL * 0.8; z = inW * 0.3; }
      else if (info.zone === 'mid') { const a = anchors[(k - 1) % Math.max(1, anchors.length)]; radius = 4; if (a) { const ang = pr() * 6.28; x = a.x + Math.cos(ang) * (a.r * 0.55 + 3); z = a.z + Math.abs(Math.sin(ang)) * 5 + 2; } else { x = (pr() - 0.5) * inL * 0.6; z = 0; } }
      else if (info.zone === 'back') { radius = 5; const slots = Math.max(n, 4); x = -inL / 2 + 6 + ((k - 1) % slots + 0.5) * (inL - 12) / slots; z = -inW * 0.34 + pr() * 2; }
      else if (info.zone === 'moss') { const a = anchors.find(a => a.wood) || anchors[0]; radius = 3; x = a ? a.x + (pr() - 0.5) * 8 : 0; z = a ? a.z + 2 : 0; }
      else if (info.zone === 'float') { radius = 7; x = (pr() - 0.5) * inL * 0.6; z = (pr() - 0.5) * inW * 0.5; where = 'surface'; }
      x = Math.max(-inL / 2 + radius * 0.5, Math.min(inL / 2 - radius * 0.5, x)); z = Math.max(-inW / 2 + radius * 0.5, Math.min(inW / 2 - radius * 0.5, z));
      L.objects.push(placed(it, i, { key: `${it.id}:${i}`, item: it.id, kind: 'plant', plant: info, radius, size: { l: radius * 2, w: radius * 2, h: info.h }, where, x, z }));
    }
  }
  for (const it of items.filter(i => i.cat === 'fish')) {
    let info = it.fish || FISH[0]; const fl = look(it);
    if (fl && (!it.fish || it.fish.c?.[0] === '#c0c0c0')) { const sat = fl.palette.slice().sort((a, b) => b.s - a.s)[0]; info = { ...info, c: [bodyColour(fl), sat?.hex || bodyColour(fl)] }; }
    L.fish.push({ id: it.id, info, count: Math.max(0, Math.min(40, it.qty || 1)) });
  }
  return L;
}

// ---------- checks ----------
function checks() {
  const items = state.items.filter(i => !i.pending);
  const out = [];
  const add = (lvl, text) => out.push({ lvl, text });
  const tank = items.find(i => i.cat === 'tank');
  const stand = items.find(i => i.cat === 'stand');
  if (!tank) { add('bad', 'Add a tank link first. Everything else is placed in and around it.'); return out; }
  const t = tank.dims; const litres = tank.specs?.litres || Math.round(t.l * t.w * t.h / 1000);
  const integrated = /flex|kit|set|evo|spec|scaper|all in one|complete/i.test(tank.name);
  if (stand) {
    const s = stand.dims;
    if (t.l > s.l + 1 || t.w > s.w + 1) add('bad', `The tank (${t.l}×${t.w}cm) is bigger than the stand top (${s.l}×${s.w}cm). The base must be fully supported.`);
    else if (s.l > t.l + 15) add('info', `The stand is ${Math.round(s.l - t.l)}cm longer than the tank. Fine, but check you like the look.`);
    else add('ok', 'Tank fits the stand.');
  } else add('warn', 'No stand yet. A full tank this size weighs a lot, so use a proper aquarium stand.');
  const filters = items.filter(i => i.cat === 'filter');
  if (filters.length) {
    const flow = filters.reduce((a, f) => a + (f.specs?.flow || 0), 0);
    const maxTank = Math.max(...filters.map(f => f.specs?.maxTank || 0));
    if (maxTank && maxTank < litres) add('bad', `The filter is rated for up to ${maxTank} litres, but the tank holds about ${litres}.`);
    else if (flow) { const turn = flow / litres; if (turn < 4) add('warn', `Filter turns the water over ${turn.toFixed(1)}× an hour. Most tanks want 5–10×.`); else if (turn > 15 && litres < 80) add('warn', `Filter turns the water over ${turn.toFixed(0)}× an hour. That's a strong current for a small tank.`); else add('ok', `Filter flow is ${turn.toFixed(1)}× the tank volume an hour. That's a good range.`); }
    else add('info', "The filter page didn't list a flow rate, so we can't check it.");
  } else if (!integrated) add('warn', 'No filter yet.');
  else add('ok', 'The tank kit includes a filter.');
  const fish = items.filter(i => i.cat === 'fish');
  const tropical = fish.some(f => !/goldfish/i.test(f.fish?.n || f.name));
  const heaters = items.filter(i => i.cat === 'heater' || (i.cat === 'filter' && /thermo|heater/i.test(i.name)));
  if (heaters.length) {
    const w = Math.max(...heaters.map(h => (h.cat === 'heater' ? h.specs?.watts : Math.max(...(h.specs?.wattsAll || [0]))) || 0));
    if (w) { const wpl = w / litres; if (wpl < 0.6) add('warn', `${w}W of heating for ${litres} litres is on the low side (aim for about 1W per litre).`); else if (wpl > 3) add('info', `${w}W is a big heater for ${litres} litres. Fine with a good thermostat.`); else add('ok', `${w}W heater suits ${litres} litres.`); }
  } else if (tropical) add('warn', 'Tropical fish need a heater, and none is on the list yet.');
  if (fish.some(f => /goldfish/i.test(f.fish?.n || '')) && fish.some(f => !/goldfish/i.test(f.fish?.n || ''))) add('bad', 'Goldfish need cold water. Don\'t mix them with tropical fish.');
  const lights = items.filter(i => i.cat === 'light');
  if (lights.length) { const l = lights[0].dims.l; if (l < t.l * 0.75) add('warn', `The light is ${l}cm long on a ${t.l}cm tank, so the ends will be darker.`); else if (l > t.l + 8) add('info', `The light is ${Math.round(l - t.l)}cm longer than the tank. Check its legs or bracket fit.`); else add('ok', 'Light length suits the tank.'); }
  else if (!integrated) add('info', 'No light yet. Plants need one.');
  const subs = items.filter(i => i.cat === 'substrate');
  if (subs.length) { const lit = subs.reduce((a, s) => a + (s.bagLitres || 0) * (s.qty || 1), 0); const depth = lit * 1000 / (t.l * t.w); if (lit && depth < 3) add('warn', `${lit} litres of substrate gives about ${depth.toFixed(1)}cm depth. Planted tanks usually want 5–7cm: add ${Math.ceil((5 * t.l * t.w / 1000 - lit))} more litres.`); else if (lit && depth > 9) add('warn', `${lit} litres of substrate gives about ${depth.toFixed(1)}cm depth, which is more than most tanks need (5–7cm). You could buy less.`); else if (lit) add('ok', `${lit} litres of substrate gives about ${depth.toFixed(1)}cm average depth.`); }
  else if (items.some(i => i.cat === 'plant' && i.plant?.zone !== 'float' && i.plant?.zone !== 'moss')) add('warn', 'Rooted plants need substrate, and none is on the list yet.');
  const water = t.h - 3;
  for (const h of items.filter(i => i.cat === 'rock' || i.cat === 'wood')) { const tall = Math.max(...(h.pieces || [h.dims]).map(p => p.h)); const long = Math.max(...(h.pieces || [h.dims]).map(p => p.l)); if (tall > water) add('warn', `${h.name}: a piece is ${tall}cm tall, taller than the water (${water}cm).`); if (long > t.l - 2) add('bad', `${h.name}: ${long}cm long won't fit a ${t.l}cm tank.`); }
  if (fish.length) {
    const cm = fish.reduce((a, f) => a + (f.fish?.len || 4) * (f.qty || 1) * (f.fish?.shrimp || f.fish?.snail ? 0.3 : 1), 0);
    const ratio = cm / litres;
    if (ratio > 1) add('bad', `About ${Math.round(cm)}cm of adult fish in ${litres} litres is overstocked (rule of thumb: under 1cm per litre).`);
    else if (ratio > 0.7) add('warn', `About ${Math.round(cm)}cm of adult fish in ${litres} litres is on the busy side.`);
    else add('ok', `Stocking looks comfortable: about ${Math.round(cm)}cm of adult fish in ${litres} litres.`);
    for (const f of fish) { const len = f.fish?.len || 4; if (len * 5 > t.l) add('bad', `${f.fish?.n || f.name} grow to about ${len}cm and need a tank at least ${Math.round(len * 5)}cm long.`); if (f.fish?.school && (f.qty || 1) < 6) add('warn', `${f.fish?.n || f.name} are happier in groups of 6 or more.`); }
  }
  const kg = Math.round(litres * 1.0 + (subs.reduce((a, s) => a + (s.bagLitres || 0) * (s.qty || 1), 0)) * 1.3 + items.filter(i => i.cat === 'rock').reduce((a, r) => a + (r.specs?.kg || 2), 0) + t.l * t.w * 0.02);
  add('info', `Full, this setup weighs roughly ${kg}kg.`);
  return out;
}

// ---------- money ----------
function lineCost(i) {
  if (i.price == null) return null;
  if (i.cat === 'fish') { const pack = i.specs?.qty || 1; return i.price * Math.ceil((i.qty || 1) / pack); }
  if (i.cat === 'plant' || i.cat === 'substrate' || i.cat === 'wood') return i.price * (i.qty || 1);
  return i.price;
}

// ---------- UI ----------
const scene = new TankScene($('c'), {
  onSelect: (o) => {
    const bar = $('selbar');
    if (!o) { bar.hidden = true; return; }
    const it = state.items.find(i => i.id === o.item);
    $('selname').textContent = it ? it.name : 'Selected';
    $('selsize').textContent = o.size ? `${Math.round(o.size.l)}×${Math.round(o.size.w)}×${Math.round(o.size.h)} cm` : '';
    bar.hidden = false;
  },
  onMoved: (o, pos, ry) => {
    const it = state.items.find(i => i.id === o.item); if (!it) return;
    const idx = +o.key.split(':')[1];
    it.place = it.place || {}; it.place[idx] = { ...(it.place[idx] || {}), x: +pos.x.toFixed(1), z: +pos.z.toFixed(1), ...(ry != null ? { ry: +ry.toFixed(3) } : {}) };
    save();
  },
});

function render(rebuild = true) {
  ensurePhotos();
  if (rebuild) scene.build(layout());
  const items = state.items.slice().sort((a, b) => ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat));
  $('empty').hidden = state.items.length > 0;
  $('listH').hidden = !state.items.length;
  $('list').innerHTML = items.map(card).join('');
  const ws = checks();
  $('checks').innerHTML = ws.map(w => `<li class="${w.lvl}">${esc(w.text)}</li>`).join('');
  $('checksWrap').hidden = !state.items.length;
  const priced = state.items.filter(i => !i.pending);
  const total = priced.reduce((a, i) => a + (lineCost(i) || 0), 0);
  const unknown = priced.filter(i => i.price == null).length;
  $('total').innerHTML = state.items.length ? `<b>£${total.toFixed(2)}</b><span>${priced.length} item${priced.length === 1 ? '' : 's'}${unknown ? ` · ${unknown} without a price` : ''}</span>` : '';
  const tank = state.items.find(i => i.cat === 'tank');
  $('tankLabel').textContent = tank ? `${tank.name} · ${tank.dims.l}×${tank.dims.w}×${tank.dims.h}cm · ${tank.specs?.litres || ''}L` : 'Example size: 60×30×36cm until you add a tank';
  save();
}

function card(i) {
  if (i.pending) {
    return `<li class="item pending" data-id="${i.id}"><div class="ic">⏳</div><div class="bd"><b>${esc(i.shop || 'Product')}</b>
      <span class="sub">${i.error ? esc(i.error) : 'Reading page…'}</span>
      ${i.error ? `<details class="paste" open><summary>Paste the page instead</summary><p class="hint">Open the <a href="${esc(i.url)}" target="_blank" rel="noopener">product page</a>, select all (Ctrl+A or ⌘A), copy, then paste here.</p><textarea data-paste="${i.id}" rows="3" placeholder="Paste the product page text"></textarea><button type="button" class="btn sm" data-readpaste="${i.id}">Read it</button></details>` : ''}
      </div><button class="x" data-del="${i.id}" aria-label="Remove">×</button></li>`;
  }
  const d = i.dims;
  const size = d ? `${d.l}×${d.w}×${d.h}cm` : '';
  const spec = [i.specs?.litres && i.cat === 'tank' ? `${i.specs.litres}L` : '', i.specs?.flow ? `${i.specs.flow} l/h` : '', i.specs?.maxTank ? `up to ${i.specs.maxTank}L` : '', i.cat === 'heater' && i.specs?.watts ? `${i.specs.watts}W` : '', i.cat === 'light' && i.specs?.watts ? `${i.specs.watts}W` : '', i.cat === 'substrate' && i.bagLitres ? `${i.bagLitres}L bag` : '', i.cat === 'rock' && i.specs?.kg ? `${i.specs.kg}kg` : '', i.cat === 'rock' && i.pieces?.length > 1 ? `${i.pieces.length} pieces` : '', i.cat === 'plant' && i.plant ? `${i.plant.zone === 'back' ? 'background' : i.plant.zone === 'mid' ? 'midground' : i.plant.zone === 'fore' ? 'foreground' : i.plant.zone}, ~${i.plant.h}cm` : '', i.cat === 'fish' && i.fish ? `${i.fish.len}cm adult` : ''].filter(Boolean).join(' · ');
  const qtyable = ['fish', 'plant', 'substrate', 'wood'].includes(i.cat);
  const cost = lineCost(i);
  const ph = i.image ? photos.get(i.image) : undefined;
  const lookNote = !i.image ? '' : i.noPhoto ? '<em class="pl off">photo look off</em>' : ph ? '<em class="pl">📷 real look</em>' : ph === null ? '<em class="pl off" title="The shop didn\'t let us read the photo, so colours are estimated">photo blocked</em>' : '';
  const icon = i.image ? `<img class="thumb" src="${esc(i.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(document.createTextNode('${ICON[i.cat] || '•'}'))">` : (ICON[i.cat] || '•');
  return `<li class="item" data-id="${i.id}"><div class="ic" title="${LABEL[i.cat]}">${icon}</div><div class="bd">
    <b>${i.url ? `<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.name)}</a>` : esc(i.name)}</b>
    <span class="sub">${esc(LABEL[i.cat])}${i.shop ? ' · ' + esc(i.shop) : ''}${size ? ' · ' + size : ''}${i.estimated ? ' <em class="est" title="The page didn\'t list this, so we estimated it">estimated</em>' : ''} ${lookNote}</span>
    ${spec ? `<span class="spec">${esc(spec)}</span>` : ''}
    ${i.notes?.length ? `<span class="note">${esc(i.notes[0])}</span>` : ''}
    <div class="row">
      ${qtyable ? `<span class="qty"><button type="button" data-q="-1" data-id="${i.id}" aria-label="Fewer">−</button><span>${i.qty || 1}${i.cat === 'fish' ? ' fish' : i.cat === 'plant' ? ' pot' + ((i.qty || 1) > 1 ? 's' : '') : ''}</span><button type="button" data-q="1" data-id="${i.id}" aria-label="More">+</button></span>` : ''}
      <span class="price">${cost != null ? '£' + cost.toFixed(2) : '<span class="muted">no price</span>'}</span>
      <button type="button" class="link" data-edit="${i.id}">Edit</button>
    </div>
    <div class="edit" id="edit-${i.id}" hidden>
      <label>Type <select data-cat="${i.id}">${ORDER.map(c => `<option value="${c}" ${c === i.cat ? 'selected' : ''}>${LABEL[c]}</option>`).join('')}</select></label>
      ${d ? `<label>Length <input type="number" step="0.5" min="1" value="${d.l}" data-dim="l" data-id="${i.id}">cm</label><label>Depth <input type="number" step="0.5" min="1" value="${d.w}" data-dim="w" data-id="${i.id}">cm</label><label>Height <input type="number" step="0.5" min="0.5" value="${d.h}" data-dim="h" data-id="${i.id}">cm</label>` : ''}
      <label>Price £<input type="number" step="0.01" min="0" value="${i.price ?? ''}" data-price="${i.id}"></label>
      <label class="wide">Photo link <input type="url" placeholder="Right-click the product photo, Copy image address" value="${esc(i.image || '')}" data-img="${i.id}"></label>
      ${i.image ? `<label class="chk"><input type="checkbox" data-usephoto="${i.id}" ${i.noPhoto ? '' : 'checked'}> Use the photo's colours and texture</label>` : ''}
      <button type="button" class="link danger" data-del="${i.id}">Remove from build</button>
    </div>
  </div><button class="x" data-del="${i.id}" aria-label="Remove ${esc(i.name)}">×</button></li>`;
}

// ---------- adding products ----------
function addParsed(item) {
  if (item.cat === 'tank') state.items = state.items.filter(i => i.cat !== 'tank'); // one tank per build
  if (item.cat === 'stand') state.items = state.items.filter(i => i.cat !== 'stand');
  if (item.cat === 'fish' && item.fish?.school && (!item.qty || item.qty < 6) && !item.specs?.qty) item.qty = 8;
  if (item.cat === 'plant' && (item.plant?.zone === 'carpet') && (!item.qty || item.qty < 3)) item.qty = 4;
  if (item.cat === 'plant' && item.plant?.zone === 'back' && (!item.qty || item.qty < 2)) item.qty = 3;
  state.items.push(item);
}

async function readUrl(url) {
  const pid = 'p' + Math.random().toString(36).slice(2, 8);
  let shop = ''; try { shop = new URL(url).hostname.replace(/^www\./, ''); } catch {}
  state.items.push({ id: pid, pending: true, url, shop });
  render(false);
  try {
    if (!API) throw new Error('nolive');
    const r = await fetch(`${API}/read?url=${encodeURIComponent(url)}`);
    const j = await r.json();
    if (!r.ok || !j.item) throw new Error(j.error || 'blocked');
    state.items = state.items.filter(i => i.id !== pid);
    addParsed(j.item);
    render();
  } catch (e) {
    const p = state.items.find(i => i.id === pid);
    if (p) p.error = e.message === 'nolive' ? "Automatic link reading isn't switched on yet." : `${shop || 'This shop'} didn't let us read the page automatically.`;
    render(false);
  }
}

function readPasted(text, url = '', replaceId = null) {
  const item = parseProduct({ url, text });
  if (replaceId) state.items = state.items.filter(i => i.id !== replaceId);
  addParsed(item);
  render();
  return item;
}

$('addLinks').addEventListener('click', async () => {
  const urls = $('links').value.split(/\s+/).map(s => s.trim()).filter(s => /^https?:\/\//i.test(s));
  if (!urls.length) { $('linksMsg').textContent = 'Paste at least one product link starting with https://'; return; }
  $('linksMsg').textContent = ''; $('links').value = '';
  for (const u of urls) await readUrl(u);
});
$('addText').addEventListener('click', () => {
  const t = $('pasteText').value.trim(); if (t.length < 20) { $('pasteMsg').textContent = 'Paste the whole product page text (select all, copy, paste).'; return; }
  const it = readPasted(t, $('pasteUrl').value.trim());
  $('pasteText').value = ''; $('pasteUrl').value = '';
  $('pasteMsg').textContent = `Added: ${it.name} (${LABEL[it.cat]})`;
});
$('addManual').addEventListener('click', () => {
  const cat = $('mCat').value, name = $('mName').value.trim() || LABEL[cat];
  const l = +$('mL').value, w = +$('mW').value, h = +$('mH').value;
  const fake = `${name}\n${l && w && h ? `Dimensions (L x W x H): ${l} x ${w} x ${h} cm` : ''}\n${$('mPrice').value ? '£' + $('mPrice').value : ''}`;
  const it = parseProduct({ text: fake });
  it.cat = cat; if (l && w && h) { it.dims = { l, w, h }; it.estimated = false; it.notes = []; }
  if (cat === 'rock' && l && w && h) it.pieces = [{ l, w, h }];
  if (cat === 'rock' && !it.hs) { it.hs = HARDSCAPE.find(x => x.type === 'rock' && x.k.test(name.toLowerCase())) || { c: '#8a8d88', d: 2.5 }; it.colour = it.hs.c; }
  if (cat === 'wood' && !it.hs) { it.colour = '#7a5a3a'; it.woodForm = 'twiggy'; }
  if (cat === 'plant' && !it.plant) it.plant = { ...(PLANTS.find(p => p.k.test(name.toLowerCase())) || { n: name, zone: 'mid', h: 15, form: 'rosette', c: '#3f8a2e' }), k: undefined };
  if (cat === 'fish' && !it.fish) it.fish = { ...(FISH.find(f => f.k.test(name.toLowerCase())) || { n: name, len: 4, c: ['#c0c0c0', '#888'], school: true }), k: undefined };
  if (cat === 'tank') { it.style = 'rimless'; it.specs.litres = Math.round(l * w * h / 1000) || it.specs.litres; }
  if (cat === 'substrate') { it.colour = '#9a8f84'; it.bagLitres = it.bagLitres || 5; }
  addParsed(it); render();
  $('mName').value = ''; $('mL').value = $('mW').value = $('mH').value = $('mPrice').value = '';
});

// list interactions
$('list').addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.del) { state.items = state.items.filter(i => i.id !== t.dataset.del); render(); return; }
  if (t.dataset.q) { const it = state.items.find(i => i.id === t.dataset.id); it.qty = Math.max(1, Math.min(99, (it.qty || 1) + +t.dataset.q)); it.removed = []; render(); return; }
  if (t.dataset.edit) { const el = $('edit-' + t.dataset.edit); el.hidden = !el.hidden; return; }
  if (t.dataset.readpaste) { const ta = document.querySelector(`[data-paste="${t.dataset.readpaste}"]`); const p = state.items.find(i => i.id === t.dataset.readpaste); if (ta.value.trim().length > 20) readPasted(ta.value, p?.url || '', p?.id); }
});
$('list').addEventListener('change', e => {
  const el = e.target; const id = el.dataset.id || el.dataset.cat || el.dataset.price || el.dataset.img || el.dataset.usephoto; const it = state.items.find(i => i.id === id); if (!it) return;
  if (el.dataset.img) { const v = el.value.trim(); it.image = /^https?:\/\//i.test(v) ? v : null; }
  if (el.dataset.usephoto) it.noPhoto = !el.checked;
  if (el.dataset.dim) { it.dims[el.dataset.dim] = Math.max(0.5, +el.value || it.dims[el.dataset.dim]); it.estimated = false; if (it.cat === 'rock') it.pieces = [{ ...it.dims }]; if (it.cat === 'tank') it.specs.litres = Math.round(it.dims.l * it.dims.w * it.dims.h / 1000); it.place = {}; }
  if (el.dataset.cat) { const re = parseProduct({ url: it.url, text: it.name }); it.cat = el.dataset.cat; Object.assign(it, { plant: it.plant || (it.cat === 'plant' ? { n: it.name, zone: 'mid', h: 15, form: 'rosette', c: '#3f8a2e' } : undefined), fish: it.fish || (it.cat === 'fish' ? { n: it.name, len: 4, c: ['#c0c0c0', '#888'], school: true } : undefined), colour: it.colour || re.colour || '#8a8d88' }); if (it.cat === 'rock' && !it.pieces) it.pieces = [{ ...it.dims }]; if (it.cat === 'tank') it.style = it.style || 'rimless'; }
  if (el.dataset.price != null && el.dataset.price !== undefined && el.matches('[data-price]')) it.price = el.value === '' ? null : +(+el.value).toFixed(2);
  render();
});

// selection bar
$('rot').addEventListener('click', () => scene.rotateSelected());
$('delpiece').addEventListener('click', () => {
  const m = scene.selected; if (!m) return; const o = m.userData.obj; const it = state.items.find(i => i.id === o.item); if (!it) return;
  const idx = +o.key.split(':')[1];
  if (['rock', 'plant', 'wood'].includes(it.cat) && ((it.pieces?.length || it.qty || 1) > 1)) { it.removed = [...new Set([...(it.removed || []), idx])]; }
  else state.items = state.items.filter(i => i.id !== it.id);
  scene.select(null); render();
});
$('desel').addEventListener('click', () => scene.select(null));
window.addEventListener('keydown', e => { if (e.target.matches('input,textarea,select')) return; if (e.key === 'r' || e.key === 'R') scene.rotateSelected(); if (e.key === 'Escape') scene.select(null); if ((e.key === 'Delete' || e.key === 'Backspace') && scene.selected) $('delpiece').click(); });

// views and tools
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => scene.view(b.dataset.view)));
$('relayout').addEventListener('click', () => { state.items.forEach(i => { i.place = {}; i.removed = []; }); render(); });
$('clear').addEventListener('click', () => { if (!state.items.length) return; state.items = []; scene._framed = false; render(); $('status').textContent = 'Cleared. Paste some links to start again.'; });
$('snap').addEventListener('click', () => { const a = document.createElement('a'); a.href = scene.screenshot(); a.download = 'my-tank-plan.png'; document.body.appendChild(a); a.click(); a.remove(); });

// share link: compact state in the address
async function pack(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (window.CompressionStream) { const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw')); const buf = new Uint8Array(await new Response(cs).arrayBuffer()); return 'z' + btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  return 'j' + btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function unpack(s) {
  const b64 = s.slice(1).replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(b64);
  if (s[0] === 'z') { const bytes = Uint8Array.from(bin, c => c.charCodeAt(0)); const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return JSON.parse(await new Response(ds).text()); }
  return JSON.parse(decodeURIComponent(escape(bin)));
}
$('share').addEventListener('click', async () => {
  const slim = state.items.filter(i => !i.pending).map(({ notes, image, ...rest }) => rest);
  const code = await pack({ v: 1, items: slim });
  const url = `${location.origin}${location.pathname}#b=${code}`;
  try { await navigator.clipboard.writeText(url); $('status').textContent = 'Share link copied. Anyone with it sees this exact build.'; }
  catch { prompt('Copy your share link:', url); }
});

// "Add from shop" bookmarklet handshake (desktop): the shop page sends us its own data
window.addEventListener('message', e => {
  const d = e.data; if (!d || d.tb !== 1 || typeof d.text !== 'string') return;
  const item = parseProduct({ url: String(d.url || ''), html: String(d.html || ''), text: String(d.text || '') });
  addParsed(item); render();
  $('status').textContent = `Added from the shop page: ${item.name}`;
});
function announceReady() { if (window.opener && /from-shop/.test(location.hash)) { try { window.opener.postMessage('tb-ready', '*'); } catch {} } }
window.addEventListener('hashchange', announceReady);
const bm = `javascript:(()=>{const d=document,q=s=>[...d.querySelectorAll(s)].map(x=>x.outerHTML).join('');const html='<html><head><title>'+d.title.replace(/</g,'')+'</title>'+q('meta[property],meta[name]')+q('script[type=\\'application/ld+json\\']')+'</head><body>'+q('h1')+'</body></html>';const w=window.open('${location.origin}${location.pathname}#from-shop','tankbuilder');const f=e=>{if(e.data==='tb-ready'){w.postMessage({tb:1,url:location.href,html,text:d.body.innerText.slice(0,40000)},'${location.origin}');removeEventListener('message',f)}};addEventListener('message',f)})()`;
$('bookmarklet').setAttribute('href', bm);

// example build from real UK product pages
const EXAMPLE = [
  { url: 'https://www.ukaquascaping.example/60cm-rimless-optiwhite-aquarium', text: 'Rimless Optiwhite Aquarium 60cm (54L)\n£119.99\nUltra clear low iron glass, 6mm glass\nDimensions (L x W x H): 60 x 30 x 36 cm' },
  { url: 'https://www.ukaquascaping.example/60cm-aquarium-cabinet-oak', text: 'Aquarium Cabinet Stand Oak 60cm\n£149.99\nStand dimensions (L x W x H) 61 x 31 x 72 cm' },
  { url: 'https://finestaquatics.co.uk/products/oase-biomaster-250-external-filter', text: 'Oase BioMaster 250 External Filter\n£209.99\nMax Suitable Aquarium Volume: 250 Litres\nDimensions (mm): 240L x 240W x 370H\nMax Flow Rate: 900 l/h' },
  { url: 'https://www.ukaquascaping.example/chihiros-wrgb2-60', text: 'Chihiros WRGB II 60 LED Light\n£159.99\nSuitable for tanks 60-75cm. Dimensions: 60 x 10 x 1.5 cm. Power 54W' },
  { url: 'https://www.completeaquatics.co.uk/fluval-t-series-t100-heater', text: 'Fluval T-Series T100 Heater\n£26.99\n100W heater for aquariums up to 120 litres. Dimensions 3.5 x 3.5 x 27cm' },
  { url: 'https://www.ukaquascaping.example/ada-aqua-soil-amazonia-9l', text: 'ADA Aqua Soil Amazonia 9L\n£36.00', qty: 1 },
  { url: 'https://aquaessentials.co.uk/products/mini-landscape-rock-seiryu-stone-per-kg', text: 'Mini Landscape Rock (Seiryu Stone)\nRegular price\n£19.99\nSIZE\n5kg (25L tank)\nAdd to cart' },
  { url: 'https://www.ukaquascaping.example/spider-wood-medium', text: 'Spider Wood - Medium\n£12.99\nApprox. 25-35cm in length. Each piece is unique.' },
  { url: 'https://www.completeaquatics.co.uk/tropica-1-2-grow-monte-carlo', text: 'Tropica 1-2-Grow Monte Carlo\n£5.99\nCarpeting foreground plant', qty: 6 },
  { url: 'https://www.completeaquatics.co.uk/tropica-1-2-grow-rotala-rotundifolia', text: 'Tropica 1-2-Grow Rotala rotundifolia\n£5.99\nHeight: 15-30 cm. Stem plant for the background.', qty: 4 },
  { url: 'https://www.completeaquatics.co.uk/tropica-anubias-nana', text: 'Tropica Anubias barteri var. nana\n£8.99', qty: 2 },
  { url: 'https://www.completeaquatics.co.uk/tropica-java-moss', text: 'Tropica 1-2-Grow Java Moss\n£5.99', qty: 2 },
  { url: 'https://www.ukaquascaping.example/neon-tetra', text: 'Neon Tetra (Paracheirodon innesi)\n£1.99 each', qty: 12 },
  { url: 'https://www.ukaquascaping.example/amano-shrimp', text: 'Amano Shrimp (Caridina multidentata)\n£3.49 each', qty: 5 },
];
$('example').addEventListener('click', () => {
  state.items = [];
  for (const e of EXAMPLE) { const it = parseProduct({ url: e.url, text: e.text }); if (e.qty) it.qty = e.qty; if (/\.example\//.test(e.url)) { it.url = ''; it.shop = ''; } addParsed(it); if (e.qty) it.qty = e.qty; }
  scene._framed = false; render();
  $('status').textContent = 'Example: a 60cm planted tank. Drag rocks, wood and plants to rearrange.';
});

// ---------- start ----------
(async () => {
  const m = location.hash.match(/#b=([\w-]+)/);
  if (m) { try { const s = await unpack(m[1]); if (s?.items) { state.items = s.items; $('status').textContent = 'Showing a shared build. Your changes stay on this device.'; } } catch { $('status').textContent = "That share link didn't work."; } history.replaceState(null, '', location.pathname); }
  if (!API) document.body.classList.add('no-api');
  render();
  announceReady();
})();
