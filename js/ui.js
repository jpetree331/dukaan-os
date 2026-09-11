/* ══════════════════════════════════════════════════════════
   Dukaan OS — UI toolkit: modals, toasts, FX, charts, receipts
   ══════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';
  const App = w.App, esc = App.esc, money = App.money;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  App.$ = $; App.$$ = $$;

  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
  App.el = el;

  /* ───────── toasts ───────── */
  const ICON = { ok: '✅', err: '⚠️', warn: '💡', info: 'ℹ️', money: '💰', cart: '🛒' };
  App.toast = function (kind, title, sub, action) {
    const root = $('#toastRoot');
    const node = el(
      '<div class="toast ' + (kind === 'err' ? 'err' : kind === 'warn' ? 'warn' : 'ok') + '">' +
      '<span class="ti">' + (ICON[kind] || ICON.ok) + '</span>' +
      '<span class="tx"><b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span>' +
      (action ? '<button class="undo">' + esc(action.label) + '</button>' : '') + '</div>');
    root.appendChild(node);
    let dead = false;
    const kill = () => { if (dead) return; dead = true; node.classList.add('out'); setTimeout(() => node.remove(), 320); };
    if (action) $('.undo', node).onclick = () => { action.fn(); kill(); };
    setTimeout(kill, action ? 6500 : 3200);
    node.addEventListener('click', (e) => { if (!e.target.closest('.undo')) kill(); });
    return kill;
  };

  /* ───────── modal ───────── */
  let openModals = 0;
  const modalClosers = new Set();
  App.on('secureclear', () => {
    for (const close of [...modalClosers]) close();
    for (const id of ['#toastRoot', '#printArea']) { const node = $(id); if (node) node.innerHTML = ''; }
    const orb = $('#voiceOrb'); if (orb) orb.hidden = true;
    if (App.isLocked()) {
      const shell = $('#shell'); if (shell) { shell.hidden = true; shell.inert = true; }
      const main = $('#main'); if (main) main.innerHTML = '';
    }
  });
  App.modal = function (opts) {
    const context = App.context();
    const back = el('<div class="modal-back"></div>');
    const m = el('<div class="modal' + (opts.wide ? ' wide' : '') + '"></div>');
    m.innerHTML =
      '<div class="modal-head"><h3>' + esc(opts.title || '') + '</h3>' +
      '<button class="icon-btn" data-x>✕</button></div>' +
      '<div class="modal-body"></div>' +
      (opts.foot === false ? '' : '<div class="modal-foot"></div>');
    back.appendChild(m);
    const body = $('.modal-body', m), foot = $('.modal-foot', m);
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);

    const api = { root: m, body, foot, close: () => { busy = false; close(); } };
    const forceClose = () => { busy = false; close(); back.hidden = true; };
    modalClosers.add(forceClose);
    let closed = false, busy = false;
    function close() {
      if (closed || busy) return;
      closed = true;
      modalClosers.delete(forceClose);
      document.removeEventListener('keydown', onk);
      m.classList.add('out'); back.style.opacity = 0;
      setTimeout(() => { back.remove(); App.emit('modalclosed'); }, 240);
      openModals--; if (!openModals) document.body.style.overflow = '';
      if (opts.onClose) opts.onClose();
    }
    (opts.buttons || []).forEach((b) => {
      if (!b) return;
      const btn = el('<button class="btn ' + (b.cls || '') + '">' + esc(b.label) + '</button>');
      btn.onclick = async () => {
        if (busy || closed) return;
        btn.disabled = true;
        try {
          App.assertContext(context);
          // The callback may explicitly close its own modal after an awaited operation.
          let result = b.fn ? b.fn(api) : undefined;
          if (result && typeof result.then === 'function') { busy = true; result = await result; busy = false; }
          if (result === false) return;
          if (b.keepOpen !== true) close();
        } catch (e) { App.reportError(e); }
        finally { busy = false; btn.disabled = false; }
      };
      foot && foot.appendChild(btn);
    });
    $('[data-x]', m).onclick = close;
    back.addEventListener('mousedown', (e) => { if (e.target === back && opts.dismissable !== false) close(); });
    function onk(e) {
      if (e.key === 'Escape' && $('#modalRoot').lastElementChild === back) close();
    }
    document.addEventListener('keydown', onk);
    $('#modalRoot').appendChild(back);
    openModals++; document.body.style.overflow = 'hidden';
    setTimeout(() => { const f = m.querySelector('[autofocus],input,select'); if (!closed && f && w.innerWidth > 860) f.focus(); }, 120);
    if (opts.onReady) opts.onReady(api);
    return api;
  };

  App.confirm = function (title, msg, opts) {
    opts = opts || {};
    return new Promise((res) => {
      App.modal({
        title, body: '<p style="font-size:14.5px;line-height:1.6;color:var(--ink-2)">' + esc(msg) + '</p>',
        buttons: [
          { label: App.t('com.cancel'), cls: 'ghost', fn: () => res(false) },
          { label: opts.ok || App.t('com.confirm'), cls: opts.danger ? 'danger' : 'pri', fn: () => res(true) }
        ],
        onClose: () => res(false)
      });
    });
  };

  App.prompt = function (title, label, opts) {
    opts = opts || {};
    return new Promise((res) => {
      const body = el('<div><div class="field"><label>' + esc(label) + '</label>' +
        '<input class="inp" id="_pv" type="' + (opts.type || 'text') + '" ' +
        (opts.value != null ? 'value="' + esc(opts.value) + '"' : '') +
        (opts.placeholder ? ' placeholder="' + esc(opts.placeholder) + '"' : '') + ' autofocus></div>' +
        (opts.hint ? '<p class="muted" style="font-size:12.5px">' + esc(opts.hint) + '</p>' : '') + '</div>');
      const m = App.modal({
        title, body,
        buttons: [{ label: App.t('com.cancel'), cls: 'ghost', fn: () => res(null) },
        { label: opts.ok || App.t('com.save'), cls: 'pri', fn: () => res($('#_pv', body).value) }],
        onClose: () => res(null)
      });
      $('#_pv', body).addEventListener('keydown', (e) => { if (e.key === 'Enter') { if (!App.isLocked()) { res($('#_pv', body).value); m.close(); } } });
    });
  };

  /* ───────── FX: confetti + fly-to-cart ───────── */
  const fx = $('#fxCanvas'); const fxc = fx.getContext('2d');
  let parts = [], raf = null;
  function sizeFx() { fx.width = innerWidth * devicePixelRatio; fx.height = innerHeight * devicePixelRatio; fxc.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
  sizeFx(); addEventListener('resize', sizeFx);

  function tick() {
    fxc.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0);
    parts.forEach((p) => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr; p.life--;
      fxc.save(); fxc.translate(p.x, p.y); fxc.rotate(p.rot);
      fxc.globalAlpha = Math.min(1, p.life / 30);
      fxc.fillStyle = p.c;
      if (p.shape === 'c') { fxc.beginPath(); fxc.arc(0, 0, p.s / 2, 0, 7); fxc.fill(); }
      else fxc.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      fxc.restore();
    });
    if (parts.length) raf = requestAnimationFrame(tick); else { raf = null; fxc.clearRect(0, 0, innerWidth, innerHeight); }
  }
  App.confetti = function (opts) {
    opts = opts || {};
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const n = opts.count || 90;
    const cx = opts.x != null ? opts.x : innerWidth / 2, cy = opts.y != null ? opts.y : innerHeight * 0.42;
    const cols = opts.colors || ['#F97316', '#F5A524', '#16A34A', '#FBBF24', '#EF4444', '#6366F1', '#34D399'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 9;
      parts.push({
        x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, g: 0.24 + Math.random() * 0.14,
        s: 5 + Math.random() * 8, c: cols[(Math.random() * cols.length) | 0], rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4, life: 80 + Math.random() * 45, shape: Math.random() < 0.35 ? 'c' : 's'
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  App.flyTo = function (fromEl, toSel, emoji) {
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const to = $(toSel); if (!fromEl || !to) return;
    const a = fromEl.getBoundingClientRect(), b = to.getBoundingClientRect();
    const g = el('<div class="fly">' + esc(emoji || '🛒') + '</div>');
    g.style.cssText += 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + Math.min(a.width, 90) + 'px;height:' + Math.min(a.height, 60) + 'px';
    document.body.appendChild(g);
    const dx = (b.left + b.width / 2) - (a.left + Math.min(a.width, 90) / 2);
    const dy = (b.top + b.height / 2) - (a.top + Math.min(a.height, 60) / 2);
    g.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * 0.55 + 'px,' + (dy * 0.35 - 70) + 'px) scale(.7)', opacity: .95, offset: .55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.15)', opacity: 0 }
    ], { duration: 620, easing: 'cubic-bezier(.5,0,.35,1)' }).onfinish = () => g.remove();
  };

  App.bump = function (sel) {
    const n = $(sel); if (!n) return;
    n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop');
  };

  /* haptic nudge on supported phones */
  App.buzz = (ms) => { try { navigator.vibrate && navigator.vibrate(ms || 12); } catch (e) { } };

  /* ───────── charts (hand-rolled SVG, no CDN) ───────── */
  const CDEF = '<defs>' +
    '<linearGradient id="gSaffron" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F97316"/><stop offset="100%" stop-color="#F5A524"/></linearGradient>' +
    '<linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F97316" stop-opacity=".28"/><stop offset="100%" stop-color="#F97316" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#16A34A"/><stop offset="100%" stop-color="#4ADE80"/></linearGradient>' +
    '</defs>';

  App.chart = {
    bars(data, opts) {
      opts = opts || {};
      const W = 700, H = opts.height || 220, pl = 44, pr = 8, pt = 14, pb = 26;
      const iw = W - pl - pr, ih = H - pt - pb;
      const max = Math.max(1, ...data.map((d) => d.value));
      const bw = iw / data.length, gap = Math.min(10, bw * 0.28);
      let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img">' + CDEF;
      for (let i = 0; i <= 4; i++) {
        const y = pt + ih - (ih * i / 4);
        s += '<line class="c-grid" x1="' + pl + '" y1="' + y + '" x2="' + (W - pr) + '" y2="' + y + '" stroke-dasharray="' + (i ? '3 5' : '0') + '"/>';
        s += '<text class="c-lbl" x="' + (pl - 7) + '" y="' + (y + 3.5) + '" text-anchor="end">' + App.short(max * i / 4) + '</text>';
      }
      data.forEach((d, i) => {
        const h = Math.max(d.value > 0 ? 3 : 0, ih * (d.value / max));
        const x = pl + i * bw + gap / 2, y = pt + ih - h;
        s += '<rect class="c-bar" x="' + x + '" y="' + y + '" width="' + (bw - gap) + '" height="' + h + '" rx="5">' +
          '<title>' + esc(d.label) + ': ' + money(d.value) + '</title>' +
          '<animate attributeName="height" from="0" to="' + h + '" dur="0.6s" fill="freeze" calcMode="spline" keySplines=".22 1 .36 1"/>' +
          '<animate attributeName="y" from="' + (pt + ih) + '" to="' + y + '" dur="0.6s" fill="freeze" calcMode="spline" keySplines=".22 1 .36 1"/></rect>';
        const step = Math.ceil(data.length / 12);
        if (i % step === 0 || i === data.length - 1)
          s += '<text class="c-lbl" x="' + (x + (bw - gap) / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(d.short || d.label) + '</text>';
      });
      return '<div class="chart-box">' + s + '</svg></div>';
    },

    line(data, opts) {
      opts = opts || {};
      const W = 700, H = opts.height || 230, pl = 46, pr = 10, pt = 16, pb = 26;
      const iw = W - pl - pr, ih = H - pt - pb;
      const max = Math.max(1, ...data.map((d) => d.value));
      const X = (i) => pl + (data.length === 1 ? iw / 2 : iw * i / (data.length - 1));
      const Y = (v) => pt + ih - ih * (v / max);
      let d = '', area = '';
      data.forEach((p, i) => { d += (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(p.value).toFixed(1); });
      area = d + 'L' + X(data.length - 1).toFixed(1) + ',' + (pt + ih) + 'L' + X(0).toFixed(1) + ',' + (pt + ih) + 'Z';
      let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">' + CDEF;
      for (let i = 0; i <= 4; i++) {
        const y = pt + ih - (ih * i / 4);
        s += '<line class="c-grid" x1="' + pl + '" y1="' + y + '" x2="' + (W - pr) + '" y2="' + y + '" stroke-dasharray="' + (i ? '3 5' : '0') + '"/>' +
          '<text class="c-lbl" x="' + (pl - 7) + '" y="' + (y + 3.5) + '" text-anchor="end">' + App.short(max * i / 4) + '</text>';
      }
      s += '<path class="c-area" d="' + area + '"/>';
      s += '<path class="c-line" d="' + d + '" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1">' +
        '<animate attributeName="stroke-dashoffset" from="1" to="0" dur="1s" fill="freeze" calcMode="spline" keySplines=".22 1 .36 1"/></path>';
      data.forEach((p, i) => {
        s += '<circle class="c-dot" cx="' + X(i).toFixed(1) + '" cy="' + Y(p.value).toFixed(1) + '" r="' + (data.length > 20 ? 2.6 : 4) + '">' +
          '<title>' + esc(p.label) + ': ' + money(p.value) + '</title></circle>';
        const step = Math.ceil(data.length / 8);
        if (i % step === 0 || i === data.length - 1)
          s += '<text class="c-lbl" x="' + X(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + esc(p.short || p.label) + '</text>';
      });
      return '<div class="chart-box">' + s + '</svg></div>';
    },

    donut(segs, opts) {
      opts = opts || {};
      const R = 54, C = 2 * Math.PI * R, total = segs.reduce((s, x) => s + x.value, 0) || 1;
      let off = 0, s = '<svg viewBox="0 0 140 140" width="140" height="140" style="max-width:140px">';
      s += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="var(--line)" stroke-width="18"/>';
      segs.forEach((g) => {
        const len = C * (g.value / total);
        s += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + g.color + '" stroke-width="18" ' +
          'stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" ' +
          'transform="rotate(-90 70 70)" stroke-linecap="butt"><title>' + esc(g.label) + ': ' + money(g.value) + '</title></circle>';
        off += len;
      });
      s += '<text x="70" y="66" text-anchor="middle" style="font-size:15px;font-weight:800;fill:var(--ink)">' + App.short(total) + '</text>';
      s += '<text x="70" y="82" text-anchor="middle" class="c-lbl">' + esc(opts.caption || '') + '</text></svg>';
      return s;
    },

    ring(pct, label) {
      const R = 40, C = 2 * Math.PI * R, v = Math.max(0, Math.min(100, pct));
      const col = v >= 75 ? '#16A34A' : v >= 45 ? '#F5A524' : '#DC2626';
      return '<div class="ring"><svg viewBox="0 0 96 96" width="96" height="96">' +
        '<circle cx="48" cy="48" r="' + R + '" fill="none" stroke="var(--line)" stroke-width="9"/>' +
        '<circle cx="48" cy="48" r="' + R + '" fill="none" stroke="' + col + '" stroke-width="9" stroke-linecap="round" ' +
        'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C + '">' +
        '<animate attributeName="stroke-dashoffset" from="' + C + '" to="' + (C * (1 - v / 100)).toFixed(1) + '" dur="1.1s" fill="freeze" calcMode="spline" keySplines=".22 1 .36 1"/></circle>' +
        '</svg><div class="rv" style="color:' + col + '">' + Math.round(v) + '</div></div>';
    }
  };

  /* ───────── receipt renderer (canvas → PNG / WhatsApp / print) ───────── */
  const THEMES = {
    saffron: { a: '#F97316', b: '#FFF3E6' }, tulsi: { a: '#16A34A', b: '#E9F7EE' },
    indigo: { a: '#6366F1', b: '#EEF0FF' }, ink: { a: '#1F2937', b: '#F1F2F4' }
  };

  App.receiptCanvas = function (bill) {
    const st = App.DB().settings, th = THEMES[st.receiptTheme] || THEMES.saffron;
    const dpr = 2, W = 400;
    const lineH = 26, headH = 178, footH = 210 + (st.upiId ? 190 : 0);
    const H = headH + bill.lines.length * lineH + footH;
    const cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const F = (sz, wt) => (wt || 400) + ' ' + sz + 'px "Segoe UI", system-ui, sans-serif';

    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    c.fillStyle = th.a; c.fillRect(0, 0, W, 8);
    c.fillStyle = th.b; c.fillRect(0, 8, W, 86);

    c.textAlign = 'center';
    c.fillStyle = '#1a1a1a'; c.font = F(21, 800);
    c.fillText(String(st.shopName || 'My Shop').slice(0, 26), W / 2, 42);
    c.font = F(11.5, 400); c.fillStyle = '#666';
    const sub = [st.address, st.shopPhone].filter(Boolean).join(' · ');
    if (sub) c.fillText(sub.slice(0, 52), W / 2, 60);
    if (st.gstin) c.fillText('GSTIN: ' + st.gstin, W / 2, 76);
    else if (sub) c.fillText('— धन्यवाद —', W / 2, 76);

    c.textAlign = 'left'; c.fillStyle = '#333'; c.font = F(12, 600);
    c.fillText((bill.void ? 'VOID · Bill #' : 'Bill #') + bill.no, 18, 118);
    c.textAlign = 'right';
    c.fillText(App.fmtDT(bill.at), W - 18, 118);
    c.textAlign = 'left'; c.font = F(12.5, 700); c.fillStyle = '#1a1a1a';
    c.fillText(String(bill.customerName || 'Walk-in').slice(0, 30), 18, 138);
    c.textAlign = 'right'; c.font = F(11, 600); c.fillStyle = th.a;
    c.fillText((bill.void ? 'CANCELLED' : bill.credit ? 'UDHAAR' : String(bill.mode || 'cash').toUpperCase()), W - 18, 138);

    c.strokeStyle = '#e3e3e3'; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(14, 152); c.lineTo(W - 14, 152); c.stroke(); c.setLineDash([]);

    c.textAlign = 'left'; c.font = F(10.5, 700); c.fillStyle = '#999';
    c.fillText('ITEM', 18, 170); c.textAlign = 'center'; c.fillText('QTY', 244, 170);
    c.textAlign = 'right'; c.fillText('RATE', 312, 170); c.fillText('AMOUNT', W - 18, 170);

    let y = headH + 12;
    bill.lines.forEach((l) => {
      c.textAlign = 'left'; c.fillStyle = '#1a1a1a'; c.font = F(13, 600);
      c.fillText(String(l.name).slice(0, 24), 18, y);
      c.font = F(12.5, 500); c.fillStyle = '#444';
      c.textAlign = 'center'; c.fillText(String(l.qty), 244, y);
      c.textAlign = 'right'; c.fillText(String(l.price), 312, y);
      c.fillStyle = '#1a1a1a'; c.font = F(13, 700);
      c.fillText(App.money(l.gross), W - 18, y);
      y += lineH;
    });

    y += 6;
    c.strokeStyle = '#e3e3e3'; c.beginPath(); c.moveTo(14, y); c.lineTo(W - 14, y); c.stroke();
    y += 22;
    const row = (k, v, bold, col) => {
      c.textAlign = 'left'; c.font = F(bold ? 16 : 12.5, bold ? 800 : 500); c.fillStyle = col || (bold ? '#1a1a1a' : '#555');
      c.fillText(k, 18, y);
      c.textAlign = 'right'; c.fillText(v, W - 18, y);
      y += bold ? 28 : 20;
    };
    row('Subtotal', App.money(bill.sub, true));
    if (bill.discount > 0) row('Discount', '− ' + App.money(bill.discount, true), false, '#16A34A');
    if (bill.tax > 0) row('GST', App.money(bill.tax, true));
    y += 4;
    c.fillStyle = th.b; c.fillRect(10, y - 20, W - 20, 34);
    row('TOTAL', App.money(bill.total, true), true, th.a);
    y += 6;
    if (bill.credit) { c.fillStyle = '#DC2626'; c.font = F(12, 700); c.textAlign = 'center'; c.fillText('⚠ UDHAAR — payment pending', W / 2, y); y += 22; }
    if (bill.loyalty > 0) { c.fillStyle = '#16A34A'; c.font = F(11.5, 600); c.textAlign = 'center'; c.fillText('★ ' + bill.loyalty + ' loyalty points earned', W / 2, y); y += 20; }

    if (st.upiId) {
      try {
        const uri = w.QR.upiUri(st.upiId, st.shopName, bill.credit ? 0 : bill.total, 'Bill ' + bill.no);
        w.QR.toCanvas(c, uri, W / 2 - 62, y + 4, 124, '#111', '#fff');
        y += 136;
        c.textAlign = 'center'; c.fillStyle = '#666'; c.font = F(11, 600);
        c.fillText('Scan to pay · ' + st.upiId, W / 2, y); y += 22;
      } catch (e) { console.warn('QR skipped', e); }
    }
    c.textAlign = 'center'; c.fillStyle = '#999'; c.font = F(11, 500);
    c.fillText('Thank you! फिर आइएगा 🙏', W / 2, y + 6);
    c.fillStyle = '#c4c4c4'; c.font = F(9.5, 500);
    c.fillText('Billed on Dukaan OS', W / 2, y + 24);
    return cv;
  };

  App.billText = function (bill) {
    const st = App.DB().settings;
    let s = '*' + (st.shopName || 'My Shop') + '*\n';
    s += '🧾 Bill #' + bill.no + ' · ' + App.fmtDT(bill.at) + '\n';
    s += '👤 ' + bill.customerName + '\n\n';
    bill.lines.forEach((l) => { s += '• ' + l.name + '  ×' + l.qty + '  —  ' + money(l.gross) + '\n'; });
    s += '\n';
    if (bill.discount > 0) s += 'Discount: −' + money(bill.discount) + '\n';
    if (bill.tax > 0) s += 'GST: ' + money(bill.tax) + '\n';
    s += '*Total: ' + money(bill.total, true) + '*\n';
    s += bill.void ? '\nCANCELLED / VOID — not a payment request\n' : bill.credit ? '\n⚠️ _Udhaar — payment pending_\n' : '✅ Paid by ' + String(bill.mode).toUpperCase() + '\n';
    if (st.upiId && bill.credit && !bill.void) s += '\nPay on UPI: ' + st.upiId + '\n';
    s += '\nधन्यवाद 🙏';
    return s;
  };

  App.whatsapp = function (phone, text) {
    const p = String(phone || '').replace(/\D/g, '');
    const url = 'https://wa.me/' + (p ? (p.length === 10 ? '91' + p : p) : '') + '?text=' + encodeURIComponent(text);
    w.open(url, '_blank', 'noopener');
  };

  App.downloadCanvas = function (cv, name) {
    cv.toBlob((b) => {
      const u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(u), 4000);
    }, 'image/png');
  };

  App.download = function (text, name, mime) {
    const b = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  };

  App.printNode = function (html) {
    let pa = $('#printArea');
    if (!pa) { pa = el('<div id="printArea"></div>'); document.body.appendChild(pa); }
    pa.innerHTML = '<div class="print-sheet">' + html + '</div>';
    w.print();
  };

  /* ───────── CSV ───────── */
  App.toCSV = function (rows) {
    return rows.map((r) => r.map((c) => {
      let s = c == null ? '' : String(c);
      if (typeof c === 'string' && /^[\s]*[=+@-]/.test(s)) s = "'" + s;
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
  };
  App.parseCSV = function (text) {
    if (typeof text !== 'string' || text.length > 4000000) throw new Error('CSV is too large.');
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      if (row.length > 100 || rows.length >= App.limits.records || cur.length > App.limits.text) throw new Error('CSV exceeds the supported row or field limits.');
      const ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false; else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch !== '\r') cur += ch;
    }
    if (cur.length > App.limits.text || row.length > 100) throw new Error('CSV field is too long.');
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
  };

  /* ───────── misc widgets ───────── */
  App.avatarFor = function (name, i) {
    const cls = ['', 'g', 'i'][(String(name).charCodeAt(0) + (i || 0)) % 3];
    const init = String(name || '?').trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
    return '<div class="avatar ' + cls + '">' + esc(init) + '</div>';
  };
  App.emptyState = (emoji, title, sub, btn) =>
    '<div class="empty"><div class="e">' + esc(emoji) + '</div><h4>' + esc(title) + '</h4>' +
    (sub ? '<p>' + esc(sub) + '</p>' : '') + (btn || '') + '</div>';

  App.skeleton = (n, h) => Array.from({ length: n || 3 }, () => '<div class="sk" style="height:' + (h || 64) + 'px;border-radius:16px;margin-bottom:10px"></div>').join('');

  /* number input helper — Indian shopkeepers type on a phone keypad */
  App.numpadModal = function (title, initial, onOk, opts) {
    opts = opts || {};
    const body = el('<div style="text-align:center">' +
      (opts.sub ? '<p class="muted" style="font-size:13px;margin-bottom:10px">' + esc(opts.sub) + '</p>' : '') +
      '<div id="npv" class="num" style="font-size:38px;font-weight:850;padding:12px 0;letter-spacing:-.03em">₹0</div>' +
      (opts.quick ? '<div class="chip-row" style="justify-content:center;margin-bottom:12px">' +
        opts.quick.map((q) => '<button class="chip tap" data-q="' + q + '">' + money(q) + '</button>').join('') + '</div>' : '') +
      '<div class="pin-pad" style="grid-template-columns:repeat(3,1fr);justify-content:center">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫'].map((k) => '<button data-k="' + k + '">' + k + '</button>').join('') +
      '</div></div>');
    let val = initial ? String(initial) : '';
    const paint = () => { $('#npv', body).textContent = '₹' + (val || '0'); };
    paint();
    const m = App.modal({
      title, body,
      buttons: [{ label: App.t('com.cancel'), cls: 'ghost' }, {
        label: opts.ok || App.t('com.confirm'), cls: 'ok',
        fn: async () => { const n = parseFloat(val || '0') || 0; if (n <= 0 && !opts.allowZero) return false; return await onOk(n); }
      }]
    });
    body.addEventListener('click', (e) => {
      const q = e.target.closest('[data-q]'), k = e.target.closest('[data-k]');
      if (q) { val = String(q.dataset.q); paint(); App.buzz(); return; }
      if (!k) return;
      const key = k.dataset.k;
      if (key === '⌫') val = val.slice(0, -1);
      else if (key === '.') { if (val.indexOf('.') < 0) val = (val || '0') + '.'; }
      else if (val.length < 9) val = (val === '0' ? '' : val) + key;
      paint(); App.buzz();
    });
    return m;
  };
})(window);
