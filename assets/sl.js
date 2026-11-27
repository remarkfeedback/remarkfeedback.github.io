/* Survive Labs motion engine: shared by every page.
   - [data-in]        adds .is-in when the element scrolls into view (highlighter, pen strokes, notes, rises)
   - [data-scene]     pinned scroll scenes: sets --p (0..1) and calls SL.on(el, fn(p)) handlers
   - [data-count]     counts a number up when it comes into view
   - links            same-site links get a highlighter wipe between pages
*/
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const handlers = new Map();
  const SL = window.SL = { reduce, handlers, on(el, fn) { if (!handlers.has(el)) handlers.set(el, []); handlers.get(el).push(fn); if (window.__slUpdate) window.__slUpdate(); } };

  // measure SVG strokes so they can draw themselves
  const measure = root => root.querySelectorAll('.draw path,.draw line,.draw polyline,.draw ellipse').forEach(p => {
    try { const l = p.getTotalLength(); if (l > 2) p.style.setProperty('--len', Math.ceil(l) + 1); } catch (e) {}
  });

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .35, rootMargin: '0px 0px -8% 0px' });

  // number count-up
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    const el = e.target, to = Number(el.dataset.count), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    if (reduce) { el.textContent = pre + to + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = t => { const k = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = pre + v + suf; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: .6 });

  // pinned scenes
  const scenes = [];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  SL.clamp = clamp;
  SL.seg = (p, a, b) => clamp((p - a) / (b - a)); // progress of p within [a,b]
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    for (const s of scenes) {
      const r = s.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const p = clamp(-r.top / Math.max(1, r.height - vh));
      s.style.setProperty('--p', p.toFixed(4));
      (handlers.get(s) || []).forEach(fn => fn(p, r));
    }
    // header colour follows dark sections
    const nav = document.querySelector('.sl-nav');
    if (nav) {
      const y = 40; let dark = false;
      document.querySelectorAll('[data-dark]').forEach(d => { const r = d.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) dark = true; });
      nav.classList.toggle('on-dark', dark);
    }
  };
  window.__slUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  document.addEventListener('DOMContentLoaded', () => {
    measure(document);
    const reveal = () => document.querySelectorAll('[data-in]').forEach(el => {
      // anything already on screen when the page opens plays straight away
      if (reduce || el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in'); else io.observe(el);
    });
    if (SL.introDone) SL.introDone.then(reveal); else reveal();
    document.querySelectorAll('[data-count]').forEach(el => countIO.observe(el));
    document.querySelectorAll('[data-scene]').forEach(s => scenes.push(s));
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
    // run handlers once more after fonts load (sizes change)
    if (document.fonts) document.fonts.ready.then(() => { measure(document); update(); });
  });

  // ---------- page transition: highlighter wipe ----------
  const wipe = document.createElement('div');
  wipe.className = 'sl-wipe'; wipe.setAttribute('aria-hidden', 'true');
  wipe.innerHTML = '<i></i><i></i><i></i>';
  const arriving = !reduce && sessionStorage.getItem('sl-wipe') === '1';
  sessionStorage.removeItem('sl-wipe');
  if (arriving) wipe.classList.add('cover');
  document.documentElement.appendChild(wipe);
  if (arriving) addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => requestAnimationFrame(() => {
    wipe.classList.remove('cover'); wipe.classList.add('out');
  })));
  addEventListener('pageshow', e => { if (e.persisted) wipe.className = 'sl-wipe'; });

  // ---------- opening moment: once per visit, on the main pages ----------
  let seen = true; try { seen = sessionStorage.getItem('sl-intro') === '1'; sessionStorage.setItem('sl-intro', '1'); } catch (e) {}
  if (!reduce && !arriving && !seen && /^\/(remark\/|themely\/|tools\/)?(index\.html)?$/.test(location.pathname)) {
    const intro = document.createElement('div');
    intro.className = 'sl-intro'; intro.setAttribute('aria-hidden', 'true');
    const wave = y => `M60 ${y} q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V460 H60 Z`;
    intro.innerHTML = `<svg viewBox="70 60 372 380"><defs><clipPath id="slLiq"><path d="M226 214 L150 352 Q138 378 166 380 H346 Q374 378 362 352 L286 214 Z"/></clipPath></defs>
      <path class="ol" d="M190 82 H322 Q348 82 348 110 Q348 136 318 142 V198 L414 360 Q438 410 388 420 H124 Q74 410 98 360 L194 198 V142 Q164 136 164 110 Q164 82 190 82 Z"/>
      <g class="gl"><rect x="186" y="104" width="140" height="36" rx="18"/><path d="M214 140 H298 V206 L384 356 Q398 392 366 396 H146 Q114 392 128 356 L214 206 Z"/></g>
      <g clip-path="url(#slLiq)"><g class="lvl"><path class="wave back" d="${wave(296)}"/><path class="wave" d="${wave(306)}"/></g><circle class="bub" cx="278" cy="252" r="20"/><circle class="bub" cx="236" cy="284" r="13"/><circle class="bub" cx="300" cy="300" r="9"/></g></svg><b>Survive <i>Labs</i></b>`;
    document.documentElement.appendChild(intro);
    let done; SL.introDone = new Promise(r => done = r);
    let ended = false;
    const finish = () => {
      if (ended) return; ended = true;
      wipe.className = 'sl-wipe in';
      setTimeout(() => {
        intro.classList.add('gone'); wipe.className = 'sl-wipe cover'; done();
        requestAnimationFrame(() => requestAnimationFrame(() => { wipe.className = 'sl-wipe out'; }));
      }, 560);
    };
    const t = setTimeout(finish, 1950);
    intro.addEventListener('click', () => { clearTimeout(t); finish(); });
    addEventListener('keydown', () => { clearTimeout(t); finish(); }, { once: true });
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || /\.(pdf|xlsx|zip|png|jpg)$/i.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.hash) return; // same-page anchor
    e.preventDefault();
    sessionStorage.setItem('sl-wipe', '1');
    wipe.className = 'sl-wipe in';
    setTimeout(() => { location.href = url.href; }, 620);
  });
})();
