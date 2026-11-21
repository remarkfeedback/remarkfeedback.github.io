/* Doorman by Survive Labs: the checks.
   Everything here runs on the user's own device. Nothing is sent anywhere.
   It never says something is "safe": it lists warning signs, or says it found none. */
(function (root) {
  'use strict';

  // ---------- brands scammers commonly copy in the UK, and where they really live ----------
  const BRANDS = [
    { name: 'Royal Mail', words: ['royal mail', 'royalmail'], domains: ['royalmail.com', 'royalmail.co.uk', 'royalmailgroup.com'] },
    { name: 'Evri', words: ['evri', 'hermes'], domains: ['evri.com', 'myhermes.co.uk'] },
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

  const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'cutt.ly', 'rb.gy', 'shorturl.at', 'tiny.cc', 'buff.ly', 'rebrand.ly', 's.id', 'v.gd', 'qrco.de', 'lnkd.in', 't.ly', 'bl.ink', 'short.io', 'shorte.st'];
  const RISKY_TLDS = ['top', 'xyz', 'click', 'icu', 'cfd', 'sbs', 'buzz', 'rest', 'cyou', 'monster', 'quest', 'gq', 'ml', 'cf', 'tk', 'ga', 'zip', 'mov', 'bond', 'live', 'online', 'site', 'shop', 'info', 'vip', 'win', 'loan', 'work', 'support', 'help', 'top', 'lat', 'autos', 'boats'];
  const MULTI_SUFFIX = ['co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'me.uk', 'ltd.uk', 'plc.uk', 'nhs.uk', 'police.uk', 'sch.uk', 'net.uk', 'com.au', 'co.nz', 'co.za', 'com.br', 'co.jp', 'co.in'];

  // ---------- helpers ----------
  const norm = s => (s || '').toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
  const uniq = arr => [...new Set(arr)];

  function registeredDomain(host) {
    host = (host || '').toLowerCase().replace(/\.$/, '');
    const parts = host.split('.');
    if (parts.length <= 2) return host;
    const last2 = parts.slice(-2).join('.');
    if (MULTI_SUFFIX.includes(last2)) return parts.slice(-3).join('.');
    return last2;
  }
  function isOfficial(host, brand) {
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
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'http://' + s;
    try { return new URL(s); } catch (e) { return null; }
  }
  function decodePunycodeLabel(label) {
    // minimal check only: tells us if the address uses look-alike letters
    return /^xn--/i.test(label);
  }

  // ---------- link check ----------
  function checkLink(raw, context) {
    const signs = [];
    const u = parseUrl(raw);
    if (!u) return { ok: false, signs: [{ level: 'info', title: "That doesn't look like a web address", why: 'Check you copied the whole link.' }] };
    const host = u.hostname.toLowerCase();
    const reg = registeredDomain(host);
    const tld = host.split('.').pop();
    const ctx = norm(context || '');

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') && /^[0-9a-f:]+$/.test(host))
      signs.push({ level: 'high', title: 'The link is a number, not a name', why: 'Real companies use their own name in web addresses. Links that are just numbers are a common trick.' });
    if (host.split('.').some(decodePunycodeLabel))
      signs.push({ level: 'high', title: 'The address uses look-alike letters', why: "Some letters from other alphabets look identical to English ones, so a fake address can look exactly like a real one." });
    if (/@/.test(u.href.split('?')[0].replace(/^[a-z]+:\/\//i, '').split('/')[0]))
      signs.push({ level: 'high', title: 'The link hides its real destination', why: 'Everything before the @ sign is ignored by your browser. The real website is the part after it.' });
    if (SHORTENERS.includes(reg) || SHORTENERS.includes(host))
      signs.push({ level: 'medium', title: 'This is a shortened link', why: "Short links hide where they really go. That's not always bad, but scammers use them a lot." });
    if (RISKY_TLDS.includes(tld))
      signs.push({ level: 'medium', title: `The address ends in .${tld}`, why: 'Cheap web address endings like this are used far more often by scam sites than by UK companies.' });
    if (u.protocol === 'http:' && /^https?:\/\//i.test(raw.trim()))
      signs.push({ level: 'low', title: 'The link is not secure (http, not https)', why: "Anything you type on an http page can be read by others. Don't enter details there." });
    const labels = host.split('.');
    if (labels.length >= 5)
      signs.push({ level: 'medium', title: 'The address has lots of parts', why: 'Long addresses with many dots are often used to push a familiar name to the front while the real site is at the end.' });
    if ((reg.replace(/^xn--/, '').match(/-/g) || []).length >= 2)
      signs.push({ level: 'low', title: 'The website name has several hyphens', why: 'Names like secure-account-update are a common pattern for fake sites.' });

    // brand look-alike: brand name appears in the address, but it isn't that brand's site
    BRANDS.forEach(b => {
      const token = b.words.map(w => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
      const inHost = token.some(t => t.length >= 3 && host.replace(/[^a-z0-9]/g, '').includes(t));
      if (inHost && !isOfficial(host, b))
        signs.push({ level: 'high', title: `Uses the name "${b.name}" but isn't their website`, why: `${b.name}'s real website is ${b.domains[0]}. This link goes to ${reg}.` });
      else if (ctx && b.words.some(w => ctx.includes(w)) && !isOfficial(host, b) && !SHORTENERS.includes(reg))
        signs.push({ level: 'medium', title: `Mentions ${b.name}, but the link goes elsewhere`, why: `${b.name}'s real website is ${b.domains[0]}. This link goes to ${reg}.` });
    });
    if (/(login|log-in|signin|verify|verification|secure|account|update|unlock|suspend|confirm|billing|wallet|redeliver|reschedule|payment|refund)/.test(host.replace(reg, '')))
      signs.push({ level: 'medium', title: 'The address is full of account words', why: 'Words like "verify", "secure" or "update" placed in front of the real site name are a common phishing pattern.' });

    return { ok: true, host, registered: reg, shown: u.href, signs: dedupe(signs) };
  }

  // ---------- message check ----------
  const RULES = [
    { level: 'medium', title: 'It rushes you', why: 'Scams create panic so you act before you think. Real organisations give you time.', re: /\b(urgent(ly)?|immediately|within (24|48|12) ?(hours|hrs|h)\b|today only|final (notice|warning|reminder)|last chance|act now|expires? (today|tonight|soon)|as soon as possible|right away|before midnight)\b/ },
    { level: 'medium', title: 'It threatens to close, block or fine you', why: 'Threats like suspended accounts, fines or court action are a classic pressure tactic.', re: /\b(suspend(ed)?|locked|blocked|deactivat|disabled|closed|restricted|terminated|court action|bailiff|penalty|fine of|arrest|legal action|police will)\b/ },
    { level: 'high', title: 'It asks for a security code or password', why: 'No real company will ever ask you to send them a one-time code, PIN or password. Anyone who does is trying to get into your account.', re: /\b(send|share|give|tell|read|forward|reply with|text) (me |us )?(the |your |that |a )?(\d-digit )?(one[- ]time (pass)?code|verification code|security code|code|otp|passcode|pin|password|memorable (word|information)|login details)\b|\b(code|otp|pin) (i|we) (just )?(sent|texted)\b|\bsent my (verification |security )?code to your\b|\b(enter|confirm|provide) your (pin|password|memorable|login details)\b/ },
    { level: 'high', title: 'It asks for card or bank details', why: 'Sharing card or bank details by message or a link is how most fraud starts.', re: /\b(card (number|details)|cvv|cvc|long number|sort code|account number|bank details|expiry date|security number on the back)\b/ },
    { level: 'high', title: 'It asks you to move money to a "safe account"', why: 'Your bank will never ask you to move money to keep it safe. This is always a scam.', re: /\b(safe account|secure account|holding account|move (your )?(money|funds|savings)|transfer (your )?(money|funds|savings) (to|into))\b/ },
    { level: 'high', title: 'It wants payment in gift cards or crypto', why: 'Gift cards, vouchers and cryptocurrency are almost impossible to get back, which is why scammers ask for them.', re: /\b(gift ?cards?|itunes card|google play card|steam card|amazon vouchers?|vouchers?|bitcoin|btc|crypto(currency)?|usdt|tether|ethereum|wallet address)\b/ },
    { level: 'medium', title: 'It asks for a small fee', why: 'A small "redelivery", "customs" or "unpaid" fee is a common way to get your card details.', re: /\b(redeliver(y)?|re-deliver|reschedule (your )?delivery|customs (fee|charge)|unpaid (fee|postage|toll|balance)|outstanding (fee|balance|payment)|small (fee|charge|payment))\b|£\s?[0-4]\.\d{2}\b/ },
    { level: 'medium', title: 'It offers money you did not expect', why: 'Unexpected refunds, rebates, prizes or winnings are bait.', re: /\b(you('ve| have)? won|winner|prize|claim your|tax (rebate|refund)|refund (is|of)|you are (owed|eligible)|compensation|cashback|reward of)\b/ },
    { level: 'high', title: 'It claims to be family on a new number', why: 'The "Hi Mum, I\'ve lost my phone" message is one of the most common UK scams. Call the person on their old number to check.', re: /\b(hi|hey|hello) (mum|mam|mom|dad|nan|gran)\b|\b(new number|lost my phone|broke my phone|phone (is )?broken|this is my new)\b/ },
    { level: 'high', title: 'It asks you to install an app or share your screen', why: 'Apps like AnyDesk or TeamViewer let a stranger control your phone or computer.', re: /\b(anydesk|teamviewer|quick ?support|rustdesk|remote access|share your screen|screen ?share|install (this|the) app|download (this|the) app)\b/ },
    { level: 'high', title: 'It promises big or guaranteed returns', why: "Guaranteed or fast returns don't exist. This is a sign of investment fraud.", re: /\b(guaranteed (return|profit|income)|double your money|risk[- ]free (investment|return)|\d{2,3}% (return|profit|per (day|week|month))|trading signals|investment opportunity|passive income)\b/ },
    { level: 'medium', title: 'It asks you to keep it secret', why: 'Being told not to tell anyone, especially your bank, is a big warning sign.', re: /\b(don'?t tell|do not tell|keep (this|it) (between us|secret|private|confidential)|don'?t (contact|call) (your|the) bank)\b/ },
    { level: 'medium', title: 'It offers a job that seems too easy', why: 'Paid "like and review" tasks or jobs with no interview are a common scam that ends with you paying them.', re: /\b(work from home|earn £?\d+ (a|per) (day|hour)|like (and|&) (review|subscribe)|simple tasks|part[- ]time (job|role) .*(whatsapp|telegram)|recruiter.*telegram)\b/ },
    { level: 'low', title: 'It moves the chat to WhatsApp or Telegram', why: 'Scammers often try to move you off a platform that protects you.', re: /\b(message me on|add me on|contact (me|us) (on|via)) (whatsapp|telegram|signal)\b|\bt\.me\/|\bwa\.me\// },
    { level: 'low', title: 'It greets you vaguely', why: 'Real companies usually use your name. "Dear customer" is common in mass scam messages.', re: /\b(dear (customer|client|user|member|sir|madam|valued)|hello customer)\b/ },
    { level: 'low', title: 'It asks you to confirm your details', why: 'A request to "confirm" or "update" your details is usually a way to collect them.', re: /\b(confirm|update|verify|validate) your (details|information|identity|account|address|payment)\b/ },
  ];

  function checkMessage(text) {
    const t = norm(text);
    const signs = [];
    RULES.forEach(r => { if (r.re.test(t)) signs.push({ level: r.level, title: r.title, why: r.why }); });
    const links = findLinks(text);
    const linkResults = links.slice(0, 5).map(l => checkLink(l, text));
    linkResults.forEach(lr => (lr.signs || []).forEach(s => signs.push(Object.assign({}, s, { title: s.title + (lr.registered ? ` (${lr.registered})` : '') }))));
    if (links.length) signs.push({ level: 'info', title: `Contains ${links.length === 1 ? 'a link' : links.length + ' links'}`, why: "Don't tap links in unexpected messages. Go to the company's website or app yourself instead." });
    // brand mentioned with a link that isn't theirs is handled in checkLink; brand mentioned with no link and a phone number:
    if (/\b(call|ring|phone) (us|this number|now|back) (on|at)\b/.test(t) && BRANDS.some(b => b.words.some(w => t.includes(w))))
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
