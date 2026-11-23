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
        <svg class="crest" viewBox="0 0 100 100">
          <defs><linearGradient id="igr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A20BFF"/><stop offset="1" stop-color="#3E0670"/></linearGradient>
          <clipPath id="icl"><path d="M50 10 83 22.4v25.6c0 21.6-14 34.4-33 42C31 82.4 17 69.6 17 48V22.4z"/></clipPath>
          <clipPath id="igl"><path d="M37 30.4h26v3H60.6c-.2 3.4-2.2 5.4-5 5.4s-4.6-2-5-4.4h-1.2c-.4 2.4-2.2 4.4-5 4.4s-4.8-2-5-5.4H37z"/></clipPath></defs>
          <path class="sh-fill" d="M50 3 90 18v30c0 26-17 41-40 50C27 89 10 74 10 48V18z" fill="url(#igr)"/>
          <path class="sh-line" pathLength="1" d="M50 3 90 18v30c0 26-17 41-40 50C27 89 10 74 10 48V18z" fill="none" stroke="#D9A93A" stroke-width="2.4" stroke-linejoin="round"/>
          <path class="sh-inner" pathLength="1" d="M50 10 83 22.4v25.6c0 21.6-14 34.4-33 42C31 82.4 17 69.6 17 48V22.4z" fill="none" stroke="#fff" stroke-width="3.2"/>
          <g class="man">
            <g clip-path="url(#icl)"><path d="M43 44h14v12H43z" fill="#fff"/><path d="M6 100V76c0-10 8-16 18-18l17-4h18l17 4c10 2 18 8 18 18v24z" fill="#111"/><path d="M41 54h18l-9 26z" fill="#fff"/><path d="M47.4 56.5h5.2l-1 3.5 2.2 16-3.8 5-3.8-5 2.2-16z" fill="#111"/></g>
            <ellipse cx="36.6" cy="35" rx="3" ry="4.4" fill="#fff"/><ellipse cx="63.4" cy="35" rx="3" ry="4.4" fill="#fff"/>
            <path d="M37.4 30c0-8.6 5-13 12.6-13s12.6 4.4 12.6 13v6.4c0 7-5 11.6-12.6 12.6-7.6-1-12.6-5.6-12.6-12.6z" fill="#fff"/>
            <path d="M37 30.4h26v3H60.6c-.2 3.4-2.2 5.4-5 5.4s-4.6-2-5-4.4h-1.2c-.4 2.4-2.2 4.4-5 4.4s-4.8-2-5-5.4H37z" fill="#111"/>
            <g clip-path="url(#igl)"><rect class="glint" x="20" y="24" width="6" height="20" fill="#fff" transform="skewX(-25)"/></g>
          </g>
        </svg>
        <svg class="irope" viewBox="0 0 300 60"><g class="hook"><path d="M24 14 Q150 64 276 14" fill="none" stroke="#7C1FD8" stroke-width="7" stroke-linecap="round"/></g>
          <rect x="16" y="8" width="16" height="52" rx="3" fill="#D9A93A"/><circle cx="24" cy="8" r="9" fill="#E8C66A"/>
          <rect x="268" y="8" width="16" height="52" rx="3" fill="#D9A93A"/><circle cx="276" cy="8" r="9" fill="#E8C66A"/></svg>
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
    const t = setTimeout(finish, 2300);
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
  document.querySelectorAll('[data-stagger]').forEach(list => {
    [...list.children].forEach((c, i) => c.style.setProperty('--i', i));
    revealer.observe(list);
  });

  // 3. How it steps in: the browser on the right follows whichever step is in the middle of the screen
  const browser = document.querySelector('.browser');
  const steps = [...document.querySelectorAll('.step')];
  const setStep = n => {
    if (!browser || browser.dataset.state === String(n)) return;
    browser.dataset.state = n;
    steps.forEach(s => s.classList.toggle('on', s.dataset.step === String(n)));
  };
  const stepWatcher = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) setStep(e.target.dataset.step); }),
    // on phones the browser sits pinned at the top, so the step being read is the one in the lower part of the screen
    { rootMargin: matchMedia('(max-width: 900px)').matches ? '-72% 0px -18% 0px' : '-45% 0px -45% 0px' });
  steps.forEach(s => stepWatcher.observe(s));
  if (steps[0]) steps[0].classList.add('on');

  // the countdown on the pushy shop page ticks (it's the kind of pressure Doorman notices)
  const clock = document.querySelector('.clock');
  if (clock && !calm) { let t = 299; setInterval(() => { t = t > 0 ? t - 1 : 299; clock.textContent = `0${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }, 1000); }

  // 4. The chat plays out when it scrolls into view, then Marketplace Guard speaks up
  const chat = document.querySelector('.chat');
  if (chat) {
    const chatWatcher = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { chat.classList.add('play'); chatWatcher.disconnect(); }
    }), { threshold: 0.45 });
    chatWatcher.observe(chat);
  }

  // 5. The promise lights up word by word as you scroll past it
  const fill = document.querySelector('[data-fill]');
  if (fill) {
    const words = fill.textContent.trim().split(/\s+/);
    fill.innerHTML = words.map(w => `<span>${w}</span>`).join(' ');
    const spans = [...fill.children];
    let ticking = false;
    const paint = () => {
      ticking = false;
      const r = fill.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.35)));
      const lit = calm ? spans.length : Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('lit', i < lit));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    addEventListener('resize', paint);
    paint();
  }
}
