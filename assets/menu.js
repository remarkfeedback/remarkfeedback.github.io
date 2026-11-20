/* Phone menu: on small screens the nav hides its extra links, so this adds a Menu button that lists every link. */
(() => {
  const nav = document.querySelector('.sl-nav nav');
  if (!nav || nav.querySelector('.sl-menu-btn')) return;
  const links = [...nav.querySelectorAll('a')].map(a => [a.textContent.trim(), a.getAttribute('href')]);
  const extra = [['Free tools', '/tools/'], ['Guides', '/guides/'], ['Home', '/']];
  extra.forEach(([t, h]) => { if (!links.some(l => l[1] === h)) links.push([t, h]); });
  const css = document.createElement('style');
  css.textContent = `.sl-menu-btn{display:none;border:0;background:rgba(14,21,37,.07);color:inherit;font:700 13.5px var(--sans,system-ui);padding:7px 12px;border-radius:999px;cursor:pointer;margin-left:4px}
.sl-nav.on-dark .sl-menu-btn{background:rgba(255,255,255,.12)}
.sl-menu{position:absolute;top:calc(100% + 8px);right:0;min-width:220px;background:#fff;color:#0E1525;border-radius:18px;padding:8px;box-shadow:0 0 0 1px rgba(14,21,37,.08),0 24px 48px -20px rgba(14,21,37,.45);display:none;flex-direction:column}
.sl-menu a{display:block!important;opacity:1!important;color:#0E1525!important;background:none!important;font:600 16px var(--sans,system-ui)!important;padding:12px 14px!important;border-radius:12px!important;margin:0!important;text-decoration:none}
.sl-menu a:hover,.sl-menu a:focus-visible{background:rgba(14,21,37,.06)!important}
.sl-nav.menu-open .sl-menu{display:flex}
@media (max-width:720px){.sl-menu-btn{display:inline-block}}`;
  document.head.appendChild(css);
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'sl-menu-btn'; btn.textContent = 'Menu';
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'sl-menu');
  const panel = document.createElement('div');
  panel.className = 'sl-menu'; panel.id = 'sl-menu';
  links.forEach(([t, h]) => { const a = document.createElement('a'); a.href = h; a.textContent = t; panel.appendChild(a); });
  const bar = nav.closest('.sl-nav');
  nav.appendChild(btn); bar.appendChild(panel);
  const set = open => { bar.classList.toggle('menu-open', open); btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Close' : 'Menu'; };
  btn.addEventListener('click', e => { e.stopPropagation(); set(!bar.classList.contains('menu-open')); });
  document.addEventListener('click', e => { if (!bar.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
})();
