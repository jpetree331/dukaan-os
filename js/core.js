/* ══════════════════════════════════════════════════════════
   Dukaan OS — core: state, persistence, offline queue, helpers
   ══════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';
  const App = w.App = w.App || {};

  /* Storage is per-account: App.accountId is set once js/auth.js verifies a
     login/signup, and every key below is namespaced to it so two shopkeepers
     on the same device never see each other's data. There is no key until
     someone is authenticated — see js/auth.js and the boot gate in app.js. */
  App.accountId = null;
  const dataKey = () => 'dukaanos.v2.' + (App.accountId || 'guest');
  const queueKey = () => 'dukaanos.syncq.' + (App.accountId || 'guest');

  /* ───────── helpers ───────── */
  const uid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const round2 = (n) => Math.round((+n + Number.EPSILON) * 100) / 100;

  const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (n, dec) => '₹' + (dec ? inr2 : inr).format(Math.abs(round2(n) || 0) < 0.005 ? 0 : round2(n));
  const short = (n) => {
    n = +n || 0;
    if (Math.abs(n) >= 1e7) return '₹' + (n / 1e7).toFixed(2).replace(/\.00$/, '') + 'Cr';
    if (Math.abs(n) >= 1e5) return '₹' + (n / 1e5).toFixed(2).replace(/\.00$/, '') + 'L';
    if (Math.abs(n) >= 1e3) return '₹' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return money(n);
  };

  const DAY = 864e5;
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const dayKey = (d) => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const daysBetween = (a, b) => Math.floor((startOfDay(b) - startOfDay(a)) / DAY);
  const isToday = (t) => dayKey(t) === dayKey(Date.now());

  function timeAgo(t) {
    const L = App.t ? App.t.bind(App) : (k) => k;
    const s = (Date.now() - t) / 1000;
    if (s < 60) return L('time.now');
    if (s < 3600) return Math.floor(s / 60) + L('time.m');
    if (s < 86400) return Math.floor(s / 3600) + L('time.h');
    const d = Math.floor(s / 86400);
    if (d < 30) return d + L('time.d');
    return Math.floor(d / 30) + L('time.mo');
  }
  const fmtDT = (t) => new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  const fmtD = (t) => new Date(t).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* seeded PRNG so the demo data is identical on every device */
  function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

  /* ───────── default shape ───────── */
  function blank() {
    return {
      v: 2, createdAt: Date.now(),
      settings: {
        lang: 'en', theme: 'light', shopName: 'My Shop', shopPhone: '',
        upiId: '', address: '', gstin: '', currency: '₹',
        lowStock: 5, dailyTarget: 5000, gstEnabled: false, defaultGst: 5,
        receiptTheme: 'saffron', logo: '', pin: '', pinOn: false,
        activeStore: 'st_main', loyaltyRate: 100, loyaltyValue: 1, expiryWarnDays: 30,
        seenSummaryOn: '', celebratedOn: ''
      },
      stores: [{ id: 'st_main', name: 'Main Shop', address: '' }],
      staff: [{ id: 'sf_owner', name: 'Owner', role: 'owner', pin: '', active: true }],
      session: { staffId: 'sf_owner' },
      items: [], customers: [], suppliers: [],
      bills: [], payments: [], purchases: [], supplierPayments: [],
      activity: [], shifts: [], counter: { bill: 1, po: 1 }
    };
  }

  /* ───────── seed catalogue ───────── */
  const SEED_ITEMS = [
    ['Lays Magic Masala', 'लेज़ मैजिक मसाला', 20, 16, 48, 'Snacks', '8901491101837', '🥔', 1],
    ['Kurkure Masala Munch', 'कुरकुरे मसाला मंच', 20, 16, 36, 'Snacks', '8901491100311', '🌽', 1],
    ['Bingo Mad Angles', 'बिंगो मैड एंगल्स', 20, 16, 14, 'Snacks', '8901719119095', '🔺', 0],
    ['Parle-G Biscuit', 'पारले-जी बिस्किट', 10, 8, 72, 'Biscuits', '8901719101007', '🍪', 1],
    ['Britannia Good Day', 'गुड डे बिस्किट', 30, 24, 22, 'Biscuits', '8901063142008', '🍪', 0],
    ['Oreo Chocolate', 'ओरियो चॉकलेट', 30, 24, 4, 'Biscuits', '8901058853582', '🖤', 0],
    ['Dairy Milk 50g', 'डेयरी मिल्क', 50, 41, 26, 'Chocolate', '8901058000108', '🍫', 1],
    ['5 Star', 'फाइव स्टार', 10, 8, 40, 'Chocolate', '8901058000283', '⭐', 1],
    ['Perk', 'पर्क', 10, 8, 0, 'Chocolate', '8901058000306', '🍬', 0],
    ['Maggi 2-Min Noodles', 'मैगी नूडल्स', 14, 11, 64, 'Instant', '8901058000018', '🍜', 1],
    ['Yippee Noodles', 'यिप्पी नूडल्स', 15, 12, 18, 'Instant', '8901725123456', '🍥', 0],
    ['Amul Taaza Milk 500ml', 'अमूल ताज़ा दूध', 27, 25, 12, 'Dairy', '8901262010016', '🥛', 1],
    ['Amul Butter 100g', 'अमूल बटर', 58, 52, 8, 'Dairy', '8901262260015', '🧈', 0],
    ['Amul Dahi 400g', 'अमूल दही', 40, 35, 6, 'Dairy', '8901262090018', '🥣', 0],
    ['Coca-Cola 750ml', 'कोका-कोला', 40, 32, 20, 'Beverages', '8901764012345', '🥤', 1],
    ['Thums Up 750ml', 'थम्स अप', 40, 32, 15, 'Beverages', '8901764023456', '🥤', 0],
    ['Frooti 160ml', 'फ्रूटी', 10, 8, 30, 'Beverages', '8901058111222', '🥭', 1],
    ['Bisleri Water 1L', 'बिसलेरी पानी', 20, 14, 44, 'Beverages', '8901207000019', '💧', 1],
    ['Red Label Tea 250g', 'रेड लेबल चाय', 145, 128, 9, 'Grocery', '8901030612345', '🍵', 0],
    ['Tata Salt 1kg', 'टाटा नमक', 28, 24, 25, 'Grocery', '8901030710014', '🧂', 0],
    ['Fortune Oil 1L', 'फॉर्च्यून तेल', 155, 142, 11, 'Grocery', '8906004340015', '🛢️', 0],
    ['Aashirvaad Atta 5kg', 'आशीर्वाद आटा', 245, 228, 7, 'Grocery', '8901725100112', '🌾', 0],
    ['Sugar 1kg (loose)', 'चीनी 1 किलो', 45, 41, 30, 'Grocery', '', '🍚', 0],
    ['Toor Dal 1kg', 'तूर दाल', 165, 148, 10, 'Grocery', '', '🫘', 0],
    ['Colgate 100g', 'कोलगेट', 60, 51, 14, 'Personal', '8901314010017', '🪥', 0],
    ['Lifebuoy Soap', 'लाइफबॉय साबुन', 35, 29, 21, 'Personal', '8901030621239', '🧼', 0],
    ['Surf Excel 1kg', 'सर्फ एक्सेल', 130, 118, 5, 'Home', '8901030575419', '🧺', 0],
    ['Vim Bar', 'विम बार', 20, 16, 3, 'Home', '8901030601234', '🍽️', 0],
    ['Good Knight Refill', 'गुड नाइट', 78, 68, 6, 'Home', '8901234500019', '🦟', 0],
    ['Cigarette (single)', 'सिगरेट', 20, 17, 50, 'Misc', '', '🚬', 0]
  ];

  const SEED_CUSTOMERS = [
    ['Ramesh Kumar', '9812345670', 0, 34],
    ['Sunita Devi', '9812345671', 0, 12],
    ['Imran Sheikh', '9812345672', 0, 3],
    ['Pooja Sharma', '9812345673', 0, 8],
    ['Vikram Singh', '9812345674', 0, 21],
    ['Anjali Verma', '', 0, 2],
    ['Gupta Ji', '9812345676', 0, 45]
  ];

  const SEED_SUPPLIERS = [
    ['Bhagwati Distributors', '9900112233', 'Snacks, Biscuits', 4200, 6],
    ['Amul Dairy Agent', '9900112244', 'Dairy', 0, 0],
    ['Shree Ram Wholesale', '9900112255', 'Grocery, Home', 9800, -2]
  ];

  /* ───────── state ───────── */
  let DB = blank();
  App.DB = () => DB;

  function load() {
    try {
      const raw = localStorage.getItem(dataKey());
      if (raw) {
        const p = JSON.parse(raw);
        DB = Object.assign(blank(), p);
        DB.settings = Object.assign(blank().settings, p.settings || {});
        return true;
      }
    } catch (e) { console.warn('load failed', e); }
    return false;
  }

  let saveTimer = null, dirty = false;
  function persist() {
    try { localStorage.setItem(dataKey(), JSON.stringify(DB)); dirty = false; }
    catch (e) {
      console.error(e);
      if (App.toast) App.toast('err', 'Storage full', 'Export a backup and clear old bills.');
    }
  }
  function save(opts) {
    dirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 180);
    if (opts && opts.sync !== false) queueSync(opts && opts.op);
    if (!opts || opts.render !== false) App.emit('change');
  }
  App.save = save;
  App.persistNow = persist;
  w.addEventListener('beforeunload', () => { if (dirty) persist(); });

  /* ───────── tiny event bus ───────── */
  const subs = {};
  App.on = (ev, fn) => { (subs[ev] = subs[ev] || []).push(fn); };
  App.emit = (ev, d) => { (subs[ev] || []).forEach((f) => { try { f(d); } catch (e) { console.error(e); } }); };

  /* ───────── offline sync queue ─────────
     No backend is wired up in the MVP, so every mutation lands in a
     durable local queue. When the browser reports it is online we drain
     the queue through App.sync.push — swap that one function for a
     Firestore write and the app is cloud-backed with no other change. */
  let queue = [];
  function loadQueue() {
    try { queue = JSON.parse(localStorage.getItem(queueKey()) || '[]'); } catch (e) { queue = []; }
  }
  function saveQ() { try { localStorage.setItem(queueKey(), JSON.stringify(queue.slice(-500))); } catch (e) { } }

  function queueSync(op) {
    queue.push({ id: uid('q'), op: op || 'update', at: Date.now(), store: DB.settings.activeStore });
    saveQ();
    App.emit('net');
    if (navigator.onLine) drain();
  }
  let draining = false;
  function drain() {
    if (draining || !queue.length || !navigator.onLine) return;
    draining = true;
    App.emit('net');
    setTimeout(() => {
      // Replace this block with a real remote write to go multi-device.
      const n = queue.length;
      queue = []; saveQ(); draining = false;
      App.emit('net');
      if (n > 3) App.toast && App.toast('ok', App.t('sync.done'), App.t('sync.doneSub').replace('{n}', n));
    }, 700);
  }
  App.sync = {
    pending: () => queue.length,
    draining: () => draining,
    drain,
    push: null // hook point for Firebase
  };
  w.addEventListener('online', () => { App.emit('net'); drain(); });
  w.addEventListener('offline', () => App.emit('net'));

  /* ───────── scoped selectors ───────── */
  const S = () => DB.settings.activeStore;
  const mine = (arr) => arr.filter((x) => !x.storeId || x.storeId === S());
  App.S = S;
  App.items = () => mine(DB.items).filter((i) => !i.deleted);
  App.customers = () => mine(DB.customers).filter((c) => !c.deleted);
  App.suppliers = () => mine(DB.suppliers).filter((s) => !s.deleted);
  App.bills = () => mine(DB.bills);
  App.liveBills = () => mine(DB.bills).filter((b) => !b.void);
  App.payments = () => mine(DB.payments);
  App.purchases = () => mine(DB.purchases);
  App.item = (id) => DB.items.find((i) => i.id === id);
  App.customer = (id) => DB.customers.find((c) => c.id === id);
  App.supplier = (id) => DB.suppliers.find((s) => s.id === id);
  App.staff = (id) => DB.staff.find((s) => s.id === id);
  App.me = () => App.staff(DB.session.staffId) || DB.staff[0];
  App.isOwner = () => (App.me() || {}).role === 'owner';
  App.can = (what) => {
    const r = (App.me() || {}).role;
    if (r === 'owner') return true;
    return ['bill', 'view_inventory', 'restock', 'view_customers', 'take_payment'].indexOf(what) > -1;
  };

  /* ───────── stock helpers (FIFO across batches) ───────── */
  function itemStock(it) {
    if (it.batches && it.batches.length) return it.batches.reduce((s, b) => s + (+b.qty || 0), 0);
    return +it.stock || 0;
  }
  function takeStock(it, qty) {
    if (it.batches && it.batches.length) {
      let need = qty;
      it.batches.sort((a, b) => (a.expiry || '9999') < (b.expiry || '9999') ? -1 : 1);
      for (const b of it.batches) {
        if (need <= 0) break;
        const t = Math.min(b.qty, need); b.qty -= t; need -= t;
      }
      it.batches = it.batches.filter((b) => b.qty > 0.0001);
      it.stock = itemStock(it);
      if (need > 0) it.stock = round2(it.stock - need);
    } else {
      it.stock = round2((+it.stock || 0) - qty);
    }
  }
  function giveStock(it, qty, expiry, cost) {
    if (expiry) {
      it.batches = it.batches || [];
      const ex = it.batches.find((b) => b.expiry === expiry);
      if (ex) ex.qty = round2(ex.qty + qty);
      else it.batches.push({ id: uid('b'), qty: round2(qty), expiry, cost: cost || it.cost, at: Date.now() });
      it.stock = itemStock(it);
    } else if (it.batches && it.batches.length) {
      const nx = it.batches.find((b) => !b.expiry);
      if (nx) nx.qty = round2(nx.qty + qty); else it.batches.push({ id: uid('b'), qty: round2(qty), expiry: '', cost: cost || it.cost, at: Date.now() });
      it.stock = itemStock(it);
    } else {
      it.stock = round2((+it.stock || 0) + qty);
    }
  }
  App.itemStock = itemStock; App.takeStock = takeStock; App.giveStock = giveStock;
  App.stockState = (it) => {
    const s = itemStock(it), th = it.threshold != null ? it.threshold : DB.settings.lowStock;
    return s <= 0 ? 'out' : s <= th ? 'low' : 'ok';
  };
  App.expiringBatches = (days) => {
    const lim = Date.now() + (days || DB.settings.expiryWarnDays) * DAY;
    const out = [];
    App.items().forEach((it) => (it.batches || []).forEach((b) => {
      if (b.expiry && b.qty > 0) {
        const t = new Date(b.expiry + 'T23:59:59').getTime();
        if (t <= lim) out.push({ item: it, batch: b, at: t, days: daysBetween(Date.now(), t) });
      }
    }));
    return out.sort((a, b) => a.at - b.at);
  };

  /* ───────── activity log ───────── */
  function log(type, text, meta) {
    DB.activity.unshift({ id: uid('a'), type, text, meta: meta || null, staffId: DB.session.staffId, storeId: S(), at: Date.now() });
    if (DB.activity.length > 800) DB.activity.length = 800;
  }
  App.log = log;
  App.activity = () => mine(DB.activity);

  /* ───────── money-movement actions ───────── */
  App.actions = {
    /* Commit a cart into a bill. Deducts stock, moves credit, awards loyalty. */
    checkout(cart) {
      const st = DB.settings;
      const lines = cart.lines.map((l) => {
        const it = App.item(l.itemId);
        const gstPc = st.gstEnabled ? (l.gst != null ? l.gst : (it && it.gst != null ? it.gst : st.defaultGst)) : 0;
        const gross = round2(l.price * l.qty);
        return { itemId: l.itemId, name: l.name, emoji: l.emoji || '', qty: l.qty, price: l.price, cost: it ? it.cost : 0, gst: gstPc, gross };
      });
      const sub = round2(lines.reduce((s, l) => s + l.gross, 0));
      const disc = round2(clamp(cart.discount || 0, 0, sub));
      const taxable = round2(sub - disc);
      let tax = 0;
      if (st.gstEnabled) {
        const ratio = sub > 0 ? taxable / sub : 0;
        tax = round2(lines.reduce((s, l) => s + (l.gross * ratio) * (l.gst / 100), 0));
      }
      const total = round2(taxable + tax);
      const cust = cart.customerId ? App.customer(cart.customerId) : null;
      const credit = cart.mode === 'credit';

      const bill = {
        id: uid('bl'), no: DB.counter.bill++, storeId: S(),
        customerId: cust ? cust.id : '', customerName: cust ? cust.name : (cart.customerName || 'Walk-in'),
        lines, sub, discount: disc, tax, total,
        paid: credit ? 0 : total, mode: cart.mode || 'cash', credit,
        note: cart.note || '', staffId: DB.session.staffId, at: Date.now(), void: false,
        loyalty: 0, redeemed: round2(cart.redeem || 0)
      };

      lines.forEach((l) => { const it = App.item(l.itemId); if (it) takeStock(it, l.qty); });

      if (cust) {
        if (credit) cust.balance = round2((cust.balance || 0) + total);
        cust.spend = round2((cust.spend || 0) + total);
        cust.visits = (cust.visits || 0) + 1;
        cust.lastAt = Date.now();
        if (!cust.firstAt) cust.firstAt = Date.now();
        if (credit && !cust.dueSince) cust.dueSince = Date.now();
        const pts = Math.floor(total / (st.loyaltyRate || 100));
        cust.points = Math.max(0, round2((cust.points || 0) - (bill.redeemed / (st.loyaltyValue || 1)) + pts));
        bill.loyalty = pts;
      }

      DB.bills.unshift(bill);
      log('bill', `Bill #${bill.no} · ${money(total)} · ${bill.customerName}`, { billId: bill.id });
      save({ op: 'bill' });
      return bill;
    },

    voidBill(id, reason) {
      const b = DB.bills.find((x) => x.id === id);
      if (!b || b.void) return null;
      b.void = true; b.voidAt = Date.now(); b.voidReason = reason || '';
      b.lines.forEach((l) => { const it = App.item(l.itemId); if (it) giveStock(it, l.qty); });
      const c = b.customerId && App.customer(b.customerId);
      if (c) {
        if (b.credit) c.balance = round2((c.balance || 0) - b.total);
        c.spend = round2((c.spend || 0) - b.total);
        c.visits = Math.max(0, (c.visits || 1) - 1);
        c.points = Math.max(0, round2((c.points || 0) - (b.loyalty || 0)));
        if (c.balance <= 0) { c.balance = 0; c.dueSince = null; }
      }
      log('void', `Cancelled bill #${b.no} · ${money(b.total)}`, { billId: b.id });
      save({ op: 'void' });
      return b;
    },

    takePayment(customerId, amount, mode, note) {
      const c = App.customer(customerId); if (!c) return null;
      const amt = round2(clamp(amount, 0, 1e9));
      const p = { id: uid('pm'), storeId: S(), customerId, amount: amt, mode: mode || 'cash', note: note || '', staffId: DB.session.staffId, at: Date.now() };
      DB.payments.unshift(p);
      c.balance = round2(Math.max(0, (c.balance || 0) - amt));
      if (c.balance <= 0) c.dueSince = null;
      log('payment', `${c.name} paid ${money(amt)}`, { customerId });
      save({ op: 'payment' });
      return p;
    },

    recordPurchase(supplierId, lines, paidNow, note) {
      const sup = App.supplier(supplierId);
      const total = round2(lines.reduce((s, l) => s + l.qty * l.cost, 0));
      const paid = round2(clamp(paidNow || 0, 0, total));
      const po = {
        id: uid('po'), no: DB.counter.po++, storeId: S(), supplierId,
        supplierName: sup ? sup.name : 'Supplier', lines, total, paid, note: note || '',
        staffId: DB.session.staffId, at: Date.now()
      };
      lines.forEach((l) => {
        const it = App.item(l.itemId);
        if (it) { giveStock(it, l.qty, l.expiry || '', l.cost); if (l.cost) it.cost = l.cost; it.lastBuyAt = Date.now(); }
      });
      DB.purchases.unshift(po);
      if (sup) {
        sup.balance = round2((sup.balance || 0) + (total - paid));
        sup.lastAt = Date.now();
        if (sup.balance > 0 && !sup.dueSince) sup.dueSince = Date.now();
      }
      log('purchase', `Stock in from ${po.supplierName} · ${money(total)}`, { poId: po.id });
      save({ op: 'purchase' });
      return po;
    },

    paySupplier(supplierId, amount, mode) {
      const s = App.supplier(supplierId); if (!s) return null;
      const amt = round2(clamp(amount, 0, 1e9));
      DB.supplierPayments.unshift({ id: uid('sp'), storeId: S(), supplierId, amount: amt, mode: mode || 'cash', staffId: DB.session.staffId, at: Date.now() });
      s.balance = round2(Math.max(0, (s.balance || 0) - amt));
      if (s.balance <= 0) s.dueSince = null;
      log('spay', `Paid ${s.name} ${money(amt)}`, { supplierId });
      save({ op: 'spay' });
      return true;
    },

    restock(itemId, qty, expiry, cost) {
      const it = App.item(itemId); if (!it) return;
      giveStock(it, +qty, expiry || '', cost);
      log('restock', `${it.name} +${qty}`, { itemId });
      save({ op: 'restock' });
    }
  };

  /* ───────── analytics ───────── */
  App.stats = {
    range(fromTs, toTs) {
      const bs = App.liveBills().filter((b) => b.at >= fromTs && b.at <= toTs);
      const sales = round2(bs.reduce((s, b) => s + b.total, 0));
      const cost = round2(bs.reduce((s, b) => s + b.lines.reduce((x, l) => x + (l.cost || 0) * l.qty, 0), 0));
      const credit = round2(bs.filter((b) => b.credit).reduce((s, b) => s + b.total, 0));
      const items = bs.reduce((s, b) => s + b.lines.reduce((x, l) => x + l.qty, 0), 0);
      return { bills: bs, count: bs.length, sales, cost, profit: round2(sales - cost), credit, items, avg: bs.length ? round2(sales / bs.length) : 0 };
    },
    today() { const s = startOfDay(Date.now()).getTime(); return this.range(s, s + DAY); },
    days(n) { const s = startOfDay(Date.now() - (n - 1) * DAY).getTime(); return this.range(s, Date.now() + 1); },
    month() { const d = new Date(); return this.range(new Date(d.getFullYear(), d.getMonth(), 1).getTime(), Date.now() + 1); },
    series(n) {
      const out = [];
      for (let i = n - 1; i >= 0; i--) {
        const s = startOfDay(Date.now() - i * DAY).getTime();
        const r = this.range(s, s + DAY - 1);
        out.push({ t: s, label: new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), dow: new Date(s).toLocaleDateString('en-IN', { weekday: 'short' }), value: r.sales, count: r.count, profit: r.profit });
      }
      return out;
    },
    topItems(n, days) {
      const from = days ? startOfDay(Date.now() - (days - 1) * DAY).getTime() : 0;
      const m = {};
      App.liveBills().filter((b) => b.at >= from).forEach((b) => b.lines.forEach((l) => {
        const k = l.itemId || l.name;
        m[k] = m[k] || { id: l.itemId, name: l.name, emoji: l.emoji, qty: 0, amt: 0 };
        m[k].qty += l.qty; m[k].amt = round2(m[k].amt + l.gross);
      }));
      return Object.values(m).sort((a, b) => b.qty - a.qty).slice(0, n || 5);
    },
    dues() {
      return App.customers().filter((c) => (c.balance || 0) > 0.5)
        .map((c) => ({ c, days: c.dueSince ? daysBetween(c.dueSince, Date.now()) : 0 }))
        .sort((a, b) => b.c.balance - a.c.balance);
    },
    totalDue() { return round2(App.customers().reduce((s, c) => s + (c.balance || 0), 0)); },
    totalOwed() { return round2(App.suppliers().reduce((s, x) => s + (x.balance || 0), 0)); },
    stockValue() { return round2(App.items().reduce((s, i) => s + itemStock(i) * (i.cost || 0), 0)); },
    /* velocity = units sold per day over the window */
    velocity(itemId, days) {
      days = days || 21;
      const from = startOfDay(Date.now() - (days - 1) * DAY).getTime();
      let q = 0;
      App.liveBills().filter((b) => b.at >= from).forEach((b) => b.lines.forEach((l) => { if (l.itemId === itemId) q += l.qty; }));
      return q / days;
    },
    cashExpected(dayTs) {
      const s = startOfDay(dayTs || Date.now()).getTime(), e = s + DAY;
      const billCash = App.liveBills().filter((b) => b.at >= s && b.at < e && b.mode === 'cash').reduce((x, b) => x + b.total, 0);
      const payCash = App.payments().filter((p) => p.at >= s && p.at < e && p.mode === 'cash').reduce((x, p) => x + p.amount, 0);
      const out = mine(DB.supplierPayments).filter((p) => p.at >= s && p.at < e && p.mode === 'cash').reduce((x, p) => x + p.amount, 0);
      return { in: round2(billCash + payCash), out: round2(out), net: round2(billCash + payCash - out), billCash: round2(billCash), payCash: round2(payCash) };
    },
    /* 0-100 friendly composite of stock health, dues and sales trend */
    health() {
      const items = App.items();
      const okStock = items.length ? items.filter((i) => App.stockState(i) === 'ok').length / items.length : 1;
      const week = this.days(7).sales, prev = this.range(startOfDay(Date.now() - 13 * DAY).getTime(), startOfDay(Date.now() - 6 * DAY).getTime()).sales;
      const trend = prev > 0 ? clamp(week / prev, 0, 2) / 2 : (week > 0 ? 0.75 : 0.4);
      const due = this.totalDue(), monthSale = this.month().sales || 1;
      const dueScore = clamp(1 - due / Math.max(monthSale, 1), 0, 1);
      const exp = App.expiringBatches(15).length;
      const expScore = clamp(1 - exp / 10, 0, 1);
      const score = Math.round((okStock * 32 + trend * 30 + dueScore * 26 + expScore * 12));
      return { score: clamp(score, 3, 100), stock: Math.round(okStock * 100), trend: Math.round(trend * 200), dues: Math.round(dueScore * 100), expiry: exp };
    }
  };

  /* ───────── seeding ───────── */
  function seed() {
    const R = rng(20260724);
    const now = Date.now();
    DB.items = SEED_ITEMS.map((s, i) => ({
      id: 'it_' + i, storeId: 'st_main', name: s[0], nameHi: s[1], price: s[2], cost: s[3],
      stock: s[4], category: s[5], barcode: s[6], emoji: s[7], fav: !!s[8],
      threshold: null, gst: [12, 18].indexOf(s[2]) > -1 ? 12 : 5, batches: [], at: now - 60 * DAY
    }));
    // a couple of batches with expiry so the FIFO / expiry features have data
    const withExp = (idx, qty, dOffset) => {
      const it = DB.items[idx];
      it.batches = [{ id: uid('b'), qty: Math.round(it.stock * 0.6), expiry: dayKey(now + dOffset * DAY), cost: it.cost, at: now - 20 * DAY },
      { id: uid('b'), qty: it.stock - Math.round(it.stock * 0.6), expiry: dayKey(now + (dOffset + 90) * DAY), cost: it.cost, at: now - 4 * DAY }];
      if (qty) it.stock = itemStock(it);
    };
    withExp(11, 1, 4);   // Amul milk – expires in 4 days
    withExp(13, 1, 9);   // Dahi
    withExp(6, 1, 26);   // Dairy milk
    withExp(3, 1, 120);

    DB.customers = SEED_CUSTOMERS.map((c, i) => ({
      id: 'cu_' + i, storeId: 'st_main', name: c[0], phone: c[1], balance: 0, spend: 0, visits: 0,
      points: 0, dueSince: null, birthday: i === 0 ? dayKey(now + 2 * DAY).slice(5) : (i === 3 ? dayKey(now).slice(5) : ''),
      note: '', at: now - c[3] * DAY, firstAt: now - c[3] * DAY
    }));
    DB.suppliers = SEED_SUPPLIERS.map((s, i) => ({
      id: 'sp_' + i, storeId: 'st_main', name: s[0], phone: s[1], supplies: s[2],
      balance: s[3], dueSince: s[3] ? now - Math.abs(s[4]) * DAY : null,
      dueDate: s[3] ? dayKey(now + s[4] * DAY) : '', at: now - 90 * DAY
    }));

    // ~5 weeks of plausible trading history
    const modes = ['cash', 'cash', 'cash', 'upi', 'upi', 'card', 'credit'];
    for (let d = 34; d >= 0; d--) {
      const ts0 = startOfDay(now - d * DAY).getTime();
      const dow = new Date(ts0).getDay();
      const busy = (dow === 0 || dow === 6) ? 1.35 : 1;
      const n = Math.round((6 + R() * 9) * busy);
      for (let k = 0; k < n; k++) {
        const hour = 8 + Math.floor(R() * 13);
        const at = ts0 + hour * 36e5 + Math.floor(R() * 36e5);
        if (at > now) continue;
        const nLines = 1 + Math.floor(R() * 4);
        const lines = [];
        for (let j = 0; j < nLines; j++) {
          const it = DB.items[Math.floor(R() * DB.items.length)];
          if (lines.some((l) => l.itemId === it.id)) continue;
          const qty = 1 + Math.floor(R() * (it.price > 100 ? 1.4 : 3));
          lines.push({ itemId: it.id, name: it.name, emoji: it.emoji, qty, price: it.price, cost: it.cost, gst: it.gst, gross: round2(it.price * qty) });
        }
        if (!lines.length) continue;
        const sub = round2(lines.reduce((s, l) => s + l.gross, 0));
        const mode = modes[Math.floor(R() * modes.length)];
        const named = R() < 0.42;
        const cust = named ? DB.customers[Math.floor(R() * DB.customers.length)] : null;
        const credit = mode === 'credit' && !!cust;
        const total = sub;
        const b = {
          id: 'bl_' + d + '_' + k, no: DB.counter.bill++, storeId: 'st_main',
          customerId: cust ? cust.id : '', customerName: cust ? cust.name : 'Walk-in',
          lines, sub, discount: 0, tax: 0, total, paid: credit ? 0 : total,
          mode: credit ? 'credit' : mode, credit, note: '', staffId: 'sf_owner', at, void: false,
          loyalty: cust ? Math.floor(total / 100) : 0, redeemed: 0
        };
        DB.bills.push(b);
        if (cust) {
          cust.spend = round2(cust.spend + total); cust.visits++; cust.lastAt = at;
          cust.points = round2(cust.points + b.loyalty);
          if (credit) { cust.balance = round2(cust.balance + total); if (!cust.dueSince) cust.dueSince = at; }
        }
      }
    }
    DB.bills.sort((a, b) => b.at - a.at);

    // some part-payments so balances look lived-in
    DB.customers.forEach((c, i) => {
      if (c.balance > 300 && i % 2 === 0) {
        const amt = round2(c.balance * 0.4);
        DB.payments.push({ id: uid('pm'), storeId: 'st_main', customerId: c.id, amount: amt, mode: 'cash', staffId: 'sf_owner', at: now - (2 + i) * DAY });
        c.balance = round2(c.balance - amt);
      }
    });

    DB.activity.push({ id: uid('a'), type: 'sys', text: 'Shop set up on Dukaan OS', staffId: 'sf_owner', storeId: 'st_main', at: now - 35 * DAY });
    DB.settings.demo = true;
    persist();
  }
  /* Sample data is opt-in only (Settings → Load sample data on a brand-new
     shop). Nothing seeds itself automatically — a fresh account boots with
     a genuinely empty ledger. */
  App.seed = seed;
  App.isBlankAccount = () => !DB.items.length && !DB.customers.length && !DB.bills.length && !DB.suppliers.length;

  App.resetAll = function () {
    localStorage.removeItem(dataKey());
    localStorage.removeItem(queueKey());
    location.reload();
  };

  /* Called once by js/auth.js right after a brand-new account is created,
     so the very first thing ever written for that account is an empty
     shop — no demo items, no demo bills, no demo customers. */
  App.initAccountData = function (accountId, shopName) {
    App.accountId = accountId;
    loadQueue();
    DB = blank();
    if (shopName) DB.settings.shopName = shopName;
    persist();
    return DB;
  };

  /* Permanently erases one account's shop data — used when an account is
     deleted. Takes an explicit id because the account being removed is not
     always the one currently signed in. */
  App.wipeAccountData = function (accountId) {
    try { localStorage.removeItem('dukaanos.v2.' + accountId); } catch (e) { }
    try { localStorage.removeItem('dukaanos.syncq.' + accountId); } catch (e) { }
  };

  App.boot = function (accountId) {
    App.accountId = accountId || App.accountId;
    loadQueue();
    const had = load();
    if (!had) { DB = blank(); persist(); }
    if (!DB.stores.some((s) => s.id === DB.settings.activeStore)) DB.settings.activeStore = DB.stores[0].id;
    return DB;
  };

  /* export helpers */
  App.util = { uid, clamp, round2, money, money2: (n) => money(n, true), short, inr, DAY, startOfDay, dayKey, daysBetween, isToday, timeAgo, fmtDT, fmtD, esc, rng };
  Object.assign(App, { uid, money, short, esc, round2, clamp, DAY, dayKey, daysBetween, startOfDay, timeAgo, fmtDT, fmtD, isToday });
})(window);
