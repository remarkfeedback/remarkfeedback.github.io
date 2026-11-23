/* Doorman by Survive Labs: the checks.
   Everything here runs on the user's own device. Nothing is sent anywhere.
   It never says something is "safe": it lists warning signs, or says it found none. */
(function (root) {
  'use strict';

  // ---------- brands scammers commonly copy in the UK, and where they really live ----------
  const BRANDS = [
    { name: 'Royal Mail', words: ['royal mail', 'royalmail'], domains: ['royalmail.com', 'royalmail.co.uk', 'royalmailgroup.com'] },
    { name: 'Evri', words: ['evri', 'myhermes'], domains: ['evri.com', 'myhermes.co.uk'] },
    { name: 'DPD', words: ['dpd'], domains: ['dpd.co.uk', 'dpdlocal.co.uk', 'dpd.com'] },
    { name: 'Parcelforce', words: ['parcelforce'], domains: ['parcelforce.com'] },
    { name: 'DHL', words: ['dhl'], domains: ['dhl.com', 'dhl.co.uk'] },
    { name: 'Yodel', words: ['yodel'], domains: ['yodel.co.uk'] },
    { name: 'HMRC', words: ['hmrc', 'tax rebate', 'tax refund'], domains: ['gov.uk'] },
    { name: 'DVLA', words: ['dvla', 'vehicle tax'], domains: ['gov.uk'] },
    { name: 'GOV.UK', words: ['gov.uk', 'government gateway'], domains: ['gov.uk'] },
    { name: 'NHS', words: ['nhs'], domains: ['nhs.uk', 'nhs.net'] },
    { name: 'TV Licensing', words: ['tv licen', 'tvlicen'], domains: ['tvlicensing.co.uk'] },
    { name: 'PayPal', words: ['paypal'], domains: ['paypal.com', 'paypal.co.uk', 'paypal.me'] },
    { name: 'Amazon', words: ['amazon', 'prime membership'], domains: ['amazon.co.uk', 'amazon.com', 'amazon.co.uk', 'amzn.to', 'amzn.eu'] },
    { name: 'Apple', words: ['apple id', 'icloud', 'apple pay'], domains: ['apple.com', 'icloud.com'] },
    { name: 'Microsoft', words: ['microsoft', 'outlook account', 'office 365', 'windows defender'], domains: ['microsoft.com', 'live.com', 'outlook.com', 'office.com'] },
    { name: 'Netflix', words: ['netflix'], domains: ['netflix.com'] },
    { name: 'WhatsApp', words: ['whatsapp'], domains: ['whatsapp.com', 'wa.me'] },
    { name: 'Vinted', words: ['vinted'], domains: ['vinted.co.uk', 'vinted.com'] },
    { name: 'eBay', words: ['ebay'], domains: ['ebay.co.uk', 'ebay.com'] },
    { name: 'Barclays', words: ['barclays'], domains: ['barclays.co.uk', 'barclays.com'] },
    { name: 'HSBC', words: ['hsbc'], domains: ['hsbc.co.uk', 'hsbc.com'] },
    { name: 'Lloyds', words: ['lloyds'], domains: ['lloydsbank.com', 'lloydsbank.co.uk'] },
    { name: 'Halifax', words: ['halifax'], domains: ['halifax.co.uk'] },
    { name: 'NatWest', words: ['natwest'], domains: ['natwest.com'] },
    { name: 'Santander', words: ['santander'], domains: ['santander.co.uk'] },
    { name: 'Nationwide', words: ['nationwide'], domains: ['nationwide.co.uk'] },
    { name: 'Monzo', words: ['monzo'], domains: ['monzo.com', 'monzo.me'] },
    { name: 'EE', words: [' ee bill', 'your ee '], domains: ['ee.co.uk'] },
    { name: 'O2', words: ['o2 bill', 'your o2 '], domains: ['o2.co.uk'] },
    { name: 'Vodafone', words: ['vodafone'], domains: ['vodafone.co.uk'] },
    { name: 'British Gas', words: ['british gas'], domains: ['britishgas.co.uk'] },
    { name: 'Octopus Energy', words: ['octopus energy'], domains: ['octopus.energy'] },
  ];

  // Big brands copied by phishing links worldwide. Only used to check web addresses.
  const LINK_BRANDS = [
    ['Microsoft', ['microsoft', 'office365', 'microsoftonline', 'sharepoint', 'onedrive', 'outlook'], ['microsoft.com', 'live.com', 'office.com', 'microsoftonline.com', 'sharepoint.com', 'onedrive.com', 'outlook.com', 'office365.com', 'microsoft365.com', 'msn.com', 'azure.com']],
    ['Google', ['google', 'gmail'], ['google.com', 'gmail.com', 'youtube.com', 'google.co.uk', 'googleusercontent.com', 'withgoogle.com', 'goo.gl']],
    ['Facebook', ['facebook', 'instagram', 'whatsapp', 'meta'], ['facebook.com', 'fb.com', 'instagram.com', 'whatsapp.com', 'meta.com', 'messenger.com', 'fbcdn.net', 'wa.me']],
    ['Apple', ['apple', 'icloud', 'appleid', 'itunes'], ['apple.com', 'icloud.com', 'itunes.com', 'apple.co']],
    ['Netflix', ['netflix'], ['netflix.com']], ['FedEx', ['fedex'], ['fedex.com']], ['UPS', ['ups'], ['ups.com']], ['USPS', ['usps'], ['usps.com']],
    ['Chase', ['chase'], ['chase.com', 'jpmorganchase.com']], ['Wells Fargo', ['wellsfargo'], ['wellsfargo.com']], ['Bank of America', ['bankofamerica', 'bofa'], ['bankofamerica.com', 'bofa.com']],
    ['Citi', ['citibank', 'citi'], ['citi.com', 'citibank.com']], ['Scotiabank', ['scotiabank', 'scotia'], ['scotiabank.com']], ['Interac', ['interac'], ['interac.ca']],
    ['RBC', ['rbc', 'rbcroyalbank'], ['rbc.com', 'rbcroyalbank.com']], ['Coinbase', ['coinbase'], ['coinbase.com']], ['Binance', ['binance'], ['binance.com']], ['MetaMask', ['metamask'], ['metamask.io']],
    ['Steam', ['steam', 'steamcommunity', 'steampowered'], ['steampowered.com', 'steamcommunity.com', 'steamgames.com']], ['Roblox', ['roblox'], ['roblox.com']], ['LinkedIn', ['linkedin'], ['linkedin.com', 'lnkd.in']],
    ['DocuSign', ['docusign'], ['docusign.com', 'docusign.net']], ['Dropbox', ['dropbox'], ['dropbox.com']], ['Adobe', ['adobe'], ['adobe.com']], ['WeTransfer', ['wetransfer'], ['wetransfer.com', 'we.tl']],
    ['AT&T', ['att'], ['att.com']], ['Verizon', ['verizon'], ['verizon.com']], ['SBI', ['sbi', 'onlinesbi', 'yonosbi'], ['onlinesbi.sbi', 'sbi.co.in', 'onlinesbi.com', 'sbi']], ['HDFC', ['hdfc', 'hdfcbank'], ['hdfcbank.com']],
    ['ICICI', ['icici', 'icicibank'], ['icicibank.com']], ['Intesa Sanpaolo', ['intesasanpaolo', 'intesa'], ['intesasanpaolo.com']], ['Poste Italiane', ['poste', 'posteitaliane'], ['poste.it', 'posteitaliane.it']],
    ['Correos', ['correos'], ['correos.es', 'correos.com']], ['La Poste', ['laposte'], ['laposte.fr', 'laposte.net']], ['ING', ['ing'], ['ing.com', 'ing.nl', 'ing.de', 'ing.be', 'ing.es']],
    ['Sparkasse', ['sparkasse'], ['sparkasse.de']], ['Credit Agricole', ['creditagricole', 'credit-agricole', 'ca-authentification'], ['credit-agricole.fr', 'credit-agricole.com']], ['BNP Paribas', ['bnpparibas', 'bnp'], ['bnpparibas', 'bnpparibas.com', 'bnpparibas.fr']],
    ['Societe Generale', ['societegenerale'], ['societegenerale.fr', 'societegenerale.com']], ['Commonwealth Bank', ['commbank'], ['commbank.com.au']], ['Allegro', ['allegro'], ['allegro.pl']], ['OLX', ['olx'], ['olx.pl', 'olx.com', 'olx.ua', 'olx.ro', 'olx.in']],
    ['Mercado Libre', ['mercadolibre', 'mercadopago', 'mercadolivre'], ['mercadolibre.com', 'mercadopago.com', 'mercadolivre.com.br', 'mercadolivre.com']], ['Booking.com', ['booking'], ['booking.com']], ['Airbnb', ['airbnb'], ['airbnb.com', 'airbnb.co.uk']], ['Telegram', ['telegram'], ['telegram.org', 't.me', 'telegra.ph']],
  ].map(([name, words, domains]) => ({ name, words, domains, linkOnly: true }));
  const SHORT_BRAND_WORDS = ['interac', 'outlook', 'sparkasse', 'santander', 'google', 'amazon', 'microsoft', 'icici', 'hdfc', 'ups', 'att', 'ing', 'rbc', 'sbi', 'bnp', 'citi', 'chase', 'meta', 'steam', 'apple', 'poste', 'olx', 'scotia', 'bofa', 'hdfc', 'booking', 'intesa', 'adobe'];
  const NO_MISSPELL = ['icloud', 'outlook', 'booking', 'correos', 'telegram', 'netflix', 'google'];
  // edit distance where swapping two neighbouring letters counts as one change (amzaon = amazon)
  const editDistance = (a, b) => { if (Math.abs(a.length - b.length) > 2) return 9; const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) { d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); } return d[a.length][b.length]; };

  // ---------- disguises: letters from other alphabets, invisible characters ----------
  // Letters that look like English ones, mapped to the English letter they imitate.
  const LOOKALIKE = { 'а': 'a', 'в': 'b', 'е': 'e', 'ё': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y', 'х': 'x', 'ѕ': 's', 'і': 'i', 'ї': 'i', 'ј': 'j', 'һ': 'h', 'ԁ': 'd', 'ԛ': 'q', 'ԝ': 'w', 'ү': 'y', 'ӏ': 'l', 'ь': 'b', 'ʏ': 'y', 'α': 'a', 'β': 'b', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ν': 'v', 'ο': 'o', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x', 'ω': 'w', 'ո': 'n', 'ս': 'u', 'օ': 'o', 'հ': 'h', 'ց': 'g', 'ɑ': 'a', 'ə': 'e', 'ɡ': 'g', 'ı': 'i', 'ł': 'l', 'ø': 'o', 'đ': 'd', 'ħ': 'h', 'ŧ': 't', 'ð': 'd', 'ƅ': 'b', 'ɓ': 'b', 'ƈ': 'c', 'ɗ': 'd', 'ɛ': 'e', 'ƒ': 'f', 'ɠ': 'g', 'ɦ': 'h', 'ɨ': 'i', 'ɩ': 'i', 'ʝ': 'j', 'ƙ': 'k', 'ɱ': 'm', 'ɲ': 'n', 'ɵ': 'o', 'ƥ': 'p', 'ʠ': 'q', 'ʂ': 's', 'ƭ': 't', 'ʋ': 'v', 'ⱳ': 'w', 'ƴ': 'y', 'ʐ': 'z', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe' };
  const LOOKALIKE_RE = new RegExp('[' + Object.keys(LOOKALIKE).join('') + ']', 'g');
  const INVISIBLE_RE = /[\u00ad\u034f\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\u206a-\u206f\u3164\ufeff\uffa0]|\udb40[\udc00-\udc7f]/g;
  // the plain-English "skeleton" of some text: accents removed, look-alike letters swapped for the letter they copy
  const skeleton = s => (s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(LOOKALIKE_RE, c => LOOKALIKE[c]);
  // turn xn--pypal-4ve into pаypal (RFC 3492)
  function punyDecode(label) {
    if (!/^xn--/i.test(label)) return label;
    try {
      const input = label.slice(4).toLowerCase(); const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
      let n = 128, i = 0, bias = 72; const out = [];
      let b = input.lastIndexOf('-'); if (b < 0) b = 0;
      for (let j = 0; j < b; j++) out.push(input.charCodeAt(j));
      const digit = c => c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : base;
      const adapt = (delta, num, first) => { let k = 0; delta = first ? Math.floor(delta / damp) : delta >> 1; delta += Math.floor(delta / num); for (; delta > ((base - tMin) * tMax) >> 1; k += base) delta = Math.floor(delta / (base - tMin)); return Math.floor(k + (base - tMin + 1) * delta / (delta + skew)); };
      for (let idx = b > 0 ? b + 1 : 0; idx < input.length;) {
        const oldi = i;
        for (let w = 1, k = base; ; k += base) {
          if (idx >= input.length) return label;
          const d = digit(input.charCodeAt(idx++)); if (d >= base) return label;
          i += d * w; const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
          if (d < t) break; w *= base - t;
        }
        bias = adapt(i - oldi, out.length + 1, oldi === 0); n += Math.floor(i / (out.length + 1)); i %= out.length + 1;
        out.splice(i++, 0, n);
      }
      return String.fromCodePoint(...out);
    } catch (e) { return label; }
  }
  // A version of a message with disguises removed, plus which disguises were used.
  // Scammers hide words like "p a y", "acc0unt", "pаyment" (Cyrillic а) or put invisible characters inside words
  // so that filters don't match them. Genuine messages almost never do this.
  const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i', '|': 'l', '€': 'e' };
  function unmask(text) {
    const used = {};
    let t = text || '';
    // (soft hyphens are left out: genuine newsletters use them for line breaks)
    if ((t.match(/[a-z][\u034f\u180e\u200b-\u200f\u2060-\u2064\ufeff]+[a-z]|[a-z]\udb40[\udc00-\udc7f]/gi) || []).length >= 2) used.invisible = true;
    t = t.replace(INVISIBLE_RE, '');
    t = t.normalize('NFKC');
    // a word mixing English letters with look-alikes from other alphabets
    if (t.split(/\s+/).some(w => (w.match(/[a-z]/gi) || []).length >= 2 && /[\u0370-\u03ff\u0400-\u04ff\u0500-\u052f\u0530-\u058f]/.test(w) && (LOOKALIKE_RE.lastIndex = 0, LOOKALIKE_RE.test(w.toLowerCase())))) used.lookalike = true;
    LOOKALIKE_RE.lastIndex = 0;
    t = t.replace(/[^\u0000-ɏ\s]/g, c => { const l = c.toLowerCase(); return LOOKALIKE[l] || c; });
    // s p a c e d   o u t, s.p.a.c.e.d or s*p*a*c*e*d words (3 or more letters, at least two of them letters)
    t = t.replace(/(?<![\w.])(?:[a-z0-9@$](?: |[.*_·•\-] ?)){2,}[a-z0-9@$](?![\w])/gi, m => {
      const joined = m.replace(/[ .*_·•\-]/g, '');
      if ((joined.match(/[a-z]/gi) || []).length < 2 || /^\d/.test(joined) && /\d$/.test(joined)) return m;
      if (/^(?:[a-z]\.){2,}[a-z]?$/i.test(m.replace(/ /g, '')) && joined.length <= 4) return m; // e.g., u.s.a, a.m.
      used.spaced = true; return joined;
    });
    // numbers and symbols swapped in for letters inside words: acc0unt, p@yment, ver1fy
    t = t.replace(/[a-z0-9@$!|€]*[a-z][a-z0-9@$!|€]*/gi, whole => {
      // symbols at the start or end are punctuation (URGENT!, US$), not swapped letters
      const lead = whole.match(/^[@$!|€]*/)[0], trail = whole.slice(lead.length).match(/[@$!|€]*$/)[0];
      const w = whole.slice(lead.length, whole.length - trail.length);
      const out = (() => {
      if (!/[a-z]/i.test(w) || !/[0-9@$!|€]/.test(w) || /^\d+[a-z]{1,3}$/i.test(w) || /^[a-z]{1,3}\d+$/i.test(w) || /^\d/.test(w) && /\d$/.test(w)) return w;
      const fixed = w.replace(/[0-9@$!|€]/g, c => LEET[c] || c);
      if (/^[a-z]+$/i.test(fixed) && fixed.length >= 3) { used.leet = true; return fixed; }
      return w;
      })();
      return lead + out + trail;
    });
    t = t.replace(/\u0001(\d+)\u0001/g, (m, i) => kept[+i]);
    return { text: t, used };
  }
  const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'cutt.ly', 'rb.gy', 'shorturl.at', 'tiny.cc', 'buff.ly', 'rebrand.ly', 's.id', 'v.gd', 'qrco.de', 'lnkd.in', 't.ly', 'bl.ink', 'short.io', 'shorte.st'];
  const RISKY_TLDS = ['club', 'fun', 'space', 'pw', 'cc', 'skin', 'hair', 'beauty', 'mom', 'lol', 'today', 'top', 'xyz', 'click', 'icu', 'cfd', 'sbs', 'buzz', 'rest', 'cyou', 'monster', 'quest', 'gq', 'ml', 'cf', 'tk', 'ga', 'zip', 'mov', 'bond', 'live', 'online', 'site', 'shop', 'info', 'vip', 'win', 'loan', 'work', 'support', 'help', 'top', 'lat', 'autos', 'boats'];
  // Free website builders and hosting. Genuine sites use them too, but phishing pages very often do.
  const FREE_HOSTS = ['pages.dev', 'workers.dev', 'web.app', 'firebaseapp.com', 'github.io', 'netlify.app', 'vercel.app', 'webflow.io', 'weebly.com', 'weeblysite.com', 'wixsite.com', 'wix.com', 'godaddysites.com', '000webhostapp.com', 'glitch.me', 'repl.co', 'replit.app', 'replit.dev', 'herokuapp.com', 'blogspot.com', 'r2.dev', 'duckdns.org', 'ngrok.io', 'ngrok-free.app', 'square.site', 'carrd.co', 'framer.app', 'framer.website', 'notion.site', 'jimdosite.com', 'mystrikingly.com', 'yolasite.com', 'my.canva.site', 'canva.site', 'surge.sh', 'onrender.com', 'azurewebsites.net', 'web.core.windows.net', 'firebasestorage.googleapis.com', 'storage.googleapis.com', 's3.amazonaws.com', 'ipfs.io', 'dweb.link', 'translate.goog', 'webcindario.com', 'wcomhost.com', 'pantheonsite.io', 'myftp.org', 'servehttp.com', 'ddns.net', 'teachable.com', 'gitbook.io', 'webwave.dev', 'tilda.ws', 'mobirisesite.com', 'site123.me', 'business.site', 'hpage.com', 'sites.google.com', 'forms.gle', 'qualtrics.com', 'typeform.com', 'filesusr.com', 'cprapid.com', 'b-cdn.net'];
  const MULTI_SUFFIX = ['co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'nhs.uk', 'police.uk', 'sch.uk', 'net.uk', 'com.au', 'co.nz', 'co.za', 'com.br', 'co.jp', 'co.in'];

  // ---------- helpers ----------
  const norm = s => (s || '').toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
  const uniq = arr => [...new Set(arr)];

  function registeredDomain(host) {
    host = (host || '').toLowerCase().replace(/\.$/, '');
    const parts = host.split('.');
    if (parts.length <= 2) return host;
    const last2 = parts.slice(-2).join('.'), last3 = parts.slice(-3).join('.');
    // a site on a free host is its own website (abc.pages.dev), not "pages.dev"
    const fh = FREE_HOSTS.find(f => host === f || host.endsWith('.' + f));
    if (fh) { const n = fh.split('.').length; return parts.length > n ? parts.slice(-(n + 1)).join('.') : host; }
    if (MULTI_SUFFIX.includes(last2)) return last3;
    if (/^[a-z]{2}$/.test(parts[parts.length - 1]) && /^(com|co|org|net|gov|gob|ac|edu|or|ne|go|gouv|bank|gv|govt|nic|mil|ltd|plc|biz|info|web|in)$/.test(parts[parts.length - 2])) return last3;
    return last2;
  }
  function isOfficial(host, brand) {
    const tld = host.split('.').pop();
    if (brand.words.some(w => w.replace(/[^a-z0-9]/g, '') === tld) && ['google', 'microsoft', 'apple', 'amazon', 'netflix', 'barclays', 'hsbc', 'santander', 'natwest', 'nationwide', 'ups', 'dhl', 'booking'].includes(tld)) return true;
    const reg = registeredDomain(host);
    return brand.domains.some(d => reg === d || host === d || host.endsWith('.' + d));
  }

  // Find links in free text, including ones without http://
  function findLinks(text) {
    const out = [];
    const re = /\b((?:https?:\/\/|www\.)[^\s<>"')\]]+|(?:[a-z0-9-]+\.)+(?:com|co\.uk|uk|org|net|info|top|xyz|shop|online|site|live|click|icu|ly|io|me|app|link|cfd|sbs|buzz|vip|win|support|help|gq|tk|ml|ga|cf|bond|lat|cyou|rest|quest|monster|zip|mov)(?:\/[^\s<>"')\]]*)?)/gi;
    let m;
    while ((m = re.exec(text))) {
      let u = m[1].replace(/[.,;:!?]+$/, '');
      if (/@/.test(text.slice(Math.max(0, m.index - 1), m.index))) continue; // part of an email address
      out.push(u);
    }
    return uniq(out);
  }
  function parseUrl(raw) {
    let s = (raw || '').trim();
    if (!s) return null;
    if (s.length > 4000 || /^[\/.]/.test(s)) return null;              // a path on its own, like /shop/pay
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'http://' + s;
    let u; try { u = new URL(s); } catch (e) { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;                     // only web links
    const h = u.hostname;
    // a real web address has a dot in its name (banana isn't one), unless it's a number address
    if (!/^\[[0-9a-f:.]+\]$/i.test(h) && (!h.includes('.') || h.split('.').some(l => !l || l.length > 63))) return null;
    return u;
  }
  const decodePunycodeLabel = label => /^xn--/i.test(label);

  // ---------- link check ----------
  function checkLink(raw, context) {
    const signs = [];
    const u = parseUrl(raw);
    if (!u) return { ok: false, signs: [{ level: 'info', title: "That doesn't look like a web address", why: 'Check you copied the whole link.' }] };
    const host = u.hostname.toLowerCase();
    const reg = registeredDomain(host);
    const tld = host.split('.').pop();
    const ctx = norm(context || '');

    const numberHost = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^\[[0-9a-f:.]+\]$/.test(host);
    if (numberHost)
      signs.push({ level: 'high', title: 'The link is a number, not a name', why: 'Real companies use their own name in web addresses. Links that are just numbers are a common trick.' });
    // Addresses with letters from other alphabets: read them as the English letters they imitate.
    // xn--pypal-4ve.com shows on screen as pаypal.com (with a Cyrillic а), which pretends to be paypal.com.
    let lookHost = '';
    if (host.split('.').some(decodePunycodeLabel)) {
      lookHost = skeleton(host.split('.').map(punyDecode).join('.'));
      const fakeOf = BRANDS.concat(LINK_BRANDS).find(b => {
        if (isOfficial(host, b)) return false;
        if (isOfficial(lookHost, b)) return true;
        const lab = registeredDomain(lookHost).split('.')[0];
        return b.domains.some(d => { const dl = d.split('.')[0]; return dl.length >= 4 && (lab === dl || (dl.length >= 5 && editDistance(lab, dl) <= 1) || lookHost.split('.').slice(0, -1).includes(dl)); })
          || b.words.some(w => w.length >= 5 && !w.includes(' ') && new RegExp('(^|[.-])' + w + '([.-]|$)').test(lookHost));
      });
      if (fakeOf) signs.push({ level: 'high', title: `The address copies ${fakeOf.name} using look-alike letters`, why: `On screen this reads like ${fakeOf.name}'s website, but some letters come from another alphabet. ${fakeOf.name}'s real website is ${fakeOf.domains[0]}.` });
      else if (host.split('.').map(punyDecode).some(l => /[a-z]/.test(l) && /[^\u0000-ɏ]/.test(l) && (LOOKALIKE_RE.lastIndex = 0, LOOKALIKE_RE.test(l.toLowerCase()))))
        signs.push({ level: 'medium', title: 'The address uses look-alike letters', why: "Some letters from other alphabets look identical to English ones, so a fake address can look exactly like a real one." });
      else
        signs.push({ level: 'info', title: 'The address is written in another alphabet', why: 'That’s normal for websites in many languages. Check it’s the site you expect.' });
    }
    // (amazon.com.br and google.com.tr are the brands' own country sites; mcas.ms is Microsoft's own security proxy)
    const prefixFake = !numberHost && reg !== 'mcas.ms' && BRANDS.concat(LINK_BRANDS).find(b => !isOfficial(host, b) && b.domains.some(d => d.includes('.') && (host.startsWith(d + '.') || host.startsWith('www.' + d + '.') || host.includes('.' + d + '.')) && reg.split('.')[0] !== d.split('.')[0] && !new RegExp('(^|\\.)' + d.replace(/\./g, '\\.') + '\\.[a-z]{2}$').test(host)));
    if (prefixFake) signs.push({ level: 'high', title: `The address starts like ${prefixFake.name}'s but goes somewhere else`, why: `It begins with ${prefixFake.name}'s real address, but the part that counts is at the end: ${reg}. ${prefixFake.name}'s real website is ${prefixFake.domains[0]}.` });
    // a well-known name split up with dots: ama.zon.com, pay.pal.com
    const joinedHost = host.split('.').slice(0, -1).join('');
    const splitFake = !lookHost && host.split('.').length >= 3 && BRANDS.concat(LINK_BRANDS).find(b => !isOfficial(host, b) && b.domains.some(d => { const dl = d.split('.')[0]; return dl.length >= 5 && joinedHost === dl + (d.split('.').length > 2 ? d.split('.').slice(1, -1).join('') : ''); }));
    if (splitFake) signs.push({ level: 'high', title: `The address splits up the name ${splitFake.name}`, why: `Dots have been added so it reads like ${splitFake.name} at a glance. ${splitFake.name}'s real website is ${splitFake.domains[0]}.` });
    if (/@/.test(u.href.split('?')[0].replace(/^[a-z]+:\/\//i, '').split('/')[0]))
      signs.push({ level: 'high', title: 'The link hides its real destination', why: 'Everything before the @ sign is ignored by your browser. The real website is the part after it.' });
    if (SHORTENERS.includes(reg) || SHORTENERS.includes(host))
      signs.push({ level: 'medium', title: 'This is a shortened link', why: "Short links hide where they really go. That's not always bad, but scammers use them a lot." });
    if (RISKY_TLDS.includes(tld))
      signs.push({ level: 'medium', title: `The address ends in .${tld}`, why: 'Cheap web address endings like this are used far more often by scam sites than by UK companies.' });
    // On its own, http is common in genuine emails, so inside a message it's only a note
    if (u.protocol === 'http:' && /^https?:\/\//i.test(raw.trim()))
      signs.push({ level: ctx ? 'info' : 'low', title: 'The link is not secure (http, not https)', why: "Anything you type on an http page can be read by others. Don't enter details there." });
    const labels = host.split('.');
    const freeHost = FREE_HOSTS.find(f => host === f || host.endsWith('.' + f)) || '';
    let path = (u.pathname + u.search).toLowerCase().slice(0, 600);
    try { path = decodeURIComponent(path); } catch (e) { /* badly encoded links still get checked as they are */ }
    const ACCOUNT_WORDS = /(log-?in|sign-?in|signon|verif|secure|account|update|unlock|suspend|confirm|billing|wallet|webscr|banking|auth|password|recover|restore|redeliver|reschedule|payment|refund|invoice|customs|parcel|tracking)/;
    if (labels.length >= 6 && !/\.(ac|gov|nhs|sch|police)\.uk$/.test(host))
      signs.push({ level: 'medium', title: 'The address has lots of parts', why: 'Long addresses with many dots are often used to push a familiar name to the front while the real site is at the end.' });
    // randomly generated names, like ngdrse43rgdsges.web.app or qwo231sdx.club
    const core = (freeHost ? host.slice(0, -(freeHost.length + 1)).split('.').pop() : reg.split('.')[0]) || '';
    const randomish = core.length >= 9 && (/[bcdfghjklmnpqrstvwxz]{7,}/.test(core) || (/\d/.test(core) && /[a-z]/.test(core) && (core.match(/\d/g) || []).length >= 2 && !/^[a-z]+\d{1,4}$/.test(core) && !/-/.test(core)));
    if (randomish)
      signs.push({ level: 'medium', title: 'The address looks randomly generated', why: 'Real companies use names you can read. Jumbled letters and numbers are typical of throwaway scam sites.' });
    if (freeHost)
      signs.push({ level: 'low', title: `The site is on a free website service (${freeHost})`, why: 'Anyone can make a site like this in minutes. Banks, couriers and government sites never use them.' });
    if ((reg.replace(/^xn--/, '').match(/-/g) || []).length >= 2)
      signs.push({ level: 'low', title: 'The website name has several hyphens', why: 'Names like secure-account-update are a common pattern for fake sites.' });

    // brand look-alike: brand name appears in the address, but it isn't that brand's site
    const regLabel = (freeHost ? core : reg.split('.')[0]) || '';
    BRANDS.concat(LINK_BRANDS).forEach(b => {
      const token = b.words.map(w => w.replace(/[^a-z0-9-]/g, '')).filter(Boolean);
      // the address without the ending (.com, .co.uk), split into its parts
      const subLabels = host.slice(0, Math.max(0, host.length - reg.length)).split('.').filter(Boolean);
      const shortWord = t => SHORT_BRAND_WORDS.includes(t);
      // brand as a whole word in the main name (paypal-secure.com) or as a whole part in front of it (paypal.com.verify.ru)
      const inReg = token.find(t => t.length >= 3 && (regLabel === t || new RegExp('(^|-)' + t + '(-|$)').test(regLabel) || (!shortWord(t) && t.length >= 5 && (regLabel.startsWith(t) || regLabel.endsWith(t)))));
      const inSub = token.find(t => t.length >= 4 && !shortWord(t) && subLabels.some(l => l === t || new RegExp('(^|-)' + t + '(-|$)').test(l)));
      const inHost = !!(inReg || inSub);
      const ownCountrySite = b.domains.some(d => regLabel === d.split('.')[0]) && !freeHost;
      if (inHost && !isOfficial(host, b) && !ownCountrySite) {
        // "bancosantander.es" could be the company's own; "paypal-secure-login.top" is not. Risky extras make it strong.
        const risky = freeHost || RISKY_TLDS.includes(tld) || ACCOUNT_WORDS.test(host) || randomish || inSub || /^xn--/.test(regLabel) || /\d/.test(regLabel);
        signs.push({ level: risky ? 'high' : 'medium', title: `Uses the name "${b.name}" but isn't their website`, why: `${b.name}'s real website is ${b.domains[0]}. This link goes to ${reg}.` });
      }
      else if (!b.linkOnly && ctx && b.words.some(w => ctx.includes(w)) && !isOfficial(host, b) && !SHORTENERS.includes(reg))
        signs.push({ level: 'medium', title: `Mentions ${b.name}, but the link goes elsewhere`, why: `${b.name}'s real website is ${b.domains[0]}. This link goes to ${reg}.` });
      // brand name hidden in the rest of the address: example.com/paypal/login
      else if (!inHost && token.some(t => t.length >= 4 && !SHORT_BRAND_WORDS.includes(t) && new RegExp('(^|[^a-z0-9])' + t + '([^a-z0-9]|$)').test(path)) && !isOfficial(host, b) && ACCOUNT_WORDS.test(path))
        signs.push({ level: freeHost ? 'high' : 'medium', title: `The address mentions ${b.name}, but isn't their website`, why: `${b.name}'s real website is ${b.domains[0]}. This link goes to ${reg}.` });
    });
    // misspelt brand names: barclayis.co, paypa1.com, rnicrosoft.com
    if (regLabel.length >= 5) {
      const seen = new Set();
      BRANDS.concat(LINK_BRANDS).forEach(b => b.domains.concat(b.words.filter(w => /^[a-z]{6,}$/.test(w))).forEach(d => {
        const lab = d.split('.')[0];
        if (lab.length < 6 || NO_MISSPELL.includes(lab) || seen.has(b.name) || isOfficial(host, b) || regLabel === lab || regLabel.replace(/-/g, '') === lab || regLabel.length < 6) return;
        const fix = x => x.replace(/0/g, 'o').replace(/1/g, 'l').replace(/rn/g, 'm');
        const dist = editDistance(fix(regLabel), lab);
        // also each part between hyphens with numbers swapped in for letters: paypa1-login.com
        const partHit = regLabel.includes('-') && regLabel.split('-').some(pt => pt.length >= 6 && pt !== lab && fix(pt) === lab);
        if (dist === 0 || dist === 1 || (dist === 2 && lab.length >= 9) || partHit) {
          seen.add(b.name);
          signs.push({ level: 'high', title: `The address is a misspelling of ${b.name}`, why: `${b.name}'s real website is ${b.domains[0]}. This one is ${reg}, which is spelt to look like it.` });
        }
      }));
    }
    // fake sign-in pages planted on hacked websites, a classic phishing kit pattern
    if (/\/(wp-content|wp-admin|wp-includes)\//.test(path) && /(log-?on|log-?in|sign-?in|auth|verif|secure|account|update|webmail|\.php|\.html?)/.test(path.replace(/^.*\/(wp-content|wp-admin|wp-includes)\//, '')) && !/\.(jpe?g|png|gif|webp|svg|css|js|pdf|mp4|woff2?)(\?|$)/.test(path))
      signs.push({ level: 'high', title: 'This looks like a fake page hidden on a hacked website', why: 'Pages buried inside a website’s system folders that ask you to sign in are a classic sign of a phishing page planted on a hacked site.' });
    else if (/\/[a-f0-9]{32}\//.test(path) && /(log|sign|auth|verif|full|index|\.php)/.test(path))
      signs.push({ level: 'high', title: 'This looks like a phishing kit page', why: 'Long random codes in the address followed by a sign-in page are typical of ready-made scam kits.' });
    if (/\/(login|logon|signin|logowanie|anmelden|connexion|acceso|authori[sz]e|verification|verify|validate|update|confirm|full|auth)\.(php|aspx?|html?)\b/.test(path) && !BRANDS.concat(LINK_BRANDS).some(b => isOfficial(host, b)))
      signs.push({ level: 'low', title: 'The link goes straight to a sign-in or verify page', why: 'Links in messages that open a sign-in or "verify" page directly are a common way to steal passwords. Open the app or website yourself instead.' });
    if (freeHost && (ACCOUNT_WORDS.test(host) || ACCOUNT_WORDS.test(path)))
      signs.push({ level: 'high', title: 'A free website asking you to sign in, verify or pay', why: 'Free website services are often used for fake sign-in and payment pages. A real company would use its own website.' });
    if (/(login|log-in|signin|verify|verification|secure|account|update|unlock|suspend|confirm|billing|wallet|redeliver|reschedule|payment|refund)/.test(host.replace(reg, '')))
      signs.push({ level: 'low', title: 'The address is full of account words', why: 'Words like "verify", "secure" or "update" placed in front of the real site name are a common phishing pattern.' });

    // The two lists (lists.js): known scam websites, and well-known genuine websites.
    const LISTS = root.DoormanLists;
    let out = signs;
    if (LISTS && LISTS.isKnown(host, reg)) {
      const d = LISTS.knownDate();
      out = [{ level: 'high', title: 'This website has been reported as a phishing site', why: `It's on a public list of reported phishing websites that Doorman keeps on your device${d ? ` (updated ${d})` : ''}. Sometimes a genuine site is listed because criminals broke into it, so either way don't sign in, pay or download anything here.` }].concat(signs);
    } else if (LISTS && LISTS.isTop(reg)) {
      // A very popular website: small oddities in its name (an unusual ending, hyphens, a brand-like word) are expected,
      // so those notes are dropped. Warnings about the rest of the address (hacked pages, scam kits) still count.
      const WEAK = /^(The address ends in|The address looks randomly generated|The website name has several hyphens|The address is full of account words|The address has lots of parts|Uses the name|The address is a misspelling|The address uses look-alike letters|The address copies|The address splits up|The link goes straight to a sign-in)/;
      out = signs.filter(s => !WEAK.test(s.title));
    }
    if (numberHost) out = out.filter(x => !/randomly generated/.test(x.title));
    return { ok: true, host, registered: reg, shown: u.href, signs: dedupe(out) };
  }

  // ---------- message check ----------
  const RULES = [
    { level: 'medium', title: 'It rushes you', why: 'Scams create panic so you act before you think. Real organisations give you time.', re: /\b(within (24|48|12|72|2|3) ?(hours|hrs|h|days)\b|final (notice|warning|demand)|last warning|act now|(?<!code )(?<!code will )(?<!it will )expires? (today|tonight)|immediate(ly)? (action|attention|payment)|(urgent|immediate) action|to avoid (suspension|closure|a (fine|penalty|charge)|being (blocked|charged|suspended)|(your )?(account|card|service) being))\b/ },
    { level: 'low', title: 'It sounds urgent', why: 'Urgency alone is common, but scams use it to stop you thinking.', re: /\b(urgent(ly)?|immediately|as soon as possible|asap|right away|today only|last chance)\b/ },
    { level: 'medium', title: 'It threatens to close, block or fine you', why: 'Threats like suspended accounts, fines or court action are a classic pressure tactic.', re: /\b(account|a\/c|card|service|access|licen[cs]e|sim|line|profile|payment|parcel|package|order|vehicle|bank|wallet|number|subscription|membership|id|yono|upi)\b[^.!?\n]{0,40}\b(suspend(ed|ing|sion)?|lock(ed)?|block(ed)?|deactivat(ed|ion)|disabl(e|ed|ing)?|clos(ed|ure)|restrict(ed|ion)|terminat(ed|ion)|cancel(l?ed|lation)?|frozen|freez(e|ing)|disconnect(ed|ion)?|delet(ed|ion)|limited)\b|\b(suspend|lock|block|deactivat|disabl|restrict|terminat|freez|disconnect|delet)\w*\b[^.!?\n]{0,25}\b(your|the) (account|card|service|access|licen[cs]e|sim|line|number|wallet)\b|\b(avoid (a |the |any )?(blockage|blocking|block|suspension|deactivation|penalt(y|ies)|disconnection)|preventively blocked|(have|has) been (temporarily |preventively )?blocked|unblock (it |them |your \w+ )?(here|now|via|at)|quarantine zone|will be disconnected|(placed|put) (a |some )?(restrictions?|limits?|holds?) on (your )?(account|profile|card)|(contract|access|card|account) (has )?expired)\b|\b(court action|bailiffs?|legal action|police will|prosecut\w*|enforcement (action|agent)|warrant|penalty charge|fine of|(further|additional) (charges|penalties|fees))\b/ },
    { level: 'high', title: 'It asks for a security code or password', why: 'No real company will ever ask you to send them a one-time code, PIN or password. Anyone who does is trying to get into your account.', re: /\b(send|share|give|tell|read|forward|reply with|text) (me |us )?(the |your |that |a )?(\d-digit )?(one[- ]time (pass)?code|verification code|security code|code|otp|passcode|pin|password|memorable (word|information)|login details)\b|\b(code|otp|pin) (i|we) (just )?(sent|texted)\b|\bsent my (verification |security )?code to your\b|\b(enter|confirm|provide) your (pin|password|memorable|login details)\b|\b(what'?s|what is|what are|tell me|read (back|out)|give me|i need|need|see|share) (the |that |your )?(\d|six|four|5|five)?[- ]?(digits?|digit code|code|passcode|one[- ]time passcode|otp|pin)\b[^.!?\n]{0,40}\b(you (just )?(got|received)|sent to (your|you)|from (your|the) (bank|latest text|text|phone)|on your phone|just (came|arrived|sent))|\b(code|passcode|pin|otp) (just |that was )?(sent|texted) to (your|you)[^.!?\n]{0,20}\b(what is it|what'?s it|tell me|send it|read it)|\bread back (the )?(access |security |one[- ]time )?code\b|\b(the )?(pin|passcode|code) from your (latest |last )?(text|sms|message)\b/ },
    { level: 'high', title: 'It asks for card or bank details', why: 'Sharing card or bank details by message or a link is how most fraud starts.', re: /\b(send\w*|provid\w*|confirm\w*|enter\w*|updat\w*|reply\w*|giv\w*|tell|text|shar\w*|need\w*|verif\w*|input\w*|fill\w*|typ\w*|read out|what'?s|what is|submit\w*|complet\w*|requir\w*|includ\w*|link\w*|add\w*|re-?enter\w*)\b[^.!?\n]{0,40}\b(card (number|details|information|info|data)|cvv|cvc|long number|sort code|account number|bank details|expiry date|security number on the back|last (four|4|three|3) digits (on|of) (your|the) card)\b|\b(cvv|cvc|security number on the back)\b/ },
    { level: 'high', title: 'It asks you to move money to a "safe account"', why: 'Your bank will never ask you to move money to keep it safe. This is always a scam.', re: /\b(safe account|secure account|holding account|move (your )?(money|funds|savings)|transfer (your )?(money|funds|savings) (to|into))\b/ },
    { level: 'high', title: 'It wants payment in gift cards or crypto', why: 'Gift cards, vouchers and cryptocurrency are almost impossible to get back, which is why scammers ask for them.', re: /\b(pay|paying|payment|paid|settle|refund|fee|fine|tax|bill|charge)\b[^.!?\n]{0,40}\b(in|with|using|via|by|through) (gift ?cards?|vouchers?|itunes|google play|steam( cards?)?|bitcoin|btc|crypto(currency)?|usdt|tether)\b|\b(gift ?cards?|vouchers?|itunes|google play|steam)( cards?)? (codes?|numbers?|pins?)\b|\b(send|text|tell|read|give|photo|picture|scratch)\b[^.!?\n]{0,40}\b(gift ?cards?|vouchers?)\b[^.!?\n]{0,25}\b(codes?|numbers?|pins?|back)\b|\b(buy|purchase|get)\b[^.!?\n]{0,30}\b(gift ?cards?|itunes|google play|steam cards?)\b[^.!?\n]{0,60}\b(codes?|numbers on|photo|picture|scratch|refund|to pay|send (me|them|us))\b|\b(send|transfer|deposit|invest|move|convert)\b[^.!?\n]{0,30}\b(bitcoin|btc|crypto(currency)?|usdt|tether|ethereum)\b|\b(buy|purchase|get|pick up)\b[^.!?\n]{0,30}\b(gift ?cards?|itunes|google play|steam cards?)\b[^.!?\n]{0,60}\b(right now|urgent\w*|asap|for (a|our|my) (client|customer|meeting)|for me today|don'?t tell)|\b(did you|you have|you'?ve) (purchas|buy|bought|order)\w* [^.!?\n]{0,30}\bgift ?cards?\b|\bwallet address\b|\b(bitcoin|crypto) (atm|machine)\b|\b(bitcoin|btc|usdt|tether|ethereum|cryptocurrency)\b/ },
    { level: 'medium', title: 'It asks for a small fee', why: 'A small "redelivery", "customs" or "unpaid" fee is a common way to get your card details.', re: /\b(redeliver(y)? (fee|charge|cost)|customs (fee|charge|duty)|unpaid (fee|postage|toll|balance|charge)|outstanding (fee|balance|payment|charge|toll)|small (fee|charge|payment)|(settlement|shipping|postage|handling) (fee|charge|of)|toll (charge|balance|fee)|not (accepted|paid) the)\b|\b(pay|payments?|fees?|charges?|due|cost|unpaid|not (been )?paid|outstanding|settle|small|upgrade|renew|for only|just|customs|postage|shipping|duty|toll|retrieve|release)\b[^.!?\n]{0,60}((£|gbp ?|\$|€)\s?[0-4][.,]\d{2}\b|\b[0-4][.,]\d{2} ?(€|eur\w*|gbp))|((£|gbp ?|\$|€)\s?[0-4][.,]\d{2}\b|\b[0-4][.,]\d{2} ?(€|eur|gbp))[^.!?\n]{0,60}\b(fees?|charges?|to pay|is due|outstanding|unpaid|not (been )?paid|to release|to reschedule|to rebook|now|today|customs|postage|shipping|duty)\b|(£|\$|€)?\s?\d[.,]\d{2} ?(\/|per) ?(msg|txt|text|sms|week|wk|min|call)\b/ },
    { level: 'medium', title: 'It says there is a problem with a delivery', why: 'Fake "missed delivery" messages are the most common scam text in the UK. Track parcels in the courier’s own app or website.', re: /\b(missing (street|house|address|postcode|delivery) ?(information|info|number|details)?|incomplete (address|delivery)|(unable|could ?n[o']?t|cannot|failed) to (deliver|be delivered|complete (the |your )?delivery|continue (the )?delivery)|delivery (failed|attempt|was unsuccessful|has been (suspended|paused|cancelled|delayed)|paused|suspended|on hold|exception)|(parcel|package|item|shipment|order) (is |has been |was )?(on hold|held|pending|returned|delayed|paused|stopped|undeliverable|waiting)|reschedule (your |the )?(delivery|order|parcel)|(arrange|book|select|choose) (a |another |your )?(redelivery|new delivery|delivery (date|time))|transit (center|centre|warehouse|hub)|update (your )?(delivery |shipping )?address|address (is )?(incorrect|incomplete|invalid|wrong)|no ?one (was )?(home|in|answered|available)|(rebook|book) a (new )?(slot|delivery|time)|returned to (the )?sender|pending (instructions|action|delivery)|several attempts|we (tried|attempted) to deliver|attempted delivery|(check|confirm) and accept|(fill in|complete|confirm) (the |your )?(address|delivery (details|information))|(insufficient|no|unpaid|missing) postage|due to (your )?absence|(pending|stopped|held|waiting|arrived) (at|in) (the |our )?(distribution|sorting|import|customs|transit|delivery) (center|centre|hub|depot|facility|warehouse)|(shipment|parcel|package|order) (has been |was )?reverted|pending (confirmation|payment)|(confirm|pay) (the )?(customs|import) (payment|duty|fee|declaration)|fill (out|in) the (customs |import )?declaration|(no|missing|without a|without the) (flat|house|door) number|send (us |me )?your full address)\b/ },
    { level: 'medium', title: 'It says you owe money', why: 'Messages claiming an unpaid bill, toll or fine push you to pay quickly through their link. Check the account yourself instead.', re: /(£|gbp ?|€|\$)\s?\d+([.,]\d{2})? ?(€|eur|usd)? (is|now|still) (due|owed|outstanding|overdue)|\blate (payment|fee|charge) of|\b(recalculated|(payment|bill|invoice|charge|toll|fee|balance) (is |was |has been )?(overdue|unpaid|outstanding|declined|unsuccessful|failed|rejected)|(overdue|unpaid|outstanding) (bill|invoice|payment|charge|toll|balance|fine)|could not (process|take|collect) (your )?(payment|direct debit)|direct debit (has )?failed|final (demand|bill)|(a|your|the) (fine|penalty|ticket|toll|parking charge) (to pay|is (due|pending|unpaid)|remains (unpaid|outstanding))|settle (it|this|the (amount|fine|balance|payment|charge|toll)|your (fine|balance|payment|account|toll))|payment remains outstanding|(bill|invoice) is not (updated|paid))\b/ },
    { level: 'medium', title: 'It asks you to sign in, reset or verify your account', why: 'Links that ask you to verify, unlock or reset an account lead to fake sign-in pages. Open the app or website yourself instead.', re: /\b(reset|verify|validate|confirm|unlock|reactivate|re-activate|restore|secure|recover|update) (your |the )?(password|account|access|identity|id|login|profile|apple id|card)\b|\b(unusual|suspicious|unauthori[sz]ed) (activity|sign-?in|log-?in|login|access|transaction|payment)|(sign-?in|log-?in|login) (attempt|from a new|detected)|new device (has been )?(added|registered|linked)|\bkyc\b|\bpan (card|number)\b|\b(limited|restricted|suspended|blocked|frozen|on hold) (your )?(card|account|access|online|profile)|block (has been )?placed on|\bregain (access|control)|\b(is|been|was) compromised?\b|under verification|(complete|confirm|finish) (the |your )?(id|identity) (authentication|verification|check)|\bauthenticat(e|ion) (your|the)\b|(activate|install|enable) (the |your )?(new )?[a-z' -]{0,20}(security|safety|protection) (system|feature|key|update)|\bmay (be )?compromised|needs? to be re-?verified|(card|debit card|bank card|account) (is|has become) (outdated|out of date|expired)|(request|order|activate) (the |your )?(new |renewed |updated |replacement )(debit |bank )?card|(update|confirm|verify) (your )?mobile (device|number)|missing (some )?(info|information|details)|violation of (our )?(terms|policy)|\breactivat\w*|(verify|confirm|review) (and verify )?(your )?(recent )?(transactions?|payments?|purchases?)/ },
    { level: 'medium', title: 'It’s about a health test, pass or prescription', why: 'Fake NHS and health messages ask you to order tests or passes through a link. The NHS doesn’t charge for these by text.', re: /\b(close contact|exposed to|tested positive|new variant|omicron|pcr test|test(ing)? kit|covid pass|vaccine pass|prescription (is )?(ready|waiting|due) .*(link|click|tap))\b/ },
    { level: 'high', title: 'It asks you to send back a code', why: 'A message saying a code was "sent to you by mistake" is how criminals take over WhatsApp and other accounts. Never send it.', re: /\bcode (to you |was sent to you )?by mistake|\bsent (you |it to you |a code to you )?.{0,20}by mistake|\b(send|forward|share) (it|the code|that code|me the code|the number) back\b|\b(text|message) (me )?(the )?(\d[- ]?digit )?code (you|that) (just )?(got|received)\b/ },
    { level: 'medium', title: 'It asks you to call a number about a payment you didn’t make', why: 'Fake "fraud team" and "cancel your renewal" messages give a number that connects to the scammer. Call the number on your card or the company’s website instead.', re: /\b(if not you|if (this|it) (was|wasn'?t|is) not you|if (this|it) wasn'?t you|if you did(n'?t| not) (authori[sz]e|make|request|recogni[sz]e)|not authori[sz]ed by you|to cancel|to dispute|to stop (this|the) (payment|transaction))\b[^.!?\n]{0,60}\b(call|ring|phone|contact)\b[^.!?\n]{0,40}(0\d{3}|0800|\+44|\d{3,4} ?\d{3} ?\d{3,4})|\b(call|ring|phone)\b[^.!?\n]{0,40}(0\d{3}|0800|\+44)[^.!?\n]{0,40}\b(to cancel|if (this|it) wasn'?t you|immediately|fraud team|to stop)\b|\bpress (one|1|9) to speak\b|\b(we|you'?ve been|you were|you have been) (charged|billed|debited)\b[^\n]{0,60}\b(call|ring|phone)\b[^\n]{0,30}(0\d{3}|0800|\+44|\d{3,4} ?\d{3} ?\d{3,4})|\b(call|ring|phone)\b[^.!?\n]{0,10}(0\d{3,4} ?\d{3} ?\d{3,4}|0800 ?\d{3} ?\d{3,4}|\+44[\d ]{9,13})[^.!?\n]{0,20}\b(for (a|your) refund|to (get|claim) (a|your) refund)\b/ },
    { level: 'high', title: 'It asks you to reply so a link starts working', why: 'Phones turn off links from unknown senders. Scammers ask you to reply "1" or "Y" so the link becomes tappable.', re: /\breply (with )?["“']?(1|y|yes)["”']?[^.!?\n]{0,30}\b(activate|enable|open|access|get|click|tap)[^.!?\n]{0,10}\blink|\b(copy|paste) (the |this )?link (in|into|to) (your |a )?browser|\bre-?open (this|the) (message|text|sms)\b/ },
    { level: 'high', title: 'It uses a celebrity to sell an investment', why: 'Fake adverts using Martin Lewis, Dragons’ Den stars and other celebrities are a major UK investment scam. They never endorse these.', re: /\b(martin lewis|elon musk|dragons'? den|deborah meaden|peter jones|steven bartlett|richard branson|holly willoughby|ant (and|&) dec|gordon ramsay|jeremy clarkson)\b[^\n]{0,120}\b(invest|platform|crypto|bitcoin|trading|profit|income|£\d)|\bturn £?\d[\d,]* into £?\d[\d,]*/ },
    { level: 'medium', title: 'It offers a job out of the blue', why: 'Unexpected job offers with high daily pay, usually moving to WhatsApp or Telegram, are a common scam that ends with you paying them.', re: /\b(recruit(er|ment|ing)|hiring|headhunt\w*|job (offer|opportunity|vacancy)|part[- ]time (job|role|work|position)|remote (job|work|position)|freelancers?|(work|job) from (home|your phone))\b[^\n]{0,120}\b(£\s?\d+ ?(-|to) ?£?\s?\d+|per day|a day|daily (pay|salary|income)|interested\?|whatsapp|telegram|flexible (hours|time)|no experience)/ },
    { level: 'high', title: 'Asks for PayPal "friends and family"', why: 'Friends and family payments have no buyer protection, which is why scammers ask for them.', re: /\b(friends (and|&) family|f ?& ?f|f and f|as a gift|send (it )?as gift|paypal gift)\b/ },
    { level: 'high', title: 'Offers to pay more than the price', why: 'Overpaying and asking for the difference back is a classic scam. The original payment disappears later.', re: /\b(overpa(y|id|yment)|send (back|you back) the (difference|rest|change|balance|extra)|(send|refund|pay|transfer|return) (me |it )?(back )?the (extra|difference|excess)( back)?|extra [^.!?\n]{0,40}(send|pay|transfer) [^.!?\n]{0,20}back)\b/ },
    { level: 'high', title: 'Sends a link to "receive" or "confirm" your payment', why: 'You never need to click a link or enter card details to receive money. Fake payment pages steal card details.', re: /\b(receive (your )?(payment|money|funds)|(click|tap|use|open) (the |this )?link to (get paid|receive|accept)|verify (to receive|your account to receive)|claim (your )?(money|funds|payment)|secure (deal|payment) link|safe ?deal)\b/ },
    { level: 'high', title: 'Wants a deposit or rent before you view', why: 'Never pay anything before you have viewed a property in person and checked who the landlord is.', re: /\b(deposit (before|to secure|to reserve|to hold)|pay (the )?(deposit|first month|holding deposit) (first|now|before)|before (the |a )?viewing|secure (the )?(room|flat|property) (with|by paying))\b/ },
    { level: 'high', title: 'The landlord is away and will post the keys', why: '"I’m abroad, I’ll post you the keys once you pay" is one of the most common UK rental scams.', re: /\b(post (you )?the keys|send (you )?the keys|keys (by|in the) (post|mail|courier))\b|\b(abroad|overseas|out of the country)\b[^\n]{0,120}\b(room|flat|property|tenancy|rent|viewing|deposit|keys)\b|\b(room|flat|property|tenancy|rent|viewing|deposit)\b[^\n]{0,120}\b(abroad|overseas|out of the country)\b/ },
    { level: 'medium', title: 'It offers money you did not expect', why: 'Unexpected refunds, rebates, prizes or winnings are bait.', re: /\b(you('ve| have)? won|winner|prize|claim your|tax (rebate|refund)|refund (is|of)|you are (owed|eligible)|compensat\w*|indemnity|cashback|reward of|grant of|benefit (program|programme|payment)|stimulus|e-?transfer|you (have )?received (a|an) (payment|transfer|deposit)|(energy|fuel|cost of living|winter|heating|state) (allowance|payment|aid|support|grant|rebate)|state aid|special assistance|still (have|need) to receive|(an amount|the amount|amount) (of \S+ )?(to receive|is waiting|awaits)|to (receive|collect|claim) (the|this|your) (amount|aid|payment|money|funds|refund|allowance)|can be credited|(pre-?approved|successfully obtained) (a )?(loan|credit)|(£|\$|€)\s?[\d,]+ ([a-z&']+ ){0,2}(vouchers?|gift ?cards?)|(won|win|selected for|chosen for|claim|redeem|free|awarded) ([a-z0-9£$€,&']+ ){0,4}(vouchers?|gift ?cards?)|\d+ (pounds |quid )?(worth )?of ([a-z]+ ){0,3}vouchers|vouchers?(-| )(to be won|up for grabs))\b/ },

    { level: 'high', title: 'It asks you to approve a payment request', why: 'Payment requests you approve take money out of your account. Someone you don’t know is asking you to pay them.', re: /\b(has |have )?requested (money|payment|rs\.?\s?\d|\d)[^.!?\n]{0,40}\bfrom you\b|\bwill be debited[^.!?\n]{0,40}\b(on |upon |after )?approv(ing|al|e)\b|\breply ["“']?(yes|y|1)["”']? to (approve|authori[sz]e|confirm) (this|the)? ?(transaction|payment|charge|purchase)/ },
    { level: 'medium', title: 'It says a change was made and asks you to check through a link', why: 'Fake "new payee", "new card ordered" or "direct debit set up" alerts push you to a link to stop it. Check in your banking app instead.', re: /(if (this|it) was(n'?t| not) (you|done by you|requested by you)|if you did(n'?t| not) (request|make|authori[sz]e|recogni[sz]e|do) (this|it|that)|(is this|was this) not (correct|you)|if you do(n'?t| not) recogni[sz]e (this|the|it))\b[^\n]{0,60}\b(visit|click|tap|follow|link|via|go to)\b|\b(new payee|replacement card|new device|direct debit (order|mandate|instruction))\b[^\n]{0,120}\b(not you|did not request|didn'?t request)\b[^\n]{0,60}\b(visit|click|tap|follow|link|via|go to|sign in here|log ?in here)\b/ },
    { level: 'medium', title: 'It tries to make you curious about a photo, video or message', why: '"Is this you in this video?" and "you have a new MMS, read here" are bait to get you to open a scam link.', re: /(is this you|is that you|why is your (picture|photo|pic|name)|you('ve| have) (received|got) (a|an) (mms|voice ?mail|voice message|secure message)|(see|look at|watch) (this|the) (photo|picture|video) (of you|i found))\b/ },
    { level: 'high', title: 'It asks for your crypto wallet recovery words', why: 'The 12 or 24 recovery words (seed phrase) give total control of a crypto wallet. No genuine company or support team ever asks for them.', re: /\b(seed|recovery|secret|backup|mnemonic) (phrase|words?)\b|\b(12|24|twelve|twenty[- ]four)[- ](recovery |secret |seed |backup )?words\b[^.!?\n]{0,40}\b(wallet|coins?|crypto|recover|restore)|\b(wallet|ledger|trezor|metamask|trust wallet)\b[^.!?\n]{0,60}\b(restore|re-?sync|validate|verify|recover|unlock)\b[^.!?\n]{0,40}\b(phrase|words|private key)\b|\bprivate key\b/ },
    { level: 'high', title: 'It says their bank details have changed', why: '"Our bank account has changed, please pay the new one" is how invoice and builder scams redirect payments. Call the person or company on a number you already have before paying.', re: /\b(our|my|the|their|its) (bank )?(account|bank details|payment details|account details|banking details) (has|have) (now )?(changed|been (changed|updated))\b|\b(new|updated|revised|different) (bank |payment )?(account|bank details|payment details|sort code)\b[^.!?\n]{0,40}\b(pay|payment|invoice|transfer|balance)\b/ },
    { level: 'medium', title: 'It asks for ID documents', why: 'Photos of your passport, driving licence or bank statements can be used to open accounts in your name. Only send them through a company’s own app or website after checking who you’re dealing with.', re: /\b(send|reply with|upload|share|need|see|email|text|attach|forward)\b[^.!?\n]{0,40}\b(passport|driving licen[cs]e|licen[cs]e|id card|photo id|bank statements?|utility bill|selfie (with|holding))\b/ },
    { level: 'high', title: 'It asks you to pay to unlock your earnings', why: '"Top up to clear your balance, then withdraw your commission" is how task and job scams take your money. A real job never asks you to pay in.', re: /\b(negative balance|premium task|combination task|lucky order|top[- ]?up\b[^.!?\n]{0,40}\b(clear|unlock|withdraw|release|continue)|(commission|earnings|salary|profit)s?\b[^.!?\n]{0,40}\b(can be|to be|will be) (withdrawn|released|unlocked)|(pay|deposit) [^.!?\n]{0,20}to (withdraw|unlock|release) (your )?(money|earnings|commission|funds|profit))\b/ },
    { level: 'medium', title: 'It asks you to leave the site or pay someone else', why: 'Buyer and seller protection only works when you pay through the site. "Pay my sister instead" or "let’s do it off the app" removes it.', re: /\b(leave|off|outside( of)?|away from) (vinted|ebay|gumtree|depop|facebook|marketplace|the app|the site|the platform)\b|\b(transfer|send|pay) (it |the money |the payment )?(to|into) my (sister|brother|friend|wife|husband|mum|mam|dad|cousin|partner|son|daughter)'?s?\b|\b(checkout|payment system|payments?) (isn'?t|is not|not|aren'?t) working\b/ },
    { level: 'medium', title: 'It asks you to pay with a QR code', why: 'Fake QR codes in emails, letters and on parking machines lead to payment pages run by criminals. Pay through the official app or website instead.', re: /\b(scan|use) (the |this |our )?qr( code)?\b[^.!?\n]{0,40}\b(pay|payment|settle|balance|fine|invoice|parking)\b|\b(pay|settle)\b[^.!?\n]{0,30}\b(with|using|via|by scanning) (the |this )?qr\b/ },
    { level: 'high', title: 'It asks you to install an app or share your screen', why: 'Apps like AnyDesk or TeamViewer let a stranger control your phone or computer.', re: /\b(anydesk|teamviewer|quick ?support|rustdesk|remote access|share your screen|screen ?share|install (this|the) app|download (this|the) app|(see|view|access|control) your (screen|computer|pc|laptop|phone|device)|install (the |our )?(support|remote|helper|security) (app|tool|software|program)|(support|remote) app (the|our|that) (adviser|advisor|agent|engineer|technician))\b/ },
    { level: 'high', title: 'It promises big or guaranteed returns', why: "Guaranteed or fast returns don't exist. This is a sign of investment fraud.", re: /\b(guaranteed (return|profit|income)|double your money|risk[- ]free (investment|return)|\d{2,3}% (return|profit|per (day|week|month))|trading signals|investment opportunity|passive income)\b/ },
    { level: 'medium', title: 'It asks you to keep it secret', why: 'Being told not to tell anyone, especially your bank, is a big warning sign.', re: /\b(don'?t tell|do not tell|keep (this|it) (between us|secret|private|confidential)|don'?t (contact|call) (your|the) bank)\b/ },
    { level: 'medium', title: 'It offers a job that seems too easy', why: 'Paid "like and review" tasks or jobs with no interview are a common scam that ends with you paying them.', re: /\b(work from home|earn £?\d+ (a|per) (day|hour)|like (and|&) (review|subscribe)|simple tasks|part[- ]time (job|role) .*(whatsapp|telegram)|recruiter.*telegram|(pay|paid|earn) £?\d+ (a|per) day (for|to|just)|(liking|rating|reviewing|boosting|optimi[sz]ing) (products|apps|videos|hotels|items)|today'?s (first )?task|first task)\b/ },
    { level: 'low', title: 'It moves the chat to WhatsApp or Telegram', why: 'Scammers often try to move you off a platform that protects you.', re: /\b(message me on|add me on|contact (me|us) (on|via)) (whatsapp|telegram|signal)\b|\bt\.me\/|\bwa\.me\// },
    { level: 'low', title: 'It greets you vaguely', why: 'Real companies usually use your name. "Dear customer" is common in mass scam messages.', re: /\b(dear (customer|client|user|member|sir|madam|valued)|hello customer)\b/ },
    { level: 'low', title: 'It asks you to confirm your details', why: 'A request to "confirm" or "update" your details is usually a way to collect them.', re: /\b(confirm|update|verify|validate) your (details|information|identity|account|address|payment)\b/ },
  ];

  // Sentences that warn you ("we'll never ask for your PIN", "never share this code") are a good sign, not a bad one,
  // so they're left out before the checks run.
  const PROTECTIVE = /\b(we|we'll|we will|we'd|your bank|the bank|banks|i|nhs|hmrc|the police)\b[^.!?\n]{0,20}\b(never|won'?t|will not|do not|don'?t)\b[^.!?\n]{0,15}\b(ask|call|text|email|request|contact|send)\b|\b(never|don'?t|do not)\b[^.!?\n]{0,10}\b(share|give|tell|disclose|read out)\b[^.!?\n]{0,20}\b(code|pin|passcode|password|details)\b[^.!?\n]{0,25}\b(anyone|anybody|us|someone)\b|\bnot even\b[^.!?\n]{0,25}\b(us|bank|staff|barclays|lloyds|natwest|hsbc|santander|halifax|monzo|starling|nationwide)\b|\bif (anyone|someone|they) (does|do|asks?)\b[^.!?\n]{0,40}\b(scam|fraud)\b|\bit'?s a scam\b|\bhang up\b|\bcall 159\b|\b(beware of|watch out for|be careful of|be wary of|be aware of|scam alert|scam warning)\b|\b(fake|scam|bogus|phishing) ([a-z]+ ){0,3}(emails?|texts?|messages?|calls?|websites?)\b|\b(there'?s|there is|there are) (a )?(fake|scam)\b|\bfake\b[^.!?\n]{0,30}\b(messages?|texts?|emails?|calls?)\b[^.!?\n]{0,25}\b(going round|going around|circulating|doing the rounds)\b|\b(real|genuine|legitimate|official)\b[^.!?\n]{0,30}\b(will )?never\b|\bif (anyone|someone|they|a caller|a message|a text)\b[^.!?\n]{0,15}\b(says?|asks?|tells?|claims?)\b|\b(don'?t|do not|never)\b[^.!?\n]{0,6}\b(send|pay|give|buy|share|transfer|hand over)\b[^.!?\n]{0,40}\b(before|until|unless|over the phone|to anyone|to strangers|for a refund|to someone you)\b|\b(we|they|you) (don'?t|do not|won'?t|will not) need (any|your)\b/;
  const sentences = t => t.split(/(?<=[.!?\n])\s+/);
  const FAMILY = /\b(hi|hey|hello|hiya) ?(mum|mam|mom|mummy|dad|daddy|nan|nana|gran|grandma|grandad)\b/;
  const NEWPHONE = /\b(new (number|phone|mobile)|phones? (is |got )?(broken|broke|smashed|lost|dead)|(different|another|temporary|temp|spare) (number|phone|mobile)|my other (number|phone)|lost my phone|broke(n)? my phone|dropped my phone|phone (is |got )?(broken|stolen|lost|smashed)|this is my new|old (phone|number) (is )?(broken|not working|dead))\b/;
  const ASK = /\b(send|pay|transfer|lend|borrow|bill|money|£\s?\d|bank|help me|can you help|need (some|your) help|whatsapp|what'?s ?app|text me|message me|save (this|my)|delete (the|my) old)\b/;

  const TAP_LINK = /\b(click|tap|press|follow|open|visit|use|go to) (on )?(here|the link|this link|the following link|link below|the button|below|now)\b|\b(in|via|at|on) the (following|link) (link|below)\b|\blink:\s*(https?:|www\.)/;

  function checkMessage(text) {
    const raw = (text || '').slice(0, 50000);
    const um = unmask(raw);
    text = um.text;
    const tAll = norm(text.replace(/(?<=[a-z])_(?=[a-z])/gi, ' '));
    // ("this is not a scam" is what scammers say, so that doesn't count as a warning sentence)
    const t = sentences(tAll).filter(x => !PROTECTIVE.test(x) || /\b(not|isn'?t|is not|no) (a )?(scam|fake|spam|phishing)\b/.test(x)).join(' ');
    const signs = [];
    RULES.forEach(r => { if (r.re.test(t)) signs.push({ level: r.level, title: r.title, why: r.why }); });
    if (um.used.invisible || um.used.lookalike) {
      const others = signs.some(x => x.level === 'high' || x.level === 'medium');
      signs.push({ level: others ? 'high' : 'medium', title: 'It hides words with invisible or look-alike characters', why: 'Some words contain hidden characters or letters from another alphabet. They look normal to you but can slip past scam filters, which is why scammers use them. Text copied from some websites or apps can also pick them up.' });
    }
    else if (um.used.spaced || um.used.leet) {
      // spaced-out or number-swapped words only count when they were hiding something
      const before = norm(raw), hid = RULES.some(r => r.level !== 'low' && r.re.test(t) && !r.re.test(before));
      if (hid) signs.push({ level: 'medium', title: 'It disguises words to get past filters', why: 'Words like "p a y" or "acc0unt" are written oddly so scam filters miss them. Genuine companies don’t write like this.' });
    }
    // "Hi Mum, new number" only counts when it also asks for something
    const fam = FAMILY.test(t), np = NEWPHONE.test(t), ask = ASK.test(t);
    const itsMe = /\b(mum|mam|mom|dad|nan|gran)\b[ ,.!-]{1,3}it'?s me\b|\bit'?s me,? (mum|mam|mom|dad)\b|\bit'?s your (son|daughter|grandson|granddaughter)\b/.test(t);
    if (itsMe && /(£\s?\d|\b(money|pay|send|transfer|bank|bill)\b)/.test(t))
      signs.push({ level: 'high', title: 'It claims to be family and asks for money', why: 'Messages from "your son" or "your daughter" on an unknown number asking for money are a very common UK scam. Call them on the number you know.' });
    // money asked for: a big warning; only "save this number" or "it's urgent": a smaller one, since real family do change numbers
    const money = /\b(send|pay|transfer|lend|borrow|bill|money|£\s?\d|bank)\b/.test(t);
    const famLevel = (fam && np && (money || ask)) || (np && /\b(send|pay|transfer|lend|£\s?\d)/.test(t) && /\b(bill|money|payment|rent|today|urgent)\b/.test(t)) ? 'high'
      : (fam && np && /\b(urgent|asap)\b/.test(t)) ? 'medium' : '';
    if (famLevel)
      signs.push({ level: famLevel, title: 'It claims to be family on a new number', why: 'The "Hi Mum, I\'ve lost my phone" message is one of the most common UK scams. Call the person on their old number to check.' });
    const links = findLinks(text);
    // which brand the message says it's from: the opening words, or the words just before the link
    const opening = tAll.slice(0, 140);
    const linkResults = links.slice(0, 5).map(l => { const i = tAll.indexOf(l.toLowerCase()); return checkLink(l, opening + ' ' + (i > 0 ? tAll.slice(Math.max(0, i - 90), i) : '')); });
    linkResults.forEach(lr => (lr.signs || []).forEach(s => signs.push(Object.assign({}, s, { title: s.title + (lr.registered ? ` (${lr.registered})` : '') }))));
    if (links.length) signs.push({ level: 'info', title: `Contains ${links.length === 1 ? 'a link' : links.length + ' links'}`, why: "Don't tap links in unexpected messages. Go to the company's website or app yourself instead." });
    const officialAny = linkResults.some(lr => lr.host && BRANDS.concat(LINK_BRANDS).some(b => isOfficial(lr.host, b)));
    if (links.length && !officialAny && TAP_LINK.test(t))
      signs.push({ level: 'low', title: 'It pushes you to tap a link', why: 'Unexpected messages that push you to tap a link are the most common way scams start.' });
    // A short message about a problem (delivery, account, money owed, refund, health) that sends you to a link
    // that isn't the company's own website is the classic scam text.
    const PROBLEM = ['It says there is a problem with a delivery', 'It says you owe money', 'It asks you to sign in, reset or verify your account', 'It’s about a health test, pass or prescription', 'It asks for a small fee', 'It offers money you did not expect', 'It threatens to close, block or fine you'];
    const officialLink = linkResults.some(lr => lr.host && BRANDS.some(b => isOfficial(lr.host, b)));
    if (links.length && !officialLink && text.length < 450 && signs.some(s => PROBLEM.includes(s.title)))
      signs.push({ level: 'high', title: 'It asks you to sort out a problem through a link', why: 'Unexpected messages about a parcel, bill, account or refund that send you to a link are the most common scam. Go to the company’s app or website yourself instead.' });
    // brand mentioned with a link that isn't theirs is handled in checkLink; brand mentioned with no link and a phone number:
    // a call-back request is strong when it's about money or a "fraud team"; numbers you already trust don't count
    const cb = signs.find(s => s.title === 'It asks you to call a number about a payment you didn’t make');
    if (cb && (/(£|\$|€)\s?\d|\b(fraud (team|department)|to cancel|being processed|has been (charged|taken)|renew(al|s)?)\b/.test(t) || /\bpress (one|1|9)\b/.test(t)) && !/number on the back of your card|number you (already )?trust|official (website|number)/.test(t)) cb.level = 'high';
    if (/\b(call|ring|phone) (us|this number|now|back) (on|at)\b/.test(t) && !/number on the back of your card|number you (already )?trust/.test(t) && BRANDS.some(b => b.words.some(w => t.includes(w))))
      signs.push({ level: 'medium', title: 'It gives you a number to call', why: 'Call the company on a number you already trust, such as the one on your card or their official website, not the number in the message.' });
    return { signs: dedupe(signs), links: linkResults };
  }

  // ---------- page check (used by the extension on the page you are looking at) ----------
  function checkPage(info) {
    // info: { url, title, text, hasPassword, hasCardField, formToOtherSite }
    const signs = [];
    const lr = checkLink(info.url || '', (info.title || '') + ' ' + (info.text || '').slice(0, 4000));
    (lr.signs || []).filter(s => !/^Mentions /.test(s.title)).forEach(s => signs.push(s));
    const host = lr.host || '';
    const t = norm((info.title || '') + ' ' + (info.text || '').slice(0, 20000));
    // the page claims to be a brand that this site isn't
    BRANDS.forEach(b => {
      const titleHit = b.words.some(w => norm(info.title || '').includes(w));
      if (titleHit && host && !isOfficial(host, b))
        signs.push({ level: info.hasPassword || info.hasCardField ? 'high' : 'medium', title: `The page calls itself ${b.name}, but this isn't their website`, why: `${b.name}'s real website is ${b.domains[0]}. You're on ${lr.registered}.` });
    });
    if (info.hasPassword && /^http:/.test(info.url || ''))
      signs.push({ level: 'high', title: 'It asks for a password on an insecure page', why: 'This page is not encrypted. Never type a password here.' });
    if (info.hasCardField && /^http:/.test(info.url || ''))
      signs.push({ level: 'high', title: 'It asks for card details on an insecure page', why: 'This page is not encrypted. Never enter card details here.' });
    if (info.formToOtherSite)
      signs.push({ level: 'medium', title: 'A form on this page sends your details to a different website', why: `What you type here would go to ${info.formToOtherSite}, not ${lr.registered}.` });
    RULES.filter(r => ['It rushes you', 'It threatens to close, block or fine you', 'It wants payment in gift cards or crypto', 'It promises big or guaranteed returns', 'It asks you to install an app or share your screen', 'It asks you to move money to a "safe account"'].includes(r.title))
      .forEach(r => { if (r.re.test(t)) signs.push({ level: r.level === 'high' ? 'medium' : 'low', title: r.title.replace(/^It /, 'The page '), why: r.why }); });
    if (/\b(only \d+ left|\d+ people are (viewing|looking)|offer ends in|hurry|sale ends (today|tonight))\b/.test(t))
      signs.push({ level: 'low', title: 'The page uses countdowns or "only a few left"', why: 'Pressure to buy now is common on fake shops. Take your time.' });
    const off = t.match(/\b(\d{2})% off\b/);
    if (off && +off[1] >= 70)
      signs.push({ level: 'low', title: 'Prices look too good to be true', why: 'Huge discounts on popular brands are a common sign of a fake shop.' });
    signs.push({ level: 'info', title: "We can't tell how old this website is", why: 'New sites are riskier. Search the site name with "reviews" or "scam" before you buy or sign in.' });
    return { host, registered: lr.registered, signs: dedupe(signs) };
  }

  // ---------- summary ----------
  const WEIGHT = { high: 3, medium: 2, low: 1, info: 0 };
  function summarise(signs) {
    const real = signs.filter(s => s.level !== 'info');
    const score = real.reduce((a, s) => a + WEIGHT[s.level], 0);
    const highs = real.filter(s => s.level === 'high').length;
    if (!real.length) return { band: 'none', headline: 'No common warning signs found', text: "That doesn't prove it's safe. If you weren't expecting it, contact the company using a website or number you already know." };
    if (highs >= 1 || score >= 5) return { band: 'high', headline: `${real.length} warning sign${real.length === 1 ? '' : 's'}: treat this as a likely scam`, text: "Don't tap links, reply, pay or share any details. See what to do below." };
    return { band: 'medium', headline: `${real.length} warning sign${real.length === 1 ? '' : 's'} found`, text: 'Be careful. If you weren\'t expecting it, check with the company directly using a website or number you already know.' };
  }
  function dedupe(signs) {
    const seen = new Set();
    const order = { high: 0, medium: 1, low: 2, info: 3 };
    return signs.filter(s => { const k = s.title; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => order[a.level] - order[b.level]);
  }

  // ---------- photo: read hidden location from a JPEG, and make a clean copy ----------
  function readExif(buf) {
    const v = new DataView(buf);
    const res = { hasExif: false, gps: null, date: null, camera: null };
    if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return res; // not a JPEG
    let off = 2;
    while (off + 4 < v.byteLength) {
      const marker = v.getUint16(off);
      if ((marker & 0xFF00) !== 0xFF00) break;
      const size = v.getUint16(off + 2);
      if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) { // "Exif"
        res.hasExif = true;
        try { parseTiff(v, off + 10, res); } catch (e) { /* ignore broken data */ }
        break;
      }
      if (marker === 0xFFDA) break;
      off += 2 + size;
    }
    return res;
  }
  function parseTiff(v, start, res) {
    const little = v.getUint16(start) === 0x4949;
    const u16 = o => v.getUint16(start + o, little), u32 = o => v.getUint32(start + o, little);
    const str = (o, n) => { let s = ''; for (let i = 0; i < n; i++) { const c = v.getUint8(start + o + i); if (!c) break; s += String.fromCharCode(c); } return s.trim(); };
    const rat = o => { const d = u32(o + 4); return d ? u32(o) / d : 0; };
    const readIfd = (ifd, cb) => { const n = u16(ifd); for (let i = 0; i < n; i++) { const e = ifd + 2 + i * 12; cb(u16(e), u16(e + 2), u32(e + 4), e + 8); } };
    let gpsPtr = 0, exifPtr = 0, make = '', model = '';
    readIfd(u32(4), (tag, type, count, valOff) => {
      const ptr = count * (type === 2 ? 1 : 4) > 4 ? u32(valOff - 0) : null;
      if (tag === 0x8825) gpsPtr = u32(valOff);
      if (tag === 0x8769) exifPtr = u32(valOff);
      if (tag === 0x010F) make = count > 4 ? str(u32(valOff), count) : str(valOff, count);
      if (tag === 0x0110) model = count > 4 ? str(u32(valOff), count) : str(valOff, count);
      void ptr;
    });
    if (make || model) res.camera = uniq([make, model].filter(Boolean)).join(' ');
    if (exifPtr) readIfd(exifPtr, (tag, type, count, valOff) => { if (tag === 0x9003) res.date = str(u32(valOff), count); });
    if (gpsPtr) {
      let latRef = 'N', lonRef = 'E', lat = null, lon = null;
      const dms = o => rat(o) + rat(o + 8) / 60 + rat(o + 16) / 3600;
      readIfd(gpsPtr, (tag, type, count, valOff) => {
        if (tag === 1) latRef = String.fromCharCode(v.getUint8(start + valOff));
        if (tag === 2) lat = dms(u32(valOff));
        if (tag === 3) lonRef = String.fromCharCode(v.getUint8(start + valOff));
        if (tag === 4) lon = dms(u32(valOff));
      });
      if (lat !== null && lon !== null && (lat || lon)) res.gps = { lat: (latRef === 'S' ? -1 : 1) * lat, lon: (lonRef === 'W' ? -1 : 1) * lon };
    }
  }
  // Redraws the picture, which leaves all hidden data behind.
  async function cleanPhoto(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const c = document.createElement('canvas');
    c.width = bmp.width; c.height = bmp.height;
    c.getContext('2d').drawImage(bmp, 0, 0);
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise(r => c.toBlob(r, type, 0.92));
    const base = (file.name || 'photo').replace(/\.[^.]+$/, '');
    return { blob, name: base + '-clean.' + (type === 'image/png' ? 'png' : 'jpg') };
  }

  const NEXT_STEPS = {
    message: [
      ['Scam text?', 'Forward it to 7726 (free). Your phone provider can block the sender.'],
      ['Scam email?', 'Forward it to report@phishing.gov.uk.'],
      ['Gave your bank or card details, or sent money?', 'Call your bank straight away on the number on the back of your card, or call 159.'],
      ['Lost money or details?', 'Report it to Report Fraud at reportfraud.police.uk or on 0300 123 2040. In Scotland, call Police Scotland on 101.'],
    ],
    page: [
      ["Don't sign in, pay or download anything from this page.", ''],
      ['Want to report it?', 'Report suspicious websites to the National Cyber Security Centre at ncsc.gov.uk/report.'],
      ['Already entered details?', 'Change that password now, and call your bank on the number on your card if you paid or entered card details.'],
    ],
  };

  root.SecondLook = { checkMessage, checkLink, checkPage, summarise, readExif, cleanPhoto, registeredDomain, findLinks, NEXT_STEPS, BRANDS };
})(typeof window !== 'undefined' ? window : globalThis);
