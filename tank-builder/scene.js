// Tank Builder 3D engine: builds a true-scale scene (1 unit = 1 cm) from parsed items.
import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';

// ---------- seeded randomness so every item looks the same each time ----------
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function noise3(x, y, z, s) { // cheap smooth-ish noise from sines
  return (Math.sin(x * 1.7 + s) * Math.cos(y * 2.3 + s * 1.3) + Math.sin(z * 2.9 + s * 0.7) * Math.cos(x * 1.1 - s) + Math.sin((x + y + z) * 3.7 + s * 2.1) * 0.5) / 2.5;
}

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0, ...o });
const shade = (hex, f) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, f); return c; };

// ---------- geometry builders ----------
export function makeRock(piece, colour, seed, flat) {
  const r = rng(seed);
  const g = new THREE.IcosahedronGeometry(1, 4);
  const p = g.attributes.position; const v = new THREE.Vector3();
  const s = r() * 100;
  const cols = [];
  const base = new THREE.Color(colour);
  // big facets: push vertices along a few random planes for an angular stone look
  const cuts = Array.from({ length: 7 }, () => ({ n: new THREE.Vector3(r() - 0.5, (r() - 0.3) * 0.8, r() - 0.5).normalize(), d: 0.55 + r() * 0.35 }));
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let len = 1 + noise3(v.x * 2, v.y * 2, v.z * 2, s) * 0.18 + noise3(v.x * 6, v.y * 6, v.z * 6, s * 2) * 0.05;
    v.multiplyScalar(len);
    for (const c of cuts) { const dd = v.dot(c.n); if (dd > c.d) v.addScaledVector(c.n, -(dd - c.d) * 0.85); }
    if (v.y < -0.35) v.y = -0.35 + (v.y + 0.35) * 0.15; // flattish base
    p.setXYZ(i, v.x, v.y, v.z);
    const strata = Math.sin(v.y * 18 + noise3(v.x, v.y, v.z, s) * 3) * 0.04;
    const c = base.clone().offsetHSL(0, 0, (v.y + 0.35) * 0.06 + strata + (r() - 0.5) * 0.03);
    cols.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  g.computeBoundingBox();
  const bb = g.boundingBox; const size = new THREE.Vector3(); bb.getSize(size);
  g.translate(0, -bb.min.y, 0);
  g.scale(piece.l / size.x, (flat ? piece.h * 0.5 : piece.h) / size.y, piece.w / size.z);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function makeWood(dims, colour, form, seed) {
  const r = rng(seed);
  const grp = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.9, flatShading: false });
  const thick = form === 'chunky' ? 0.14 : form === 'log' ? 0.22 : 0.06;
  const branchCount = form === 'chunky' ? 3 : form === 'log' ? 0 : 6 + Math.floor(r() * 4);
  const tube = (pts, radius, segs = 24) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, segs, 1, 7, false);
    // taper: shrink rings along the length
    const pos = geo.attributes.position; const n = geo.attributes.normal; const ring = 8;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs; const c = curve.getPointAt(t); const rad = radius * (1 - t * 0.75) * (0.85 + r() * 0.3);
      for (let j = 0; j < ring; j++) {
        const k = i * ring + j; if (k >= pos.count) break;
        const nx = n.getX(k), ny = n.getY(k), nz = n.getZ(k);
        pos.setXYZ(k, c.x + nx * rad, c.y + ny * rad, c.z + nz * rad);
      }
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material); mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
  };
  // unit box: x -0.5..0.5, y 0..1, z -0.5..0.5
  if (form === 'log') {
    grp.add(tube([new THREE.Vector3(-0.5, 0.12, 0), new THREE.Vector3(0, 0.16, 0.05), new THREE.Vector3(0.5, 0.12, -0.02)], 0.2, 12));
  } else {
    const trunk = [new THREE.Vector3(-0.45, 0.02, 0.1), new THREE.Vector3(-0.15, 0.18 + r() * 0.1, 0), new THREE.Vector3(0.1, 0.45 + r() * 0.15, -0.1), new THREE.Vector3(0.3 + r() * 0.1, 0.85 + r() * 0.1, -0.15)];
    grp.add(tube(trunk, thick * 1.2));
    const curve = new THREE.CatmullRomCurve3(trunk);
    for (let b = 0; b < branchCount; b++) {
      const t = 0.25 + r() * 0.65; const s = curve.getPointAt(t);
      const dir = new THREE.Vector3(r() - 0.5, 0.4 + r() * 0.6, r() - 0.5).normalize();
      const L = (0.25 + r() * 0.35) * (1 - t * 0.4);
      const mid = s.clone().addScaledVector(dir, L * 0.5).add(new THREE.Vector3((r() - 0.5) * 0.1, 0, (r() - 0.5) * 0.1));
      const end = s.clone().addScaledVector(dir, L);
      end.x = Math.max(-0.5, Math.min(0.5, end.x)); end.y = Math.min(1, end.y); end.z = Math.max(-0.5, Math.min(0.5, end.z));
      grp.add(tube([s, mid, end], thick * (0.7 - t * 0.3), 10));
    }
  }
  grp.scale.set(dims.l, dims.h, dims.w);
  return grp;
}

const leafGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.5, 0.35, 0, 1); s.quadraticCurveTo(-0.5, 0.35, 0, 0); return new THREE.ShapeGeometry(s, 6); })();
const bladeGeo = (() => { const g = new THREE.PlaneGeometry(1, 1, 1, 4); g.translate(0, 0.5, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) * (1 - y * 0.85)); p.setZ(i, y * y * 0.25); } g.computeVertexNormals(); return g; })();

// A plant clump: radius r (cm) footprint, height h (cm).
export function makePlant(info, radius, seed) {
  const r = rng(seed);
  const grp = new THREE.Group();
  const h = info.h || 15;
  const base = new THREE.Color(info.c || '#3f8a2e');
  const leafMat = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: false, roughness: 0.7, side: THREE.DoubleSide });
  const dummy = new THREE.Object3D();
  const addInst = (geo, n, place, colourFn) => {
    const m = new THREE.InstancedMesh(geo, leafMat.clone(), n);
    for (let i = 0; i < n; i++) { place(dummy, i); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); m.setColorAt(i, colourFn(i)); }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.castShadow = true; grp.add(m); return m;
  };
  const jitter = (c, a = 0.06) => c.clone().offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * a);
  const form = info.form;
  if (form === 'carpet') {
    const n = Math.min(900, Math.round(radius * radius * 3.2));
    addInst(new THREE.SphereGeometry(0.5, 6, 4), n, (d) => { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * radius; d.position.set(Math.cos(a) * rr, r() * h * 0.7, Math.sin(a) * rr); const s = 0.5 + r() * 0.5; d.scale.set(s, s * 0.45, s); d.rotation.set(r(), r() * 6, r()); }, () => jitter(base, 0.12));
  } else if (form === 'grass' || form === 'ribbon') {
    const n = Math.min(500, Math.round(radius * radius * (form === 'ribbon' ? 0.8 : 2.4)) + 10);
    addInst(bladeGeo, n, (d) => { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * radius; d.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); const hh = h * (0.55 + r() * 0.5); d.scale.set(form === 'ribbon' ? 0.9 : 0.25, hh, hh * 0.6); d.rotation.set((r() - 0.5) * 0.3, r() * 6.28, (r() - 0.5) * 0.35); }, () => jitter(base));
  } else if (form === 'stem') {
    const stems = Math.max(4, Math.round(radius * radius * 0.35));
    const tip = info.n && /rotala|ludwigia|alternanthera/i.test(info.n) ? new THREE.Color(info.c) : null;
    const green = tip ? new THREE.Color('#4f9a32') : base;
    const leavesPer = 14;
    const stemData = Array.from({ length: stems }, () => { const a = r() * 6.28, rr = Math.sqrt(r()) * radius; return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, hh: h * (0.6 + r() * 0.45), lean: (r() - 0.5) * 0.15 }; });
    addInst(new THREE.CylinderGeometry(0.12, 0.15, 1, 4), stems, (d, i) => { const s = stemData[i]; d.position.set(s.x, s.hh / 2, s.z); d.scale.set(1, s.hh, 1); d.rotation.set(0, 0, s.lean); }, () => green.clone().offsetHSL(0, 0, -0.1));
    addInst(leafGeo, stems * leavesPer, (d, i) => { const s = stemData[Math.floor(i / leavesPer)]; const k = i % leavesPer; const y = s.hh * (0.15 + 0.85 * k / leavesPer); d.position.set(s.x + Math.sin(s.lean) * -y, y, s.z); const sz = 1.2 + (1 - k / leavesPer) * 0.6; d.scale.set(sz * 0.6, sz, sz); d.rotation.set(-0.9 + r() * 0.3, k * 2.4 + r(), 0); }, (i) => { const k = (i % leavesPer) / leavesPer; return tip ? green.clone().lerp(tip, Math.max(0, k - 0.35) * 1.5) : jitter(base); });
  } else if (form === 'moss') {
    const n = Math.min(260, Math.round(radius * radius * 4) + 20);
    addInst(new THREE.IcosahedronGeometry(0.5, 0), n, (d) => { const a = r() * 6.28, rr = Math.sqrt(r()) * radius; d.position.set(Math.cos(a) * rr, r() * h, Math.sin(a) * rr); const s = 0.6 + r() * 1.1; d.scale.set(s, s * 0.7, s); d.rotation.set(r() * 3, r() * 3, r() * 3); }, () => jitter(base, 0.1));
  } else if (form === 'float') {
    const n = Math.min(200, Math.round(radius * radius * 1.5) + 8);
    addInst(new THREE.CircleGeometry(0.6, 8), n, (d) => { const a = r() * 6.28, rr = Math.sqrt(r()) * radius; d.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); d.rotation.set(-Math.PI / 2, 0, r() * 6); const s = 0.6 + r() * 0.8; d.scale.set(s, s, s); }, () => jitter(base));
  } else if (form === 'ball') {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(h / 2, 2), mat(base, { roughness: 1, flatShading: true })); m.position.y = h / 2; m.castShadow = true; grp.add(m);
  } else { // rosette, fern, sword: leaves radiating from a crown
    const n = form === 'sword' ? 22 : form === 'fern' ? 16 : 12;
    const lw = form === 'sword' ? 0.35 : form === 'fern' ? 0.28 : 0.6;
    addInst(leafGeo, n, (d, i) => { const a = (i / n) * 6.28 + r() * 0.4; const tilt = form === 'sword' ? 0.35 + r() * 0.35 : 0.5 + r() * 0.5; const L = h * (0.55 + r() * 0.5); d.position.set(Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3); d.rotation.set(0, -a + Math.PI / 2, 0); d.rotateX(-(Math.PI / 2 - tilt)); d.scale.set(L * lw, L, L); }, () => jitter(base, 0.1));
  }
  return grp;
}

export function makeFish(info, seed) {
  const r = rng(seed);
  const L = info.len || 4;
  const g = new THREE.Group();
  const c1 = new THREE.Color(info.c?.[0] || '#c0c0c0'), c2 = new THREE.Color(info.c?.[1] || '#888');
  if (info.shrimp) {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(L * 0.12, L * 0.7, 4, 8), mat(c1, { roughness: 0.4 }));
    body.rotation.z = Math.PI / 2; body.rotation.y = 0.2; g.add(body);
    return g;
  }
  if (info.snail) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(L * 0.45, 10, 8), mat(c2, { roughness: 0.5 })); shell.position.y = L * 0.35; g.add(shell);
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(L * 0.18, L * 0.5, 4, 6), mat(c1)); foot.rotation.z = Math.PI / 2; foot.position.y = L * 0.12; g.add(foot);
    return g;
  }
  const tall = info.tall ? 0.95 : 0.36;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), mat(c1, { roughness: 0.35, metalness: 0.15 }));
  body.scale.set(L * 0.8, L * tall, L * (info.tall ? 0.14 : 0.2));
  g.add(body);
  // colour stripe along the side
  const stripe = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 6), new THREE.MeshStandardMaterial({ color: c2, roughness: 0.4, emissive: c2, emissiveIntensity: info.n && /neon|cardinal/i.test(info.n) ? 0.35 : 0.05 }));
  stripe.scale.set(L * 0.55, L * tall * 0.3, L * (info.tall ? 0.15 : 0.21)); stripe.position.set(-L * 0.06, -L * tall * 0.12, 0);
  g.add(stripe);
  const tailShape = new THREE.Shape(); tailShape.moveTo(0, 0); tailShape.lineTo(-L * 0.35, L * tall * 0.45); tailShape.lineTo(-L * 0.3, 0); tailShape.lineTo(-L * 0.35, -L * tall * 0.45); tailShape.lineTo(0, 0);
  const tail = new THREE.Mesh(new THREE.ShapeGeometry(tailShape), new THREE.MeshStandardMaterial({ color: info.n && /betta|guppy|endler/i.test(info.n) ? c2 : c1.clone().offsetHSL(0, 0, -0.05), side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
  tail.position.x = -L * 0.38; g.add(tail);
  g.userData.tail = tail;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(L * 0.05, 6, 4), mat('#111', { roughness: 0.2 })); eye.position.set(L * 0.28, L * tall * 0.08, L * 0.07); g.add(eye);
  const eye2 = eye.clone(); eye2.position.z *= -1; g.add(eye2);
  return g;
}

// ---------- the scene ----------
export class TankScene {
  constructor(canvas, { onSelect, onMoved } = {}) {
    this.canvas = canvas; this.onSelect = onSelect || (() => {}); this.onMoved = onMoved || (() => {});
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = !matchMedia('(max-width: 700px)').matches; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#e9eef0');
    this.camera = new THREE.PerspectiveCamera(38, 1, 1, 5000);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true; this.controls.maxPolarAngle = Math.PI * 0.52; this.controls.minDistance = 25; this.controls.maxDistance = 900;
    // room
    const hemi = new THREE.HemisphereLight('#f4f8ff', '#b9a98f', 0.9); this.scene.add(hemi);
    const sun = this.sun = new THREE.DirectionalLight('#ffffff', 1.3); sun.position.set(80, 220, 160); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 10, far: 600 }); sun.shadow.bias = -0.0008;
    this.scene.add(sun);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), mat('#d9d2c6', { roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.floor = floor; this.scene.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(3000, 1200), mat('#eef1f2', { roughness: 1 })); wall.position.set(0, 600, -120); wall.receiveShadow = true; this.wall = wall; this.scene.add(wall);
    this.world = new THREE.Group(); this.scene.add(this.world);
    this.fish = []; this.movables = []; this.selected = null; this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2();
    this._bindPointer();
    this.resize(); window.addEventListener('resize', () => this.resize());
    new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
    const loop = () => { requestAnimationFrame(loop); this._tick(); }; loop();
  }

  resize() {
    const p = this.canvas.parentElement; const w = p.clientWidth, h = p.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  // Build everything from a layout (see layout() in app.js).
  build(L) {
    this.L = L;
    for (const c of [...this.world.children]) { this.world.remove(c); c.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); }); }
    this.fish = []; this.movables = []; this.selected = null; this.boxHelper = null;
    const { tank, standH } = L;
    const W = this.world;
    const baseY = standH; // tank bottom sits on the stand
    this.baseY = baseY;
    // stand
    if (L.stand) {
      const s = L.stand.dims; const col = L.stand.colour || '#1d1f22';
      const st = new THREE.Mesh(new THREE.BoxGeometry(s.l, s.h, s.w), mat(col, { roughness: 0.6 }));
      st.position.set(0, s.h / 2, 0); st.castShadow = true; st.receiveShadow = true; W.add(st);
      const doorMat = new THREE.LineBasicMaterial({ color: shade(col, -0.12) });
      const pts = [[-s.l / 2 + 1.5, 1.5], [s.l / 2 - 1.5, 1.5], [s.l / 2 - 1.5, s.h - 1.5], [-s.l / 2 + 1.5, s.h - 1.5], [-s.l / 2 + 1.5, 1.5]].map(([x, y]) => new THREE.Vector3(x, y, s.w / 2 + 0.05));
      W.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), doorMat));
      if (s.l > 50) W.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.5, s.w / 2 + 0.05), new THREE.Vector3(0, s.h - 1.5, s.w / 2 + 0.05)]), doorMat));
    }
    // tank shell
    const t = tank.dims; const glass = (tank.specs?.glassMm || (t.l > 90 ? 8 : t.l > 50 ? 6 : 5)) / 10;
    const tg = new THREE.Group(); tg.position.y = baseY; W.add(tg); this.tankGroup = tg;
    const glassMat = new THREE.MeshPhysicalMaterial({ color: tank.style === 'rimless' ? '#eaf6f6' : '#cfe6e8', transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
    const pane = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat); m.position.set(x, y, z); m.renderOrder = 5; tg.add(m); };
    pane(t.l, t.h, glass, 0, t.h / 2, t.w / 2 - glass / 2);
    pane(t.l, t.h, glass, 0, t.h / 2, -t.w / 2 + glass / 2);
    pane(glass, t.h, t.w, -t.l / 2 + glass / 2, t.h / 2, 0);
    pane(glass, t.h, t.w, t.l / 2 - glass / 2, t.h / 2, 0);
    pane(t.l, glass, t.w, 0, glass / 2, 0);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(t.l, t.h, t.w)), new THREE.LineBasicMaterial({ color: tank.style === 'rimless' ? '#a9cdd1' : tank.colour || '#1d1f22', transparent: true, opacity: tank.style === 'rimless' ? 0.9 : 1 }));
    edges.position.y = t.h / 2; tg.add(edges);
    if (tank.style !== 'rimless') {
      const trim = mat(tank.colour || '#1d1f22', { roughness: 0.5 });
      const bot = new THREE.Mesh(new THREE.BoxGeometry(t.l + 0.4, 1.4, t.w + 0.4), trim); bot.position.y = 0.7; bot.castShadow = true; tg.add(bot);
      const fr = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1.4, d), trim); m.position.set(x, t.h - 0.7, z); tg.add(m); };
      fr(t.l + 0.4, 1.3, 0, t.w / 2 - 0.45); fr(t.l + 0.4, 1.3, 0, -t.w / 2 + 0.45); fr(1.3, t.w, -t.l / 2 + 0.45, 0); fr(1.3, t.w, t.l / 2 - 0.45, 0);
    }
    // substrate with a slope (deeper at the back)
    const inL = t.l - glass * 2, inW = t.w - glass * 2;
    this.inner = { l: inL, w: inW, floor: glass, water: t.h - (tank.style === 'rimless' ? 1.5 : 3) };
    const sub = L.substrate;
    this.subHeight = (x, z) => { if (!sub) return glass; const f = (z / inW + 0.5); return glass + sub.front + (sub.back - sub.front) * (1 - f) + noise3(x * 0.05, 0, z * 0.05, 3) * 0.6; };
    if (sub) {
      const sg = new THREE.BoxGeometry(inL, 1, inW, 32, 1, 16); const p = sg.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i); const x = p.getX(i), z = p.getZ(i); p.setY(i, y > 0 ? this.subHeight(x, z) : glass); }
      sg.computeVertexNormals();
      const sm = new THREE.Mesh(sg, mat(sub.colour, { roughness: 1, flatShading: false })); sm.receiveShadow = true; tg.add(sm);
      // speckle layer for texture
      const dots = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.25, 0), mat(shade(sub.colour, 0.08), { roughness: 1 }), Math.min(2500, Math.round(inL * inW * 0.6)));
      const d = new THREE.Object3D(); const rr = rng(7);
      for (let i = 0; i < dots.count; i++) { const x = (rr() - 0.5) * inL, z = (rr() - 0.5) * inW; d.position.set(x, this.subHeight(x, z), z); const s = 0.5 + rr(); d.scale.set(s, s * 0.6, s); d.updateMatrix(); dots.setMatrixAt(i, d.matrix); }
      tg.add(dots);
    }
    // water
    const wh = this.inner.water - glass;
    const water = new THREE.Mesh(new THREE.BoxGeometry(inL - 0.1, wh, inW - 0.1), new THREE.MeshPhysicalMaterial({ color: '#7fcbe0', transparent: true, opacity: 0.12, roughness: 0.1, depthWrite: false }));
    water.position.y = glass + wh / 2; water.renderOrder = 4; tg.add(water);
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(inL, inW), new THREE.MeshStandardMaterial({ color: '#bfe9f2', transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }));
    surf.rotation.x = -Math.PI / 2; surf.position.y = this.inner.water; surf.renderOrder = 6; tg.add(surf);

    // equipment and hardscape
    for (const o of L.objects) this._addObject(o);

    // fish
    const fr = rng(99);
    for (const f of L.fish) {
      for (let i = 0; i < f.count; i++) {
        const m = makeFish(f.info, hashStr(f.id + i));
        const lo = f.info.bottom ? this.subHeight(0, 0) + f.info.len * 0.3 : this.subHeight(0, 0) + 3;
        const hi = f.info.bottom ? lo + 5 : this.inner.water - 2;
        m.position.set((fr() - 0.5) * (inL - 6), lo + fr() * (hi - lo), (fr() - 0.5) * (inW - 6));
        m.userData = { ...m.userData, info: f.info, group: f.id, vel: new THREE.Vector3(fr() - 0.5, 0, fr() - 0.5).normalize().multiplyScalar(f.info.len * 0.9), lo, hi, phase: fr() * 6, tail: m.userData.tail };
        tg.add(m); this.fish.push(m);
      }
    }
    if (!this._framed) { this.view('3d'); this._framed = true; }
  }

  _addObject(o) {
    const tg = this.tankGroup; const t = this.L.tank.dims;
    let m;
    const seed = hashStr(o.key);
    if (o.kind === 'rock') m = makeRock(o.size, o.colour, seed, o.flat);
    else if (o.kind === 'wood') m = makeWood(o.size, o.colour, o.form, seed);
    else if (o.kind === 'plant') m = makePlant(o.plant, o.radius, seed);
    else if (o.kind === 'canister') {
      m = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(o.size.l, o.size.w) / 2, Math.min(o.size.l, o.size.w) / 2 * 1.02, o.size.h * 0.82, 24), mat(o.colour, { roughness: 0.45 }));
      body.position.y = o.size.h * 0.41; body.castShadow = true; m.add(body);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(o.size.l, o.size.w) / 2 * 1.03, Math.min(o.size.l, o.size.w) / 2 * 1.03, o.size.h * 0.18, 24), mat(shade(o.colour, -0.25), { roughness: 0.4 }));
      head.position.y = o.size.h * 0.91; m.add(head);
    } else if (o.kind === 'heater') {
      m = new THREE.Group();
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(o.size.l / 2, o.size.l / 2, o.size.h, 14), new THREE.MeshPhysicalMaterial({ color: '#d7e2e6', roughness: 0.15, transparent: true, opacity: 0.75 }));
      tube.position.y = o.size.h / 2; m.add(tube);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(o.size.l / 2 * 1.1, o.size.l / 2 * 1.1, 3, 14), mat('#2a2d30')); cap.position.y = o.size.h - 1.5; m.add(cap);
      const coil = new THREE.Mesh(new THREE.CylinderGeometry(o.size.l / 2 * 0.5, o.size.l / 2 * 0.5, o.size.h * 0.7, 10), mat('#b8743a', { emissive: '#7a3a10', emissiveIntensity: 0.3 })); coil.position.y = o.size.h * 0.42; m.add(coil);
    } else if (o.kind === 'light') {
      m = new THREE.Group();
      const bar = new THREE.Mesh(new THREE.BoxGeometry(o.size.l, Math.max(1, o.size.h), o.size.w), mat(o.colour, { roughness: 0.35, metalness: 0.4 }));
      bar.castShadow = true; m.add(bar);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(o.size.l * 0.94, o.size.w * 0.6), new THREE.MeshBasicMaterial({ color: '#fffbe8' }));
      glow.rotation.x = Math.PI / 2; glow.position.y = -Math.max(1, o.size.h) / 2 - 0.05; m.add(glow);
      if (o.legs) for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.6, o.legs, o.size.w * 0.6), mat('#9aa0a5', { metalness: 0.6, roughness: 0.3 })); leg.position.set(sx * (Math.min(o.size.l, t.l) / 2 - 0.3), -o.legs / 2, 0); m.add(leg); }
      const lamp = new THREE.SpotLight('#fff6e0', 120000 / Math.max(40, o.size.l), 200, Math.PI / 3.2, 0.6, 1.6); lamp.position.set(0, -1, 0); lamp.target.position.set(0, -100, 0); m.add(lamp); m.add(lamp.target);
    } else if (o.kind === 'box') {
      m = new THREE.Mesh(new THREE.BoxGeometry(o.size.l, o.size.h, o.size.w), mat(o.colour || '#3a3d40', { roughness: 0.5 }));
      m.geometry.translate(0, o.size.h / 2, 0); m.castShadow = true;
    } else if (o.kind === 'ornament') {
      m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 1), mat(o.colour || '#8a7a6a', { flatShading: true, roughness: 0.9 }));
      m.geometry.translate(0, 0.5, 0); m.scale.set(o.size.l, o.size.h, o.size.w); m.castShadow = true;
    }
    if (!m) return;
    // where it lives
    const parent = o.where === 'outside' ? this.world : tg;
    m.position.set(o.x || 0, 0, o.z || 0);
    m.rotation.y = o.ry || 0;
    if (o.tilt) m.rotation.z = o.tilt;
    if (o.where === 'floor') m.position.y = this.subHeight(m.position.x, m.position.z) - (o.sink || 0);
    else if (o.where === 'top') m.position.y = this.L.tank.dims.h + (o.legs || 0) + Math.max(1, o.size.h) / 2 + 0.2;
    else if (o.where === 'back') m.position.y = (o.y != null ? o.y : this.inner.water - o.size.h - 1);
    else if (o.where === 'surface') m.position.y = this.inner.water - 0.2;
    else if (o.where === 'outside') m.position.y = o.y || 0;
    m.userData = { ...m.userData, obj: o, key: o.key };
    parent.add(m);
    if (o.movable !== false) this.movables.push(m);
    if (o.kind === 'canister' && o.hoses) this._hoses(m, o);
    return m;
  }

  _hoses(canister, o) {
    const t = this.L.tank.dims; const tg = this.tankGroup;
    const hoseMat = new THREE.MeshStandardMaterial({ color: '#4a6a55', transparent: true, opacity: 0.75, roughness: 0.3 });
    const top = new THREE.Vector3(canister.position.x, canister.position.y + o.size.h, canister.position.z);
    for (const sx of [-1, 1]) {
      const inX = sx * (t.l / 2 - 6); const back = -t.w / 2;
      const pts = [
        top.clone().add(new THREE.Vector3(sx * 2.5, 0, 0)),
        new THREE.Vector3(top.x + sx * 2.5, top.y + 4, back - 3),
        new THREE.Vector3(top.x - 4 + sx * 2.5, this.baseY - 2, back - 3),
        new THREE.Vector3(inX, this.baseY + t.h * 0.55, back - 3),
        new THREE.Vector3(inX, this.baseY + t.h + 2.5, back - 1.2),
        new THREE.Vector3(inX, this.baseY + t.h + 0.5, back + 1.8),
        new THREE.Vector3(inX, this.baseY + (sx < 0 ? 7 : t.h - 9), back + 1.8)];
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 60, 0.7, 8, false);
      this.world.add(new THREE.Mesh(g, hoseMat));
    }
  }

  view(which) {
    const t = this.L?.tank?.dims || { l: 60, w: 30, h: 36 };
    const cy = this.baseY + t.h / 2;
    const span = Math.max(t.l, t.h * 1.4);
    const dist = span / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) * 1.25 + t.w;
    this.controls.target.set(0, cy, 0);
    if (which === 'front') this.camera.position.set(0, cy + 2, dist);
    else if (which === 'top') this.camera.position.set(0, cy + dist * 1.1, 1);
    else this.camera.position.set(dist * 0.55, cy + dist * 0.32, dist * 0.85);
    this.controls.update();
  }

  // ---------- picking and dragging ----------
  _bindPointer() {
    const c = this.canvas;
    let drag = null;
    const toNDC = e => { const r = c.getBoundingClientRect(); this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
    const rootOf = o => { while (o && !o.userData.obj) o = o.parent; return o; };
    c.addEventListener('pointerdown', e => {
      toNDC(e); this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.movables, true);
      const hit = hits.length ? rootOf(hits[0].object) : null;
      this.select(hit);
      if (hit) {
        const o = hit.userData.obj;
        const parent = hit.parent;
        const worldY = parent.localToWorld(hit.position.clone()).y;
        drag = { m: hit, o, plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldY), start: hit.position.clone(), moved: false, offset: null };
        const p = new THREE.Vector3(); this.raycaster.ray.intersectPlane(drag.plane, p);
        if (p) drag.offset = parent.worldToLocal(p.clone()).sub(hit.position);
        this.controls.enabled = false; c.setPointerCapture(e.pointerId);
      }
    });
    c.addEventListener('pointermove', e => {
      if (!drag) return;
      toNDC(e); this.raycaster.setFromCamera(this.pointer, this.camera);
      const p = new THREE.Vector3(); if (!this.raycaster.ray.intersectPlane(drag.plane, p)) return;
      const local = drag.m.parent.worldToLocal(p.clone()).sub(drag.offset || new THREE.Vector3());
      this._place(drag.m, local.x, local.z); drag.moved = true;
    });
    const end = e => { if (drag) { if (drag.moved) this.onMoved(drag.o, drag.m.position); drag = null; this.controls.enabled = true; } };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  }

  _place(m, x, z) {
    const o = m.userData.obj; const t = this.L.tank.dims;
    const half = Math.max(o.size?.l || 4, o.size?.w || 4) / 2 * (o.kind === 'plant' ? 0.4 : 0.55);
    if (o.where === 'floor' || o.where === 'surface') {
      x = Math.max(-this.inner.l / 2 + half, Math.min(this.inner.l / 2 - half, x));
      z = Math.max(-this.inner.w / 2 + half, Math.min(this.inner.w / 2 - half, z));
      m.position.x = x; m.position.z = z;
      if (o.where === 'floor') m.position.y = this.subHeight(x, z) - (o.sink || 0);
    } else if (o.where === 'back') {
      m.position.x = Math.max(-this.inner.l / 2 + 3, Math.min(this.inner.l / 2 - 3, x));
    } else if (o.where === 'top') {
      m.position.x = Math.max(-t.l / 2, Math.min(t.l / 2, x)); m.position.z = Math.max(-t.w / 2, Math.min(t.w / 2, z));
    } else if (o.where === 'outside') { m.position.x = x; m.position.z = z; }
    if (this.boxHelper) this.boxHelper.update();
  }

  select(m) {
    this.selected = m;
    if (this.boxHelper) { this.scene.remove(this.boxHelper); this.boxHelper.geometry.dispose(); this.boxHelper = null; }
    if (m) { this.boxHelper = new THREE.BoxHelper(m, '#ff7a1a'); this.scene.add(this.boxHelper); }
    this.onSelect(m ? m.userData.obj : null, m);
  }

  rotateSelected(a = Math.PI / 8) { if (!this.selected) return; this.selected.rotation.y += a; this.boxHelper?.update(); this.onMoved(this.selected.userData.obj, this.selected.position, this.selected.rotation.y); }

  screenshot() { this.renderer.render(this.scene, this.camera); return this.canvas.toDataURL('image/png'); }

  // ---------- animation ----------
  _tick() {
    const dt = Math.min(0.05, this.clock.getDelta()); const time = this.clock.elapsedTime;
    if (this.inner) {
      const inL = this.inner.l, inW = this.inner.w;
      const groups = {};
      for (const f of this.fish) { (groups[f.userData.group] ||= []).push(f); }
      for (const [, fl] of Object.entries(groups)) {
        const centre = new THREE.Vector3(); fl.forEach(f => centre.add(f.position)); centre.divideScalar(fl.length);
        for (const f of fl) {
          const u = f.userData; const v = u.vel; const len = u.info.len;
          const speed = len * (u.info.bottom ? 0.6 : 1.3);
          // wander
          v.x += (Math.sin(time * 0.7 + u.phase) * 0.6) * dt * speed; v.z += (Math.cos(time * 0.5 + u.phase * 1.3) * 0.6) * dt * speed;
          v.y += (Math.sin(time * 0.9 + u.phase * 2) * 0.2) * dt * speed;
          if (u.info.school && fl.length > 2) v.addScaledVector(centre.clone().sub(f.position), dt * 0.35);
          // walls
          const m = 3 + len * 0.5;
          if (f.position.x < -inL / 2 + m) v.x += speed * dt * 4; if (f.position.x > inL / 2 - m) v.x -= speed * dt * 4;
          if (f.position.z < -inW / 2 + m) v.z += speed * dt * 4; if (f.position.z > inW / 2 - m) v.z -= speed * dt * 4;
          const floorY = this.subHeight(f.position.x, f.position.z) + len * 0.3;
          const lo = Math.max(u.lo, floorY), hi = u.hi;
          if (f.position.y < lo) v.y += speed * dt * 3; if (f.position.y > hi) v.y -= speed * dt * 3;
          v.y *= 0.96;
          if (v.length() > speed) v.setLength(speed); if (v.length() < speed * 0.3) v.setLength(speed * 0.3);
          f.position.addScaledVector(v, dt);
          f.position.y = Math.max(floorY, Math.min(this.inner.water - 1, f.position.y));
          const yaw = Math.atan2(-v.z, v.x);
          f.rotation.y += ((yaw - f.rotation.y + Math.PI * 3) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 4);
          if (u.tail) u.tail.rotation.y = Math.sin(time * 9 + u.phase) * 0.45;
        }
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
