/* Second Look by Survive Labs: shows results. Shared by the web page and the Chrome extension. */
(function () {
  'use strict';
  const S = window.SecondLook;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LABEL = { high: 'Big warning', medium: 'Warning', low: 'Worth noting', info: 'Tip' };
  const linkify = s => esc(s)
    .replace(/reportfraud\.police\.uk/g, '<a href="https://www.reportfraud.police.uk/" target="_blank" rel="noopener">reportfraud.police.uk</a>')
    .replace(/ncsc\.gov\.uk\/report/g, '<a href="https://www.ncsc.gov.uk/collection/phishing-scams" target="_blank" rel="noopener">ncsc.gov.uk</a>');

  function renderSigns(kind, signs, extraHead) {
    const sm = S.summarise(signs);
    const steps = kind === 'page' ? S.NEXT_STEPS.page : S.NEXT_STEPS.message;
    return `<div class="res ${sm.band}">
      <div class="head"><span class="dot" aria-hidden="true"></span><div><h2>${esc(sm.headline)}</h2></div></div>
      <p class="sum">${esc(sm.text)}</p>
      ${extraHead || ''}
      ${signs.length ? `<ul class="signs">${signs.map(s => `<li><span class="lv ${s.level}">${LABEL[s.level]}</span><b>${esc(s.title)}</b><span class="w">${esc(s.why)}</span></li>`).join('')}</ul>` : ''}
      ${sm.band !== 'none' || kind === 'message' ? `<div class="next"><h3>What to do</h3><ul>${steps.map(([a, b]) => `<li><b>${esc(a)}</b>${b ? ' ' + linkify(b) : ''}</li>`).join('')}</ul></div>` : ''}
    </div>`;
  }

  function looksLikeJustALink(t) {
    t = t.trim();
    return t && !/\s/.test(t) && /[a-z0-9-]+\.[a-z]{2,}/i.test(t);
  }

  function runText(text, out) {
    text = (text || '').trim();
    if (!text) { out.innerHTML = '<div class="res"><p class="sum" style="margin:0">Paste a message or link first.</p></div>'; return; }
    if (looksLikeJustALink(text)) {
      const r = S.checkLink(text);
      const head = r.registered ? `<dl class="kv"><dt>This link really goes to</dt><dd>${esc(r.registered)}</dd></dl>` : '';
      out.innerHTML = renderSigns('link', r.signs, head);
    } else {
      const r = S.checkMessage(text);
      out.innerHTML = renderSigns('message', r.signs);
    }
  }

  async function runPhoto(file, out) {
    if (!file || !/^image\//.test(file.type)) { out.innerHTML = '<div class="res"><p class="sum" style="margin:0">Please choose a photo (JPG or PNG).</p></div>'; return; }
    out.innerHTML = '<div class="res"><p class="sum" style="margin:0">Checking your photo on this device...</p></div>';
    const info = S.readExif(await file.arrayBuffer());
    let clean;
    try { clean = await S.cleanPhoto(file); } catch (e) { clean = null; }
    const url = clean ? URL.createObjectURL(clean.blob) : '';
    const found = info.gps ? 'high' : (info.hasExif ? 'medium' : 'none');
    const headline = info.gps ? 'This photo shows where it was taken' : info.hasExif ? 'No location found, but it has other hidden details' : 'No hidden details found';
    const text = info.gps
      ? "Anyone who downloads the original can see the exact spot, which could be your home. Use the clean copy below instead."
      : info.hasExif ? 'It still carries details such as the phone model or date. The clean copy below removes them.' : "We didn't find hidden details. Many apps remove them when you upload, but not all do.";
    const kv = [
      info.gps ? ['Hidden location', `${info.gps.lat.toFixed(5)}, ${info.gps.lon.toFixed(5)}`] : null,
      info.date ? ['Taken on', info.date.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$3/$2/$1')] : null,
      info.camera ? ['Phone or camera', info.camera] : null,
    ].filter(Boolean);
    out.innerHTML = `<div class="res photo-res ${found}">
      <div class="head"><span class="dot" aria-hidden="true"></span><div><h2>${esc(headline)}</h2></div></div>
      <p class="sum">${esc(text)}</p>
      ${kv.length ? `<dl class="kv">${kv.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>` : ''}
      ${clean ? `<img src="${url}" alt="Your cleaned photo"><a class="lk-btn" href="${url}" download="${esc(clean.name)}">Download clean copy</a><p class="fine">The clean copy is redrawn on your device, which leaves the hidden data behind. Your photo never leaves your device.</p>` : '<p class="fine">This photo type can\'t be cleaned in your browser. Try a JPG or PNG, or take a screenshot of it and share that instead.</p>'}
    </div>`;
  }

  window.SecondLookUI = { runText, runPhoto, renderSigns };

  // wire up the page if the standard controls exist
  const input = $('in'), go = $('go'), ph = $('ph'), drop = $('drop'), out = $('out');
  if (!out) return;
  if (go) go.addEventListener('click', () => runText(input.value, out));
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runText(input.value, out); });
  if (ph) ph.addEventListener('change', () => { if (ph.files[0]) runPhoto(ph.files[0], out); ph.value = ''; });
  if (drop) {
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('on'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('on'); }));
    drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) runPhoto(f, out); });
  }
  if (input) input.addEventListener('paste', e => {
    const f = [...(e.clipboardData && e.clipboardData.files || [])].find(x => /^image\//.test(x.type));
    if (f) { e.preventDefault(); runPhoto(f, out); }
  });
})();
