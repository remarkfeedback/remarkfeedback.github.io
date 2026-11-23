/* Doorman site motion. Everything here is decoration on top of a page that already reads fine without it.
   If someone has asked their device for less motion, it all shows in its finished state straight away. */
{
  const root = document.documentElement;
  root.classList.remove('js-off');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) root.classList.add('calm');

  // 0. Opening moment (once per visit, home page only): the shield draws itself, the Doorman steps in,
  //    his glasses catch the light, the rope unhooks and the doors open onto the site.
  let introDone = Promise.resolve();
  let seen = false; // if the browser won't remember, show it (it's short and can be skipped with a click)
  try { seen = sessionStorage.getItem('dm-intro') === '1'; sessionStorage.setItem('dm-intro', '1'); } catch (e) { }
  if (!calm && !seen && document.querySelector('.hero')) {
    const intro = document.createElement('div');
    intro.className = 'dm-intro'; intro.setAttribute('aria-hidden', 'true');
    intro.innerHTML = `<div class="door l"></div><div class="door r"></div>
      <div class="stagebox">
        <div class="crest">
          <svg class="outline" viewBox="0 0 1085 1085"><path class="sh-line" pathLength="1" d="M542.0 1074.5 L494.0 1047.5 L444.0 1014.5 L396.0 978.5 L358.0 946.5 L322.5 913.0 L281.5 869.0 L245.5 824.0 L218.5 784.0 L188.5 730.0 L173.5 698.0 L149.5 627.0 L136.5 571.0 L125.5 505.0 L116.5 400.0 L117.5 271.0 L125.5 191.0 L127.5 177.0 L130.0 174.5 L285.0 114.5 L541.0 9.5 L953.0 174.5 L955.5 180.0 L960.5 221.0 L966.5 308.0 L964.5 446.0 L959.5 501.0 L949.5 567.0 L936.5 624.0 L923.5 666.0 L910.5 699.0 L883.5 752.0 L863.5 785.0 L830.5 832.0 L792.5 878.0 L748.0 924.5 L707.0 961.5 L651.0 1005.5 L598.0 1041.5 L542.0 1074.5Z" fill="none" stroke="#D9A93A" stroke-width="9" stroke-linejoin="round"/></svg>
          <img class="real" src="img/logo-640.webp" alt="">
          <span class="glint"><i></i></span>
        </div>
        <svg class="irope" viewBox="0 0 640 270">
          <defs>
            <linearGradient id="bV" x1="0" x2="1"><stop offset="0" stop-color="#5E4110"/><stop offset=".18" stop-color="#A57C2A"/><stop offset=".38" stop-color="#F6DE97"/><stop offset=".5" stop-color="#FFF4CF"/><stop offset=".62" stop-color="#E2BB5C"/><stop offset=".85" stop-color="#8A6320"/><stop offset="1" stop-color="#4A320B"/></linearGradient>
            <radialGradient id="bB" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#FFF8DD"/><stop offset=".25" stop-color="#F1D27E"/><stop offset=".6" stop-color="#B08530"/><stop offset="1" stop-color="#4E360D"/></radialGradient>
            <linearGradient id="bF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3D88F"/><stop offset=".45" stop-color="#A57C2A"/><stop offset="1" stop-color="#3E2A08"/></linearGradient>
            <linearGradient id="vV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B06CFF"/><stop offset=".3" stop-color="#7A22E0"/><stop offset=".7" stop-color="#4A0B92"/><stop offset="1" stop-color="#22053F"/></linearGradient>
            <filter id="sf" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
            <g id="pst"><ellipse cx="0" cy="250" rx="46" ry="11" fill="#000" opacity=".45" filter="url(#sf)"/><ellipse cx="0" cy="244" rx="40" ry="10" fill="url(#bF)"/><path d="M-40 244v-6q40-16 80 0v6q-40 12-80 0z" fill="url(#bV)"/><path d="M-14 232q14-22 28 0z" fill="url(#bV)"/><rect x="-7" y="70" width="14" height="164" fill="url(#bV)"/><rect x="-11" y="78" width="22" height="7" rx="3.5" fill="url(#bV)"/><rect x="-10" y="60" width="20" height="12" rx="4" fill="url(#bV)"/><circle cx="0" cy="46" r="17" fill="url(#bB)"/><ellipse cx="-5" cy="39" rx="5" ry="3.2" fill="#fff" opacity=".7"/></g>
            <g id="hk"><circle r="9" fill="none" stroke="url(#bV)" stroke-width="4.5"/><rect x="-6" y="5" width="12" height="16" rx="3" fill="url(#bV)"/></g>
          </defs>
          <use class="pl" href="#pst" x="90"/><use class="pr" href="#pst" x="550"/>
          <g class="rope">
            <path d="M104 92C200 190 440 190 536 92" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="22" stroke-linecap="round" filter="url(#sf)" transform="translate(0 14)"><animate attributeName="d" values="M104 92C200 190 440 190 536 92;M104 92C94 160 72 205 62 238;M104 92C108 160 100 206 112 250" keyTimes="0;.6;1" calcMode="spline" keySplines=".55 0 .9 .45;.2 .7 .3 1" dur=".9s" begin="1.6s" fill="freeze"/></path>
            <path d="M104 92C200 190 440 190 536 92" fill="none" stroke="#2A0650" stroke-width="20" stroke-linecap="round"><animate attributeName="d" values="M104 92C200 190 440 190 536 92;M104 92C94 160 72 205 62 238;M104 92C108 160 100 206 112 250" keyTimes="0;.6;1" calcMode="spline" keySplines=".55 0 .9 .45;.2 .7 .3 1" dur=".9s" begin="1.6s" fill="freeze"/></path>
            <path d="M104 92C200 190 440 190 536 92" fill="none" stroke="url(#vV)" stroke-width="17" stroke-linecap="round"><animate attributeName="d" values="M104 92C200 190 440 190 536 92;M104 92C94 160 72 205 62 238;M104 92C108 160 100 206 112 250" keyTimes="0;.6;1" calcMode="spline" keySplines=".55 0 .9 .45;.2 .7 .3 1" dur=".9s" begin="1.6s" fill="freeze"/></path>
            <path d="M104 88C200 184 440 184 536 88" fill="none" stroke="#D7B3FF" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"><animate attributeName="d" values="M104 88C200 184 440 184 536 88;M100 88C90 158 68 203 58 236;M100 88C104 158 96 204 108 248" keyTimes="0;.6;1" calcMode="spline" keySplines=".55 0 .9 .45;.2 .7 .3 1" dur=".9s" begin="1.6s" fill="freeze"/></path>
            <path d="M104 92C200 190 440 190 536 92" fill="none" stroke="#1A0233" stroke-opacity=".18" stroke-width="16" stroke-dasharray="1.5 7"><animate attributeName="d" values="M104 92C200 190 440 190 536 92;M104 92C94 160 72 205 62 238;M104 92C108 160 100 206 112 250" keyTimes="0;.6;1" calcMode="spline" keySplines=".55 0 .9 .45;.2 .7 .3 1" dur=".9s" begin="1.6s" fill="freeze"/></path>
            <use href="#hk" x="104" y="88"/>
            <g><use href="#hk" x="536" y="88"/><animateTransform attributeName="transform" type="translate" values="0 0;-474 150;-424 162" keyTimes="0;.6;1" calcMode="spline" keySplines=".55 0 .9 .45;.2 .7 .3 1" dur=".9s" begin="1.6s" fill="freeze"/></g>
          </g>
        </svg>
        <b class="iword">Doorman</b>
      </div>`;
    root.appendChild(intro);
    root.classList.add('intro-on');
    let done; introDone = new Promise(r => done = r);
    let ended = false;
    const finish = () => {
      if (ended) return; ended = true;
      intro.classList.add('open');                       // doors part, the crest steps forward and fades
      setTimeout(() => { root.classList.remove('intro-on'); done(); }, 420);
      setTimeout(() => intro.remove(), 1200);
    };
    const t = setTimeout(finish, 2700);
    intro.addEventListener('click', () => { clearTimeout(t); finish(); });
    addEventListener('keydown', () => { clearTimeout(t); finish(); }, { once: true });
  }

  // 1. Page load: the headline rises line by line, then the checker and the velvet rope
  introDone.then(() => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('loaded'))));

  // 2. Reveal headings and lists as they come into view (once)
  const revealer = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => revealer.observe(el));
  // sections that build themselves in, piece by piece, the first time they come into view
  document.querySelectorAll('[data-build]').forEach(el => {
    el.querySelectorAll('.bx-g, [role=tab]').forEach((c, i) => c.style.setProperty('--i', i));
    revealer.observe(el);
  });
  document.querySelectorAll('[data-stagger]').forEach(list => {
    [...list.children].forEach((c, i) => c.style.setProperty('--i', i));
    revealer.observe(list);
  });

  // 2b. Everything else in a section eases in as it comes into view, a few lines at a time
  const auto = [...document.querySelectorAll('main section h2, main section h3.belt-h, main section .intro, main section > .wrap > p, main .split > div > p, main .split ul, main .mk-after > *, main .promises > li, main .faq details, main .plans .plan, main .ts-foot, main .later, main .prose > *, main .page-hero h1, main .page-hero p, main .feat-end p, main .feat-end .btn')]
    .filter(el => !el.closest('.hero, .story-track, .mk-pin, [data-reveal], [data-stagger], .chat, .bx') && !el.hasAttribute('data-reveal'));
  const groups = new Map();
  auto.forEach(el => { el.classList.add('fade'); const k = el.parentElement; const n = groups.get(k) || 0; el.style.setProperty('--i', Math.min(n, 6)); groups.set(k, n + 1); });
  const fader = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); fader.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  auto.forEach(el => fader.observe(el));

  // 3. How it steps in: the section pins in place and scrolling moves through the four steps.
  //    The text and the browser always change together, so nothing scrolls away mid-demo.
  const browser = document.querySelector('.browser');
  const track = document.querySelector('.story-track');
  const steps = [...document.querySelectorAll('.story-steps .step')];
  const dots = [...document.querySelectorAll('.story-dots .sd')];
  const N = steps.length;
  let current = -1;
  const setStep = n => {
    if (n === current || !browser) return;
    current = n;
    browser.dataset.state = n;
    steps.forEach((s, i) => s.classList.toggle('on', i === n));
    dots.forEach((d, i) => { d.classList.toggle('on', i === n); d.setAttribute('aria-selected', String(i === n)); });
  };
  const trackProgress = () => {
    const r = track.getBoundingClientRect(), span = r.height - innerHeight;
    return Math.min(1, Math.max(0, -r.top / (span > 0 ? span : 1)));
  };
  if (track && !calm) {
    let queued = false;
    const onScroll = () => {
      queued = false;
      const p = trackProgress();
      // each step holds for a quarter of the scroll; the last stays until the section ends
      const n = Math.min(N - 1, Math.floor(p * N * 0.999));
      setStep(n);
      dots.forEach((d, i) => d.querySelector('i').style.setProperty('--f', Math.min(1, Math.max(0, p * N - i))));
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();
    // clicking a step label jumps to it
    dots.forEach((d, i) => d.addEventListener('click', () => {
      const top = track.getBoundingClientRect().top + scrollY, span = track.offsetHeight - innerHeight;
      scrollTo({ top: top + span * (i + 0.5) / N, behavior: 'smooth' });
    }));
  } else {
    setStep(2); // no motion: show the scam example
  }

  // the countdown on the pushy shop page ticks (it's the kind of pressure Doorman notices)
  const clock = document.querySelector('.clock');
  if (clock && !calm) { let t = 299; setInterval(() => { t = t > 0 ? t - 1 : 299; clock.textContent = `0${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }, 1000); }

  // shared: how far through a tall "track" the reader has scrolled (0 at the top, 1 at the end)
  const progressOf = el => { const r = el.getBoundingClientRect(), span = r.height - innerHeight; return Math.min(1, Math.max(0, -r.top / (span > 0 ? span : 1))); };
  const onFrame = fn => { let q = false; const run = () => { q = false; fn(); }; addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(run); } }, { passive: true }); addEventListener('resize', run); run(); };

  // 4. The chat pins in place and plays out one step per scroll: each message arrives, Doorman
  //    notes the courier and the bank details, then the payment link turns red and Marketplace Guard speaks up.
  //    The trick it's using lights up in the list on the left at the same moment.
  const mkTrack = document.querySelector('.mk-track');
  const chat = document.querySelector('.chat');
  if (mkTrack && chat) {
    const bits = [...chat.querySelectorAll('[data-s]')];
    const tricks = [...document.querySelectorAll('.spotted [data-t]')];
    const LAST = 6;
    let shown = -1;
    const setMk = n => {
      if (n === shown) return; shown = n;
      bits.forEach(el => el.classList.toggle('on', +el.dataset.s <= n));
      chat.classList.toggle('caught', n >= LAST);
      tricks.forEach(li => li.classList.toggle('on', n >= +li.dataset.t));
      chat.style.setProperty('--mp', `${(n / LAST) * 100}%`);
    };
    if (calm) setMk(LAST);
    else onFrame(() => setMk(Math.min(LAST, 1 + Math.floor(progressOf(mkTrack) * (LAST + 0.6)))));
  }

  // 4b. The belt: pick a check on the left and watch it work on the right. While it's on screen and
  //     nobody has picked one, it moves through them on its own; any click, key or hover hands control back.
  const bx = document.querySelector('.bx');
  if (bx) {
    const tabs = [...bx.querySelectorAll('[role=tab]')];
    const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
    const side = bx.querySelector('.bx-side');
    let cur = 0, timer = 0, visible = false, paused = false, picked = false;
    const DUR = 5500;
    const show = (i, focus) => {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => { const on = k === cur; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      panels.forEach((p, k) => p.classList.toggle('on', k === cur));
      if (focus) tabs[cur].focus({ preventScroll: true });
      // on phones the list is a sideways strip: keep the chosen one in view without moving the page
      if (side && side.scrollWidth > side.clientWidth) { const t = tabs[cur]; side.scrollTo({ left: t.offsetLeft - side.clientWidth / 2 + t.offsetWidth / 2, behavior: calm ? 'auto' : 'smooth' }); }
      restart();
    };
    const restart = () => {
      clearTimeout(timer);
      const run = !calm && !picked && visible && !paused;
      bx.classList.toggle('auto', run);
      if (run) { const bar = tabs[cur].querySelector('.tbar i'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; timer = setTimeout(() => show(cur + 1), DUR); }
    };
    bx.style.setProperty('--dur', `${DUR}ms`);
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { picked = true; show(i); });
      t.addEventListener('keydown', e => {
        const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); picked = true; show(cur + k, true); }
        else if (e.key === 'Home') { e.preventDefault(); picked = true; show(0, true); }
        else if (e.key === 'End') { e.preventDefault(); picked = true; show(tabs.length - 1, true); }
      });
    });
    bx.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { paused = true; restart(); } });
    bx.addEventListener('pointerleave', () => { paused = false; restart(); });
    bx.addEventListener('focusin', () => { paused = true; restart(); });
    bx.addEventListener('focusout', () => { paused = false; restart(); });
    new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; restart(); }), { threshold: 0.45 }).observe(bx);
    show(0);
  }

  // 4c. Tested: a line runs down through each set of examples as you scroll. Each set lights up
  //     and counts up as the line reaches it, and the version is "ready to ship" only at the end.
  const pipe = document.querySelector('.pipe-wrap');
  if (pipe) {
    const stops = [...pipe.querySelectorAll('.pipe > li')];
    const line = pipe.querySelector('.fl');
    const fmt = n => n.toLocaleString('en-GB');
    const countUp = el => {
      const to = +el.dataset.count, t0 = performance.now(), D = 1300;
      const tick = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(to * e)); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    if (calm) stops.forEach(li => li.classList.add('on'));
    else {
      onFrame(() => {
        const r = pipe.getBoundingClientRect();
        const reach = innerHeight * 0.62 - r.top;           // how far down the line has got
        line.style.setProperty('--fill', `${Math.max(0, reach - 22)}px`);
        stops.forEach(li => {
          const hit = reach >= li.offsetTop + 26;
          if (hit && !li.classList.contains('on')) { li.classList.add('on'); const n = li.querySelector('[data-count]'); if (n) countUp(n); }
        });
      });
    }
  }

  // 5. The promise lights up word by word on its own once it's comfortably in view
  const fill = document.querySelector('[data-fill]');
  if (fill) {
    const words = fill.textContent.trim().split(/\s+/);
    fill.innerHTML = words.map((w, i) => `<span style="--w:${i}">${w}</span>`).join(' ');
    if (calm) fill.classList.add('lit');
    else {
      const fw = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fill.classList.add('lit'); fw.disconnect(); } }), { threshold: 0.6 });
      fw.observe(fill);
    }
  }
}
