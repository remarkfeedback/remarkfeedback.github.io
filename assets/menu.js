/* Phone menu: on small screens the nav hides its extra links, so this adds a Menu button that lists every link. */
(() => {
  const nav = document.querySelector('.sl-nav nav');
  if (!nav || nav.querySelector('.sl-menu-btn')) return;
  const sections = (nav.dataset.sections || '').split(';').filter(Boolean).map(x => x.split('|'));
  const prods = [...nav.querySelectorAll('a.pl')].map(a => [a.textContent.trim(), a.getAttribute('href'), a.querySelector('.mk')]);
  const cta = nav.querySelector('a.sl-contact');
  const links = [];
  const extra = [['Guides', '/guides/'], ['Home', '/']];
  const css = document.createElement('style');
  css.textContent = `.sl-menu-btn{display:none;border:0;background:rgba(14,21,37,.07);color:inherit;font:700 13.5px var(--sans,system-ui);padding:7px 12px;border-radius:999px;cursor:pointer;margin-left:4px}
.sl-nav.on-dark .sl-menu-btn{background:rgba(255,255,255,.12)}
.sl-menu{position:absolute;top:calc(100% + 8px);right:0;min-width:230px;max-height:calc(100vh - 100px);overflow:auto;background:#fff;color:#0E1525;border-radius:18px;padding:8px;box-shadow:0 0 0 1px rgba(14,21,37,.08),0 24px 48px -20px rgba(14,21,37,.45);display:none;flex-direction:column}
.sl-menu-h{margin:6px 14px 2px;font:700 11.5px var(--sans,system-ui);letter-spacing:.02em;color:#7A8296}
.sl-menu .mk{width:18px;height:18px;margin-right:10px;vertical-align:-3px;display:inline-block}
.sl-menu a{display:block!important;opacity:1!important;color:#0E1525!important;background:none!important;font:600 16px var(--sans,system-ui)!important;padding:12px 14px!important;border-radius:12px!important;margin:0!important;text-decoration:none}
.sl-menu a:hover,.sl-menu a:focus-visible{background:rgba(14,21,37,.06)!important}
.sl-nav.menu-open .sl-menu{display:flex}
@media (max-width:720px){.sl-menu-btn{display:inline-block}}`;
  document.head.appendChild(css);
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'sl-menu-btn'; btn.textContent = 'Menu';
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'sl-menu');
  const bar = nav.closest('.sl-nav');
  let set = () => {};
  const panel = document.createElement('div');
  panel.className = 'sl-menu'; panel.id = 'sl-menu';
  const head = t => { const h = document.createElement('p'); h.className = 'sl-menu-h'; h.textContent = t; panel.appendChild(h); };
  const add = (t, h, mk) => { const a = document.createElement('a'); a.href = h; if (mk) { const c = mk.cloneNode(true); c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id')); c.querySelectorAll('[fill^="url"]').forEach(n => n.setAttribute('fill', '#5FC9C9')); a.appendChild(c); } a.appendChild(document.createTextNode(t)); a.addEventListener('click', () => set(false)); panel.appendChild(a); };
  if (sections.length) { head('On this page'); sections.forEach(([t, h]) => add(t, h)); }
  head('Survive Labs'); prods.forEach(([t, h, mk]) => add(t, h, mk));
  extra.forEach(([t, h]) => add(t, h));
  if (cta) add(cta.textContent.trim(), cta.getAttribute('href'));
  nav.appendChild(btn); bar.appendChild(panel);
  set = open => { bar.classList.toggle('menu-open', open); btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Close' : 'Menu'; };
  btn.addEventListener('click', e => { e.stopPropagation(); set(!bar.classList.contains('menu-open')); });
  document.addEventListener('click', e => { if (!bar.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
})();
