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
