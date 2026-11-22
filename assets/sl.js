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
    const poly = "M606 506V590L492 782Q486 818 520 818H790Q824 818 818 782L704 590V506";
    const wave = y => `M380 ${y} q40 -18 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 V900 H380 Z`;
    intro.innerHTML = `<svg viewBox="440 420 430 440"><defs><clipPath id="slLiq"><path d="M630 560L528 790H782L680 560Z"/></clipPath></defs>
      <g class="fl"><path class="key" d="${poly}"/><rect class="keyr" x="546" y="456" width="218" height="72" rx="36"/><path class="body" d="${poly}"/><rect class="bodyr" x="566" y="476" width="178" height="40" rx="20"/>
      <g clip-path="url(#slLiq)"><g class="lvl"><path class="wave back" d="${wave(712)}"/><path class="wave" d="${wave(722)}"/></g><circle class="bub" cx="668" cy="700" r="17"/><circle class="bub" cx="636" cy="730" r="12"/><circle class="bub" cx="700" cy="720" r="9"/></g></g></svg><b>Survive <i>Labs</i></b>`;
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
    const t = setTimeout(finish, 1750);
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
