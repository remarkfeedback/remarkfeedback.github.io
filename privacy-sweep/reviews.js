/* Privasweep verified reviews.
   Reviews live in /privacy-sweep/reviews.json and are only added after the
   review code has been matched to a paid Stripe order. The section stays
   hidden until there is at least one review. */
(function () {
  var slot = document.getElementById('ps-reviews');
  if (!slot) return;
  fetch('/privacy-sweep/reviews.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (list) {
      if (!Array.isArray(list) || !list.length) return;
      list.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
      var esc = function (s) {
        return String(s || '').replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      };
      var total = 0;
      list.forEach(function (r) { total += Number(r.rating) || 0; });
      var avg = (total / list.length).toFixed(1);
      var stars = function (n) {
        n = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
        return '<span class="rv-stars" aria-label="' + n + ' out of 5 stars">' +
          '★★★★★'.slice(0, n) + '<span class="rv-off">' + '★★★★★'.slice(0, 5 - n) + '</span></span>';
      };
      var fmt = function (d) {
        var t = new Date(d + 'T12:00:00');
        return isNaN(t) ? '' : t.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      };
      var cards = list.map(function (r) {
        var who = esc(r.name) + (r.town ? ', ' + esc(r.town) : '');
        var reply = r.reply ? '<p class="rv-reply"><b>Our reply:</b> ' + esc(r.reply) + '</p>' : '';
        return '<li class="rv">' + stars(r.rating) +
          '<p class="rv-text">' + esc(r.text) + '</p>' + reply +
          '<p class="rv-who"><b>' + who + '</b><span class="rv-tag">✓ Verified purchase</span>' +
          (r.date ? '<span class="rv-date">' + fmt(r.date) + '</span>' : '') + '</p></li>';
      }).join('');
      var css = document.createElement('style');
      css.textContent =
        '.rv-sec h2{margin-bottom:8px}' +
        '.rv-sum{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 22px;font-size:16px}' +
        '.rv-stars{color:#E8A400;letter-spacing:2px;font-size:18px;line-height:1}.rv-off{color:rgba(128,128,128,.35)}' +
        '.rv-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}' +
        '.rv{border:1px solid rgba(128,128,128,.28);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:10px}' +
        '.rv-text{margin:0;font-size:16px;line-height:1.5}' +
        '.rv-reply{margin:0;font-size:14px;line-height:1.45;opacity:.8;border-left:3px solid rgba(128,128,128,.35);padding-left:10px}' +
        '.rv-who{margin:auto 0 0;display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:14px}' +
        '.rv-tag{color:#17A86F;font-weight:700;font-size:13px}.rv-date{opacity:.6;font-size:13px}' +
        '.rv-note{margin:18px 0 0;font-size:14px;opacity:.7}' +
        '@media(max-width:600px){.rv-list{grid-template-columns:1fr}}';
      document.head.appendChild(css);
      slot.innerHTML =
        '<section class="sec rv-sec" id="reviews" aria-labelledby="rv-h"><div class="wrap">' +
        '<h2 id="rv-h">What customers say</h2>' +
        '<p class="rv-sum">' + stars(Math.floor(avg)) + ' <b>' + avg + ' out of 5</b> from ' +
        list.length + ' verified ' + (list.length === 1 ? 'customer' : 'customers') + '</p>' +
        '<ul class="rv-list">' + cards + '</ul>' +
        '<p class="rv-note">Only people who have paid for Privasweep can leave a review. We publish every review we receive, good or bad.</p>' +
        '</div></section>';
    })
    .catch(function () {});
})();
