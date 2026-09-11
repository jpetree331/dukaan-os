/* ══════════════════════════════════════════════════════════
   Dukaan OS — voice input (Web Speech API)
   Parses Hinglish/Hindi speech like "do packet lays aur ek maggi"
   into cart lines. Devanagari is transliterated so a hi-IN
   transcript can still match an English product name.
   ══════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';
  const App = w.App;

  /* ───────── numbers, Hindi + Hinglish + English ───────── */
  const NUM = {
    ek: 1, एक: 1, one: 1, a: 1, an: 1, ik: 1,
    do: 2, दो: 2, two: 2, teen: 3, तीन: 3, three: 3, tin: 3,
    char: 4, chaar: 4, चार: 4, four: 4, panch: 5, paanch: 5, पांच: 5, पाँच: 5, five: 5,
    chhe: 6, che: 6, chah: 6, छह: 6, छै: 6, six: 6, saat: 7, सात: 7, seven: 7,
    aath: 8, आठ: 8, eight: 8, nau: 9, नौ: 9, nine: 9, das: 10, दस: 10, ten: 10,
    gyarah: 11, ग्यारह: 11, eleven: 11, barah: 12, बारह: 12, twelve: 12, darjan: 12, दर्जन: 12, dozen: 12,
    terah: 13, तेरह: 13, chaudah: 14, चौदह: 14, pandrah: 15, पंद्रह: 15, fifteen: 15,
    solah: 16, सोलह: 16, satrah: 17, सत्रह: 17, atharah: 18, अठारह: 18, unnees: 19, उन्नीस: 19,
    bees: 20, बीस: 20, twenty: 20, pachees: 25, पच्चीस: 25, tees: 30, तीस: 30, thirty: 30,
    chalees: 40, चालीस: 40, forty: 40, pachas: 50, pachaas: 50, पचास: 50, fifty: 50,
    sau: 100, सौ: 100, hundred: 100,
    adha: 0.5, aadha: 0.5, आधा: 0.5, half: 0.5, pav: 0.25, पाव: 0.25,
    derh: 1.5, dedh: 1.5, डेढ़: 1.5, dhai: 2.5, ढाई: 2.5, sava: 1.25, सवा: 1.25
  };

  /* words that describe packaging, not the product */
  const UNITS = ['packet', 'paket', 'pkt', 'पैकेट', 'pouch', 'पाउच', 'bottle', 'बोतल', 'botal',
    'piece', 'pcs', 'pc', 'peace', 'पीस', 'dabba', 'डिब्बा', 'dibba', 'box', 'बॉक्स',
    'kg', 'kilo', 'किलो', 'gram', 'ग्राम', 'gm', 'g', 'litre', 'liter', 'लीटर', 'ltr', 'ml', 'एमएल',
    'patta', 'पत्ता', 'strip', 'स्ट्रिप', 'bag', 'थैला', 'wala', 'वाला', 'wali', 'वाली', 'ka', 'ki', 'ke',
    'का', 'की', 'के', 'ko', 'को', 'de', 'do', 'दे', 'दो', 'dena', 'देना', 'chahiye', 'चाहिए',
    'please', 'bhaiya', 'भैया', 'ji', 'जी'];

  const SEPS = /\s+(?:aur|और|and|plus|तथा|,|\+|फिर|phir|then)\s+/gi;

  /* ───────── Devanagari → latin (rough, for fuzzy matching) ───────── */
  const CONS = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n', 'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'ळ': 'l',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h', 'ड़': 'r', 'ढ़': 'rh', 'क़': 'k', 'ख़': 'kh', 'ग़': 'g',
    'ज़': 'z', 'फ़': 'f', 'ऱ': 'r'
  };
  const MATRA = { 'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri', 'ॅ': 'e', 'ॉ': 'o' };
  const VOW = { 'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऋ': 'ri' };

  function translit(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i], nx = s[i + 1];
      if (CONS[c]) {
        out += CONS[c];
        if (nx === '्') { i++; }
        else if (MATRA[nx]) { out += MATRA[nx]; i++; }
        else out += 'a';
      } else if (VOW[c]) out += VOW[c];
      else if (MATRA[c]) out += MATRA[c];
      else if (c === 'ं' || c === 'ँ') out += 'n';
      else if (c === 'ः') out += 'h';
      else if (c === '़' || c === '्' || c === 'ऽ') { /* skip */ }
      else out += c;
    }
    return out;
  }

  /* collapse to a comparable skeleton: kill doubled letters + weak vowels */
  function skel(s) {
    return translit(String(s).toLowerCase())
      .replace(/[^a-z0-9]/g, '')
      .replace(/(.)\1+/g, '$1')
      .replace(/aa|ee|oo/g, (m) => m[0]);
  }

  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m || !n) return m || n;
    let prev = Array.from({ length: n + 1 }, (_, i) => i), cur = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++)
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  }

  /* spoken aliases for the seed catalogue — user items can add their own */
  const ALIAS = {
    'lays magic masala': 'lays lej chips aloo magic masala',
    'kurkure masala munch': 'kurkure kurkura munch',
    'bingo mad angles': 'bingo mad angles',
    'parle-g biscuit': 'parle parleg parle g biscuit biskut glucose',
    'britannia good day': 'good day gooday britannia biscuit',
    'oreo chocolate': 'oreo oriyo',
    'dairy milk 50g': 'dairy milk cadbury chocolate dairymilk',
    '5 star': 'five star faiv star 5star',
    'perk': 'perk park',
    'maggi 2-min noodles': 'maggi magi noodles nudals',
    'yippee noodles': 'yippee yipee noodles',
    'amul taaza milk 500ml': 'milk doodh dudh amul taaza',
    'amul butter 100g': 'butter makhan amul butter',
    'amul dahi 400g': 'dahi curd yogurt',
    'coca-cola 750ml': 'coke cola cocacola thanda',
    'thums up 750ml': 'thums up thumsup thanda',
    'frooti 160ml': 'frooti fruti mango juice',
    'bisleri water 1l': 'pani water bisleri bottle',
    'red label tea 250g': 'chai chaipatti tea red label',
    'tata salt 1kg': 'namak salt tata',
    'fortune oil 1l': 'tel oil fortune refined',
    'aashirvaad atta 5kg': 'atta aata flour aashirvaad',
    'sugar 1kg (loose)': 'cheeni chini sugar shakkar',
    'toor dal 1kg': 'dal daal toor arhar',
    'colgate 100g': 'colgate toothpaste manjan paste',
    'lifebuoy soap': 'sabun soap lifebuoy nahane',
    'surf excel 1kg': 'surf detergent powder washing',
    'vim bar': 'vim bartan sabun dish',
    'good knight refill': 'good knight machhar mosquito',
    'cigarette (single)': 'cigarette sigret'
  };

  function haystack(it) {
    const key = String(it.name || '').toLowerCase();
    return [it.name, it.nameHi, it.alias, ALIAS[key], it.barcode]
      .filter(Boolean).join(' ').toLowerCase();
  }

  /* ───────── match one spoken phrase to an item ─────────
     Billing the wrong product is a money error, so this leans towards
     "no match" (the caller shows it as unrecognised) rather than a
     confident-looking guess. Two rules keep it honest:
       · phrase comparisons run on space-separated skeletons and must land
         on a whole-word boundary — concatenating them made "maggi" match
         the "Magic" inside "Lays Magic Masala".
       · a lone prefix/typo hit is not enough on its own to clear MIN_SCORE;
         it needs a real token match to corroborate it. */
  const MIN_SCORE = 30;

  function matchItem(phrase, items) {
    const p = String(phrase).trim().toLowerCase();
    if (!p) return null;
    const pTok = p.split(/\s+/).filter((t) => t.length > 1);
    const pSkSpaced = p.split(/\s+/).map(skel).filter(Boolean).join(' ');
    if (!pSkSpaced) return null;

    let best = null, bestScore = 0, runnerUp = 0;
    items.forEach((it) => {
      const hay = haystack(it);
      let score = 0, matched = 0;

      const hTok = hay.split(/[\s,()]+/).filter(Boolean);
      const hSkTok = hTok.map(skel).filter((x) => x.length > 1);
      const haySkSpaced = ' ' + hSkTok.join(' ') + ' ';

      if ((' ' + hay + ' ').indexOf(' ' + p + ' ') > -1) score = Math.max(score, 100 + p.length);
      if (pSkSpaced.length >= 3 && haySkSpaced.indexOf(' ' + pSkSpaced + ' ') > -1)
        score = Math.max(score, 84 + pSkSpaced.length);

      pTok.forEach((t) => {
        const ts = skel(t);
        if (ts.length < 2) return;
        if (hTok.indexOf(t) > -1) { matched++; score += 40; return; }
        if (hSkTok.indexOf(ts) > -1) { matched++; score += 34; return; }
        for (const h of hSkTok) {
          if (h.length < 2) continue;
          if (h.indexOf(ts) === 0 || ts.indexOf(h) === 0) { matched++; score += 22; return; }
          const d = lev(ts, h);
          if (d <= (Math.max(ts.length, h.length) >= 6 ? 2 : 1)) { matched++; score += 26 - d * 5; return; }
        }
      });
      if (matched !== pTok.length) return;
      if (score > bestScore) { runnerUp = bestScore; bestScore = score; best = it; }
      else runnerUp = Math.max(runnerUp, score);
    });
    return bestScore >= MIN_SCORE && bestScore - runnerUp >= 15 ? { item: best, score: bestScore } : null;
  }

  /* ───────── parse a whole utterance ───────── */
  function parse(transcript, items) {
    items = items || App.items();
    const clean = String(transcript || '').replace(/[।!?]+/g, ' ').replace(/(?<!\d)\.|\.(?!\d)/g, ' ').trim();
    if (!clean) return { lines: [], unknown: [] };

    const chunks = clean.split(SEPS).map((s) => s.trim()).filter(Boolean);
    const lines = [], unknown = [];

    chunks.forEach((chunk) => {
      let toks = chunk.toLowerCase().split(/\s+/).filter(Boolean);
      let qty = null;

      /* quantity: digits or number words, anywhere but usually first.
         \p{M} must stay in the class — Devanagari vowel matras are combining
         marks, and stripping them turns दो (two) into द. */
      for (let i = 0; i < toks.length; i++) {
        const t = toks[i].replace(/[^\p{L}\p{N}\p{M}.]/gu, '');
        if (/^\d+(\.\d+)?$/.test(t)) {
          // a bare number that looks like a pack size (500, 250) is part of the name
          const n = parseFloat(t);
          if (n <= 99 && qty == null) { qty = n; toks.splice(i, 1); i--; continue; }
        } else if (NUM[t] != null && qty == null) {
          qty = NUM[t]; toks.splice(i, 1); i--; continue;
        }
      }
      /* strip packaging words */
      toks = toks.filter((t) => UNITS.indexOf(t.replace(/[^\p{L}\p{N}\p{M}]/gu, '')) < 0);
      const phrase = toks.join(' ').trim();
      if (!phrase) return;

      const hit = matchItem(phrase, items);
      if (hit) {
        const ex = lines.find((l) => l.item.id === hit.item.id);
        if (ex) ex.qty += (qty == null ? 1 : qty);
        else lines.push({ item: hit.item, qty: qty == null ? 1 : qty, said: chunk, score: hit.score });
      } else unknown.push(chunk);
    });

    return { lines, unknown };
  }

  /* ───────── recognition wrapper ───────── */
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  let rec = null, active = false;

  const voice = {
    supported: () => !!SR,
    active: () => active,

    start(opts) {
      opts = opts || {};
      if (!SR) { opts.onError && opts.onError('unsupported'); return false; }
      if (active) this.stop();
      try {
        rec = new SR();
        rec.lang = opts.lang || (App.lang() === 'hi' ? 'hi-IN' : 'en-IN');
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 3;
      } catch (e) { opts.onError && opts.onError('unsupported'); return false; }

      let finalText = '', alts = [];
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) {
            finalText += r[0].transcript + ' ';
            for (let j = 0; j < r.length && j < 3; j++) alts.push(r[j].transcript);
          } else interim += r[0].transcript;
        }
        opts.onPartial && opts.onPartial((finalText + interim).trim());
      };
      rec.onerror = (e) => {
        active = false;
        const code = e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied'
          : e.error === 'no-speech' ? 'nospeech' : e.error;
        opts.onError && opts.onError(code);
      };
      rec.onend = () => {
        active = false;
        opts.onFinal && opts.onFinal(finalText.trim(), alts);
      };
      try { rec.start(); active = true; } catch (e) { active = false; opts.onError && opts.onError('busy'); return false; }
      return true;
    },

    stop() { if (rec) { try { rec.stop(); } catch (e) { } } active = false; },
    abort() { if (rec) { try { rec.abort(); } catch (e) { } } active = false; },

    /* pick whichever alternative resolves to the most known items */
    bestOf(alts, items) {
      let best = { lines: [], unknown: [], raw: '' };
      (alts || []).forEach((a) => {
        const r = parse(a, items);
        if (r.lines.length > best.lines.length ||
          (r.lines.length === best.lines.length && r.unknown.length < best.unknown.length && r.lines.length)) {
          best = Object.assign(r, { raw: a });
        }
      });
      return best;
    },

    /* text-to-speech for the end-of-day summary */
    speak(text, lang) {
      try {
        if (!w.speechSynthesis) return false;
        w.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang || (App.lang() === 'hi' ? 'hi-IN' : 'en-IN');
        u.rate = 0.95;
        w.speechSynthesis.speak(u);
        return true;
      } catch (e) { return false; }
    }
  };

  App.voice = voice;
  App.parseSpeech = parse;
  App.matchItem = matchItem;
  App.translit = translit;
  App.skel = skel;
})(window);
