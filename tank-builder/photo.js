// Reads a product photo and pulls out what the 3D model can use:
// the item cut out from its background, its main colours, and a square
// patch of real surface (stone grain, bark, wood finish) for texturing.

const cache = new Map();

function load(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.referrerPolicy = 'no-referrer';
    im.decoding = 'async';
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('load'));
    im.src = src;
  });
}

// Try the shop's image directly (many shop image servers allow it), then via our reader.
export function getPhoto(url, api) {
  if (!url) return Promise.resolve(null);
  if (cache.has(url)) return cache.get(url);
  const p = (async () => {
    const tries = [url];
    if (api) tries.push(`${api}/img?url=${encodeURIComponent(url)}`);
    for (const src of tries) {
      try {
        const im = await load(src);
        const a = analyse(im);
        if (a) return a;
      } catch { /* blocked: try the next way */ }
    }
    return null;
  })();
  cache.set(url, p);
  return p;
}

const toHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return { h: 0, s: 0, l };
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : mx === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
  return { h, s, l };
}

export function analyse(im) {
  const W0 = im.naturalWidth, H0 = im.naturalHeight;
  if (!W0 || !H0) return null;
  const k = Math.min(1, 220 / Math.max(W0, H0));
  const w = Math.max(8, Math.round(W0 * k)), h = Math.max(8, Math.round(H0 * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0, w, h);
  let px;
  try { px = x.getImageData(0, 0, w, h).data; } catch { return null; } // shop didn't allow reading pixels
  const at = i => [px[i * 4], px[i * 4 + 1], px[i * 4 + 2], px[i * 4 + 3]];
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

  // 1. background: is the border one plain colour?
  const border = [];
  for (let i = 0; i < w; i++) { border.push(i, (h - 1) * w + i); }
  for (let j = 0; j < h; j++) { border.push(j * w, j * w + w - 1); }
  const bcol = [0, 1, 2].map(ch => { const v = border.map(i => px[i * 4 + ch]).sort((a, b) => a - b); return v[v.length >> 1]; });
  const plain = border.filter(i => px[i * 4 + 3] < 20 || dist(at(i), bcol) < 40).length / border.length;
  const mask = new Uint8Array(w * h).fill(1);
  let fullFrame = plain < 0.55;
  if (!fullFrame) {
    // flood fill from the edges through anything close to the background colour
    const q = new Int32Array(w * h); let qh = 0, qt = 0;
    const isBg = i => px[i * 4 + 3] < 20 || dist(at(i), bcol) < 46;
    for (const i of border) if (mask[i] && isBg(i)) { mask[i] = 0; q[qt++] = i; }
    while (qh < qt) {
      const i = q[qh++]; const cx = i % w, cy = (i / w) | 0;
      const nb = [cx > 0 ? i - 1 : -1, cx < w - 1 ? i + 1 : -1, cy > 0 ? i - w : -1, cy < h - 1 ? i + w : -1];
      for (const n of nb) if (n >= 0 && mask[n] && isBg(n)) { mask[n] = 0; q[qt++] = n; }
    }
  }
  let fg = 0; for (let i = 0; i < mask.length; i++) fg += mask[i];
  if (fg < w * h * 0.03) return null;
  if (fg > w * h * 0.97) fullFrame = true;

  // 2. colours: k-means on the item's pixels
  const samp = []; const step = Math.max(1, Math.floor(fg / 3000));
  for (let i = 0, n = 0; i < mask.length; i++) if (mask[i] && (n++ % step === 0)) samp.push([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]);
  const K = 5; let cent = Array.from({ length: K }, (_, j) => samp[Math.floor((j + 0.5) * samp.length / K)].slice());
  let lab = new Uint8Array(samp.length);
  for (let it = 0; it < 8; it++) {
    for (let s = 0; s < samp.length; s++) { let best = 0, bd = 1e9; for (let j = 0; j < K; j++) { const d = dist(samp[s], cent[j]); if (d < bd) { bd = d; best = j; } } lab[s] = best; }
    const sum = Array.from({ length: K }, () => [0, 0, 0, 0]);
    samp.forEach((p, s) => { const t = sum[lab[s]]; t[0] += p[0]; t[1] += p[1]; t[2] += p[2]; t[3]++; });
    cent = sum.map((t, j) => t[3] ? [t[0] / t[3], t[1] / t[3], t[2] / t[3]] : cent[j]);
  }
  const counts = new Array(K).fill(0); lab.forEach(l => counts[l]++);
  const palette = cent.map((cc, j) => ({ hex: toHex(...cc), share: counts[j] / samp.length, ...hsl(...cc) })).filter(p => p.share > 0.02).sort((a, b) => b.share - a.share);

  // 3. surface patch: the biggest square fully inside the item, nearest the middle
  const integ = new Int32Array((w + 1) * (h + 1));
  for (let j = 0; j < h; j++) { let row = 0; for (let i = 0; i < w; i++) { row += 1 - mask[j * w + i]; integ[(j + 1) * (w + 1) + i + 1] = integ[j * (w + 1) + i + 1] + row; } }
  const holes = (x0, y0, s) => integ[(y0 + s) * (w + 1) + x0 + s] - integ[y0 * (w + 1) + x0 + s] - integ[(y0 + s) * (w + 1) + x0] + integ[y0 * (w + 1) + x0];
  let best = null;
  for (let s = Math.min(w, h); s >= 12 && !best; s = Math.floor(s * 0.88)) {
    const st = Math.max(1, s >> 3); let bd = 1e9;
    for (let y0 = 0; y0 + s <= h; y0 += st) for (let x0 = 0; x0 + s <= w; x0 += st) {
      if (holes(x0, y0, s) > s * s * 0.01) continue;
      const d = Math.hypot(x0 + s / 2 - w / 2, y0 + s / 2 - h / 2);
      if (d < bd) { bd = d; best = { x0, y0, s }; }
    }
  }
  let patch = null;
  if (best) {
    // shave a margin so edges and shadows stay out, then cut it from the full-size photo
    const m = fullFrame ? best.s * 0.15 : best.s * 0.08;
    const sx = (best.x0 + m) / k, sy = (best.y0 + m) / k, ss = (best.s - m * 2) / k;
    if (ss > 24) {
      patch = document.createElement('canvas'); patch.width = patch.height = 256;
      patch.getContext('2d').drawImage(im, sx, sy, ss, ss, 0, 0, 256, 256);
    }
  }

  // 4. the item cut out (for the thumbnail-style preview)
  const cut = document.createElement('canvas'); cut.width = w; cut.height = h;
  const cx2 = cut.getContext('2d'); const id = x.getImageData(0, 0, w, h);
  for (let i = 0; i < mask.length; i++) if (!mask[i]) id.data[i * 4 + 3] = 0;
  cx2.putImageData(id, 0, 0);

  return { palette, main: palette[0]?.hex, patch, patchSize: best ? best.s / Math.max(w, h) : 0, cutout: cut, fullFrame, coverage: fg / (w * h), aspect: w / h };
}

// Leaf colours for plants: ignore pots, rockwool and labels (dull or pale colours).
export function plantColours(a) {
  const leafy = a.palette.filter(p => p.s > 0.18 && p.l > 0.08 && p.l < 0.85);
  if (!leafy.length) return null;
  const green = leafy.find(p => p.h > 0.14 && p.h < 0.5);
  const red = leafy.find(p => (p.h < 0.08 || p.h > 0.88) && p.s > 0.3 && p.share > 0.06);
  if (green && red) return { c: green.hex, tip: red.hex };
  return { c: (green || leafy[0]).hex };
}

// The colour of a piece of equipment or decoration: its biggest colour, skipping glare.
export function bodyColour(a) {
  const p = a.palette.find(p => p.l < 0.92) || a.palette[0];
  return p?.hex;
}
