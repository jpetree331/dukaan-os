/* Persistence validation and the single writable counter per browser origin. */
(function (w) {
  'use strict';
  const App = w.App;
  let locked = false, epoch = 0;
  App.isLocked = () => locked;
  App.context = () => ({ epoch, account: App.accountId, staff: App.DB().session.staffId, store: App.S() });
  App.contextValid = (c) => !locked && c.epoch === epoch && c.account === App.accountId &&
    c.staff === App.DB().session.staffId && c.store === App.S();
  App.assertContext = (c) => { if (!App.contextValid(c)) throw new Error('The counter changed or locked. Open this action again.'); App.requireAccess(); };
  App.invalidateContext = () => { epoch++; App.emit('secureclear'); };
  App.setLocked = (value) => { locked = value; if (value) App.invalidateContext(); };
  App.requireAccess = () => {
    if (App.isSaving && App.isSaving()) throw new Error('A save is already in progress. Wait for it to finish.');
    if (locked || (App.auth && App.auth.gateOn() && !App.auth.currentAccount())) throw new Error('Unlock or sign in to continue.');
    const staff = App.me();
    if (!staff || staff.active === false) throw new Error('This staff member is not active.');
  };
  App.limits = { fileBytes: 16 * 1024 * 1024, text: 4096, records: 50000 };
  App.checkFile = (file) => { if (!file || file.size > App.limits.fileBytes) throw new Error('File is too large (maximum 16 MB).'); };
  // Bound the object before cloning or recursion in the schema validator.
  App.checkDataBounds = (input) => {
    const pending = [[input, 0]], seen = new Set(); let nodes = 0, chars = 0;
    while (pending.length) {
      const [value, depth] = pending.pop();
      if (++nodes > 500000 || depth > 16) throw new Error('Shop data is too large or too deeply nested.');
      if (typeof value === 'string') {
        chars += value.length;
        if (value.length > App.limits.text || chars > 4000000) throw new Error('Shop data contains too much text.');
      } else if (value && typeof value === 'object') {
        if (seen.has(value)) throw new Error('Shop data contains repeated or circular objects.');
        seen.add(value);
        if (Array.isArray(value) && value.length > App.limits.records) throw new Error('Too many records in one collection.');
        for (const [key, child] of Object.entries(value)) {
          if (key.length > 100 || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Unsafe data key.');
          pending.push([child, depth + 1]);
        }
      }
    }
  };
  let writable = false, release;
  App.assertWriter = () => {
    if (!writable) throw new Error('This counter is not writable. Close the other Dukaan OS tab and reload.');
  };
  App.acquireWriter = () => new Promise((resolve, reject) => {
    if (writable) return resolve(true);
    if (!navigator.locks) return reject(new Error('This browser cannot safely coordinate shop storage. Use a current browser on HTTPS or localhost.'));
    navigator.locks.request('dukaanos-counter-writer', { ifAvailable: true }, async (lock) => {
      if (!lock) return resolve(false);
      writable = true;
      resolve(true);
      await new Promise((r) => { release = r; });
      writable = false;
    }).catch(reject);
  });
  w.addEventListener('pagehide', () => { App.invalidateContext(); writable = false; if (release) release(); });
  w.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });

  App.requirePermission = (permission) => {
    App.assertWriter();
    App.requireAccess();
    if (!App.can(permission)) throw new Error('Owner access required for this action.');
  };
  App.reportError = (e) => App.toast && App.toast('err', 'Not saved', e.message || String(e));
  App.number = (value, name, min = 0, max = 1e9) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
      throw new Error(name + ' must be a number between ' + min + ' and ' + max + '.');
    }
    return value;
  };

  // Validate before replacing storage. Never silently turn unreadable data into an empty shop.
  App.validateData = (input) => {
    App.checkDataBounds(input);
    const d = JSON.parse(JSON.stringify(input, (k, v) => {
      if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('Invalid shop data: non-finite number');
      return v;
    }));
    const obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
    const fail = (s) => { throw new Error('Invalid shop data: ' + s); };
    if (!obj(d) || d.v !== 2 || !obj(d.settings) || !obj(d.session) || !obj(d.counter)) fail('unsupported version or missing settings/session/counter');
    const id = (x) => typeof x === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(x) && !['__proto__', 'constructor', 'prototype'].includes(x);
    const date = (x) => !x || (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && new Date(x).toISOString().slice(0, 10) === x);
    const collections = ['stores', 'staff', 'items', 'customers', 'suppliers', 'bills', 'payments', 'purchases', 'supplierPayments', 'activity', 'shifts'];
    const rootKeys = new Set(['v', 'createdAt', 'settings', 'session', 'counter', ...collections]);
    for (const key of Object.keys(d)) if (!rootKeys.has(key)) fail('unknown field: ' + key);
    for (const key of collections) {
      if (!Array.isArray(d[key])) fail(key + ' must be an array');
      const ids = new Set();
      for (const x of d[key]) {
        if (!obj(x) || !id(x.id) || ids.has(x.id)) fail(key + ' has an invalid or duplicate ID');
        ids.add(x.id);
      }
    }
    const exists = (key, x) => d[key].some((r) => r.id === x);
    if (!d.stores.length || !exists('stores', d.settings.activeStore)) fail('active store is missing');
    if (!d.staff.some((s) => s.role === 'owner' && s.active !== false) || !d.staff.some((s) => s.id === d.session.staffId && s.active !== false)) fail('owner or active staff is missing');
    for (const s of d.staff) if (!['owner', 'cashier'].includes(s.role)) fail('unknown staff role');
    for (const key of collections.filter((k) => !['stores', 'staff'].includes(k))) {
      for (const x of d[key]) {
        // Legacy single-store records have one unambiguous owner. Never guess in multi-store data.
        if (!x.storeId && d.stores.length === 1) x.storeId = d.stores[0].id;
        if (!exists('stores', x.storeId)) fail(key + ' references a missing store');
      }
    }
    const numeric = (x, keys, signed = []) => {
      for (const k of keys) if (x[k] != null) App.number(x[k], k, signed.includes(k) ? -1e9 : 0);
    };
    for (const key of ['bill', 'po']) if (!Number.isSafeInteger(d.counter[key]) || d.counter[key] < 1) fail('invalid counter');
    numeric(d.settings, ['lowStock', 'dailyTarget', 'defaultGst', 'loyaltyRate', 'loyaltyValue', 'expiryWarnDays']);
    if (d.settings.defaultGst > 100 || d.settings.loyaltyRate <= 0 || d.settings.loyaltyValue <= 0) fail('invalid tax or loyalty settings');
    for (const k of ['shopName', 'shopPhone', 'upiId', 'address', 'gstin', 'currency', 'logo', 'pin']) {
      if (d.settings[k] != null && typeof d.settings[k] !== 'string') fail(k + ' must be text');
    }
    for (const [k, values] of Object.entries({ lang: ['en', 'hi'], theme: ['light', 'dark'], receiptTheme: ['saffron', 'tulsi', 'indigo', 'ink'] })) {
      if (d.settings[k] != null && !values.includes(d.settings[k])) fail('invalid ' + k);
    }
    for (const k of ['gstEnabled', 'pinOn']) if (d.settings[k] != null && typeof d.settings[k] !== 'boolean') fail(k + ' must be true or false');
    for (const it of d.items) {
      if (typeof it.name !== 'string' || !it.name.trim()) fail('item name is missing');
      for (const k of ['price', 'cost', 'stock']) App.number(it[k], k);
      numeric(it, ['gst', 'threshold']);
      if (it.gst > 100 || !Array.isArray(it.batches)) fail('invalid GST or batches');
      const ids = new Set();
      for (const b of it.batches) {
        if (!obj(b) || !id(b.id) || ids.has(b.id)) fail('invalid batch ID');
        ids.add(b.id);
        App.number(b.qty, 'batch quantity'); App.number(b.cost, 'batch cost');
        if (!date(b.expiry)) fail('invalid expiry');
      }
    }
    for (const key of ['customers', 'suppliers']) for (const x of d[key]) {
      if (typeof x.name !== 'string' || !x.name.trim()) fail('missing name');
      numeric(x, ['balance', 'spend', 'visits', 'points'], ['balance', 'points']);
    }
    const ref = (x, field, key, optional = false) => {
      if (optional && !x[field]) return;
      const target = d[key].find((r) => r.id === x[field]);
      if (!target || (target.storeId && x.storeId && target.storeId !== x.storeId)) fail(field + ' references a missing or different-store record');
    };
    for (const key of ['bills', 'purchases']) for (const b of d[key]) {
      if (!Array.isArray(b.lines) || !b.lines.length) fail('empty transaction lines');
      App.number(b.total, 'total'); App.number(b.at, 'transaction date', 0, 8640000000000000);
      if (!Number.isSafeInteger(b.no) || b.no < 1 || b.no >= d.counter[key === 'bills' ? 'bill' : 'po']) fail('invalid transaction number/counter');
      if (b.mode != null && !['cash', 'upi', 'card', 'credit'].includes(b.mode)) fail('invalid payment mode');
      numeric(b, ['sub', 'discount', 'tax', 'paid', 'loyalty', 'redeemed']);
      App.number(b.paid, 'amount paid');
      if (b.paid > b.total) fail('paid amount exceeds transaction total');
      if (key === 'bills') {
        for (const k of ['sub', 'discount', 'tax']) App.number(b[k], k);
        if (typeof b.credit !== 'boolean' || typeof b.void !== 'boolean') fail('invalid bill status');
        if (b.credit && !b.customerId) fail('credit bill needs a customer');
        if (b.discount > b.sub || Math.abs(b.sub - b.discount + b.tax - b.total) > 0.011) fail('bill totals do not agree');
      }
      ref(b, key === 'bills' ? 'customerId' : 'supplierId', key === 'bills' ? 'customers' : 'suppliers', key === 'bills');
      for (const l of b.lines) {
        ref({ ...l, storeId: b.storeId }, 'itemId', 'items');
        App.number(l.qty, 'quantity', 0.0001); App.number(l.cost, 'cost');
        if (key === 'bills') {
          App.number(l.price, 'price'); App.number(l.gross, 'gross');
          if (typeof l.name !== 'string' || Math.abs(App.round2(l.price * l.qty) - l.gross) > 0.011) fail('invalid bill line');
        }
        numeric(l, ['price', 'gross', 'gst', 'taxable', 'tax']);
        if (l.gst > 100) fail('invalid line GST');
        if (!date(l.expiry)) fail('invalid purchase expiry');
        if (l.allocations != null) {
          if (!Array.isArray(l.allocations) || !l.allocations.length) fail('invalid stock allocations');
          let qty = 0;
          for (const a of l.allocations) {
            if (!obj(a) || !id(a.id) || !date(a.expiry)) fail('invalid stock allocation');
            App.number(a.qty, 'allocation quantity', 0.0001); App.number(a.cost, 'allocation cost');
            qty += a.qty;
          }
          if (Math.abs(qty - l.qty) > 0.00001) fail('stock allocations do not equal sale quantity');
        }
      }
      const subtotal = App.round2(b.lines.reduce((n, l) => n + (key === 'bills' ? l.gross : l.qty * l.cost), 0));
      if (Math.abs(subtotal - (key === 'bills' ? b.sub : b.total)) > 0.011) fail('line totals do not agree');
    }
    for (const key of ['payments', 'supplierPayments']) for (const p of d[key]) {
      App.number(p.amount, 'payment', 0.01); App.number(p.at, 'payment date', 0, 8640000000000000);
      if (!['cash', 'upi', 'card'].includes(p.mode)) fail('invalid payment mode');
      ref(p, key === 'payments' ? 'customerId' : 'supplierId', key === 'payments' ? 'customers' : 'suppliers');
    }
    // Reject objects where display code expects a primitive, including prototype-bearing input.
    const walk = (x) => {
      for (const [k, v] of Object.entries(x)) {
        if (['__proto__', 'constructor', 'prototype'].includes(k)) fail('unsafe object key');
        if (['name', 'nameHi', 'emoji', 'alias', 'category', 'barcode', 'phone', 'note', 'pin', 'customerName', 'supplierName'].includes(k) && typeof v !== 'string') fail(k + ' must be text');
        if (v && typeof v === 'object') walk(v);
      }
    };
    walk(d);
    return d;
  };
})(window);
