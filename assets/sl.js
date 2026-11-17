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
    intro.innerHTML = `<svg viewBox="120 260 1010 710"><defs><clipPath id="slLiq"><path d="M630 560L528 790H782L680 560Z"/></clipPath></defs>
      <path class="s" d="M168.0 897.4C168.0 897.0 224.3 807.4 262.1 747.8L276.5 725.0L360.0 725.0C451.2 725.0 449.5 725.1 460.4 719.2C484.6 706.1 486.8 676.4 464.8 661.7C453.0 653.9 451.4 653.7 405.5 652.9C362.4 652.2 359.3 651.9 344.0 646.9C308.3 635.1 276.5 606.2 259.6 570.0C231.3 509.1 247.9 435.6 302.4 380.5C330.9 351.7 368.6 330.1 407.8 319.9C432.2 313.6 416.7 313.9 686.3 313.9C821.6 313.9 932.4 314.1 932.6 314.3C932.9 314.5 913.4 342.2 889.4 375.8L845.8 437.0L641.6 437.3C412.1 437.6 433.1 436.8 416.0 445.3C404.7 450.8 394.4 460.7 389.8 470.6C386.8 476.9 386.5 478.3 386.5 487.0C386.5 495.7 386.8 497.1 389.8 503.2C395.3 514.5 406.8 522.9 422.7 527.2C429.7 529.1 434.2 529.4 468.5 530.0C508.5 530.7 510.1 530.9 523.0 536.0C543.4 544.0 561.2 562.4 565.0 579.5L566.0 584.1L554.2 604.3C547.7 615.4 535.8 635.5 527.8 649.0C519.9 662.5 507.8 683.0 501.0 694.5C494.2 706.0 486.8 718.7 484.5 722.6C478.6 732.3 476.2 738.1 473.9 747.5C464.7 785.9 486.3 826.7 523.9 842.1C528.4 843.9 532.0 845.6 532.0 846.0C532.0 847.4 517.8 862.4 511.4 867.7C492.8 883.2 469.0 893.7 444.7 896.9C436.5 898.0 168.0 898.5 168.0 897.4Z"/><path class="l" d="M520.6 917.3C521.6 915.7 531.3 900.8 542.3 884.0C553.2 867.2 562.9 852.4 563.8 851.1L565.6 848.7L649.5 848.9C742.5 849.0 763.6 848.4 774.5 845.0C820.9 830.4 846.6 779.5 829.3 736.1C827.9 732.5 816.7 711.5 804.5 689.5C792.3 667.5 776.8 639.6 770.0 627.5C748.6 588.8 747.0 585.9 747.0 585.0C747.0 583.1 787.2 481.2 790.0 476.0C791.0 474.2 793.5 474.2 857.7 474.2C894.5 474.2 924.8 474.4 925.1 474.6C925.7 474.9 921.2 489.9 902.2 550.5C887.9 596.4 887.4 597.9 873.7 648.0C851.1 730.2 842.6 762.9 843.5 763.8C843.9 764.2 898.5 764.5 965.0 764.5C1031.5 764.5 1086.1 764.8 1086.5 765.2C1086.9 765.5 1083.6 771.4 1079.2 778.3C1060.7 807.1 1034.0 851.1 1013.0 887.5C1006.0 899.6 999.0 911.8 997.3 914.5L994.4 919.5L756.6 919.8L518.8 920.0L520.6 917.3Z"/>
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
