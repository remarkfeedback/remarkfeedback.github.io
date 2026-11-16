/* "Try it with your own words" playgrounds for Remark and Themely.
   Everything happens in this page: nothing typed here is sent anywhere. */
(() => {
  const isWord = c => /[\p{L}\p{N}'’\-]/u.test(c || '');

  // grow a selection out to whole words, and trim spaces off the ends
  const snap = r => {
    const sc = r.startContainer, ec = r.endContainer;
    if (sc.nodeType === 3) { let o = r.startOffset; const t = sc.data; while (o > 0 && isWord(t[o - 1])) o--; while (o < t.length && /\s/.test(t[o])) o++; r.setStart(sc, o); }
    if (ec.nodeType === 3) { let o = r.endOffset; const t = ec.data; while (o < t.length && isWord(t[o])) o++; while (o > 0 && /\s/.test(t[o - 1])) o--; r.setEnd(ec, o); }
    return r.collapsed || !r.toString().trim() ? null : r;
  };

  const setup = root => {
    const paper = root.querySelector('[data-paper]'), status = root.querySelector('[data-status]');
    const original = paper.innerHTML;
    let last = null;

    // plain text only when pasting
    paper.addEventListener('paste', e => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain').slice(0, 4000);
      document.execCommand('insertText', false, text);
    });
    document.addEventListener('selectionchange', () => {
      const s = getSelection();
      if (s.rangeCount && paper.contains(s.anchorNode) && paper.contains(s.focusNode)) last = s.getRangeAt(0).cloneRange();
    });
    // keep the selection when a button is pressed
    root.querySelectorAll('[data-keep]').forEach(b => b.addEventListener('mousedown', e => e.preventDefault()));

    const say = (msg, warn) => { status.textContent = msg; status.classList.toggle('warn', !!warn); if (warn) { status.classList.remove('shake'); void status.offsetWidth; status.classList.add('shake'); } };

    // the range to work on: the current selection, or the word the caret is in
    const take = () => {
      if (!last || !paper.contains(last.commonAncestorContainer)) return null;
      let node = last.commonAncestorContainer; if (node.nodeType === 3) node = node.parentNode;
      if (node.closest('[contenteditable="false"],mark')) return null;
      const r = snap(last.cloneRange());
      if (!r) return null;
      // a selection that runs across marks or comments is not allowed
      const frag = r.cloneContents();
      if (frag.querySelector && frag.querySelector('mark,[contenteditable="false"]')) return 'cross';
      return r;
    };
    const wrap = (r, mark) => { mark.appendChild(r.extractContents()); r.insertNode(mark); last = null; getSelection().removeAllRanges(); return mark; };

    return { root, paper, say, take, wrap, reset() { paper.innerHTML = original; last = null; } };
  };

  /* ---------- Remark ---------- */
  const remark = el => {
    const t = setup(el);
    const nameIn = el.querySelector('[data-name]'), key = el.querySelector('[data-key]'), modes = el.querySelectorAll('[data-mode]');
    let mode = 'comment';
    const used = { www: [], ebi: [], codes: new Map() };
    modes.forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode; modes.forEach(x => x.classList.toggle('on', x === b));
      el.querySelector('[data-list="comment"]').hidden = mode !== 'comment';
      el.querySelector('[data-list="code"]').hidden = mode !== 'code';
    }));
    const name = () => (nameIn.value.trim() || 'Jordan').split(/\s+/)[0].slice(0, 20);
    const drawKey = () => {
      if (!used.codes.size) { key.hidden = true; return; }
      key.hidden = false;
      key.innerHTML = '<div>Marking code key</div>' + [...used.codes].map(([c, m]) => `<div><b>[${c}]</b>${m}</div>`).join('');
    };
    el.querySelectorAll('[data-comment]').forEach(b => b.addEventListener('click', () => {
      const r = t.take();
      if (!r) return t.say('Select or tap some words in the essay first.', true);
      if (r === 'cross') return t.say('Pick words that are not already marked.', true);
      const mark = t.wrap(r, Object.assign(document.createElement('mark'), { className: 'q' }));
      const ins = document.createElement('span'); ins.contentEditable = 'false'; ins.className = 'ins pop';
      ins.textContent = `${name()}, ${b.dataset.comment}`;
      mark.after(' ', ins);
      (b.dataset.type === 'www' ? used.www : used.ebi).push(b.dataset.short);
      t.say(`Added for ${name()}. Try a marking code next, or finish with a summary.`);
    }));
    el.querySelectorAll('[data-code]').forEach(b => b.addEventListener('click', () => {
      const r = t.take();
      if (!r) return t.say('Select or tap a word in the essay first.', true);
      if (r === 'cross') return t.say('Pick words that are not already marked.', true);
      const mark = t.wrap(r, Object.assign(document.createElement('mark'), { className: 'q code-q' }));
      const c = document.createElement('span'); c.contentEditable = 'false'; c.className = 'code pop'; c.textContent = `[${b.dataset.code}]`;
      mark.after(c);
      used.codes.set(b.dataset.code, b.dataset.meaning); drawKey();
      t.say('Code added. The key at the bottom explains it.');
    }));
    el.querySelector('[data-summary]').addEventListener('click', () => {
      el.querySelector('.sumbox')?.remove();
      const www = used.www[0] || 'You make your points clearly.', ebi = used.ebi[0] || 'Explain how your evidence proves your point.';
      const box = document.createElement('div'); box.className = 'sumbox pop'; box.contentEditable = 'false';
      box.innerHTML = `<div><b>WWW</b><span></span></div><div><b>EBI</b><span></span></div><div><b>DIRT</b><span></span></div>`;
      const s = box.querySelectorAll('span');
      s[0].textContent = www; s[1].textContent = ebi;
      s[2].textContent = used.codes.size ? `Fix every ${[...used.codes.keys()].map(k => '[' + k + ']').join(', ')} in your work, then rewrite one sentence.` : 'Rewrite one paragraph, explaining a quotation in detail.';
      key.after(box);
      t.say(`Summary added for ${name()}.`);
    });
    el.querySelector('[data-reset]').addEventListener('click', () => {
      t.reset(); used.www = []; used.ebi = []; used.codes.clear(); drawKey(); el.querySelector('.sumbox')?.remove();
      t.say('Fresh page. Select some words, then click a comment.');
    });
  };

  /* ---------- Themely ---------- */
  const themely = el => {
    const t = setup(el);
    const list = el.querySelector('[data-codes]'), board = (el.closest('section') || document).querySelector('[data-board]'), form = el.querySelector('[data-add]');
    const spare = ['#D6C8FF', '#FFF0A6', '#FFD6BD', '#C9F0FF'];
    const codes = [];
    const addCode = (label, colour) => {
      const c = { label, colour, n: 0 };
      const b = document.createElement('button'); b.type = 'button'; b.className = 'code-btn'; b.dataset.keep = '';
      b.innerHTML = '<i></i><span></span><b>0</b>';
      b.querySelector('i').style.background = colour; b.querySelector('span').textContent = label;
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => apply(c));
      list.appendChild(b);
      const col = document.createElement('div'); col.className = 'tcol'; col.innerHTML = '<h6></h6>'; col.querySelector('h6').textContent = label;
      board.appendChild(col);
      Object.assign(c, { b, col }); codes.push(c);
    };
    const apply = c => {
      const r = t.take();
      if (!r) return t.say('Select or tap some words in the interview first.', true);
      if (r === 'cross') return t.say('Pick words that are not already coded.', true);
      const quote = r.toString().trim().replace(/\s+/g, ' ');
      const mark = t.wrap(r, document.createElement('mark'));
      mark.style.background = c.colour; mark.title = c.label;
      c.n++; c.b.querySelector('b').textContent = c.n; c.b.classList.remove('bump'); void c.b.offsetWidth; c.b.classList.add('bump');
      const note = document.createElement('span'); note.className = 'tnote';
      note.style.background = c.colour; note.style.setProperty('--r', (Math.random() * 5 - 2.5).toFixed(1) + 'deg');
      note.textContent = quote.length > 70 ? quote.slice(0, 68) + '…' : quote;
      c.col.appendChild(note); board.classList.add('has');
      const total = codes.reduce((a, x) => a + x.n, 0);
      t.say(total === 1 ? 'Coded. Your first quote is on the theme board.' : `${total} quotes coded across ${codes.filter(x => x.n).length} themes.`);
    };
    [['Trust', '#9FD2FF'], ['Family', '#BDF3E0'], ['Control', '#FFC2C2']].forEach(([l, c]) => addCode(l, c));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const inp = form.querySelector('input'), label = inp.value.trim().slice(0, 24);
      if (!label) return;
      if (codes.length >= 7) return t.say('That is plenty for a try-out. The real Themely has no limit on Pro.', true);
      addCode(label, spare[(codes.length - 3) % spare.length]); inp.value = '';
      t.say(`"${label}" added. Select some words and click it.`);
    });
    el.querySelector('[data-reset]').addEventListener('click', () => {
      t.reset();
      codes.forEach(c => { c.n = 0; c.b.querySelector('b').textContent = 0; c.col.querySelectorAll('.tnote').forEach(n => n.remove()); });
      board.classList.remove('has');
      t.say('Fresh page. Select some words, then click a code.');
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-try="remark"]').forEach(remark);
    document.querySelectorAll('[data-try="themely"]').forEach(themely);
  });
})();
