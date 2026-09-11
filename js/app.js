/* ══════════════════════════════════════════════════════════
   Dukaan OS — shell: routing, theme, lock screen, offline
   ══════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';
  const App = w.App, $ = App.$, $$ = App.$$, t = (k, v) => App.t(k, v);

  let view = 'dashboard', booted = false;

  /* ───────── theme ───────── */
  App.applyTheme = function () {
    const dark = App.DB().settings.theme === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const b = $('#btnTheme'); if (b) b.textContent = dark ? '☀️' : '🌙';
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', dark ? '#221A13' : '#F97316');
  };

  /* ───────── routing ───────── */
  App.go = function (v) {
    if (!App.views[v]) v = 'dashboard';
    if (!booted || App.isLocked() || App.isSaving()) return;
    if (!App.isOwner() && ['dashboard', 'settings', 'reports', 'suppliers'].includes(v)) v = 'billing';
    view = v;
    location.hash = '#' + v;
    App.render();
    $('#main').scrollTop = 0;
    w.scrollTo({ top: 0, behavior: 'smooth' });
    $('#sidenav').classList.remove('open');
    $('#scrim').classList.remove('on');
  };

  App.render = function () {
    if (!booted || App.isLocked() || App.isSaving()) return;
    if (!App.isOwner() && ['dashboard', 'settings', 'reports', 'suppliers'].includes(view)) { view = 'billing'; location.hash = '#billing'; }
    const old = $('#main');
    if (!old) return;
    /* Swap in a brand-new <main> instead of just clearing innerHTML. Each
       view binds its own delegated click handler to this node, and those
       listeners would otherwise pile up on every navigation — two visits to
       Billing meant one tap added the item twice. Replacing the node throws
       the old listeners away with it. */
    const main = document.createElement('main');
    main.id = 'main';
    main.className = old.className;
    old.replaceWith(main);
    try { App.views[view](main); }
    catch (e) {
      console.error(e);
      main.innerHTML = '<div class="card"><div class="alert bad"><span class="ai">⚠️</span><span>Something went wrong drawing this screen.<br><code style="font-size:11px">' +
        App.esc(e.message) + '</code></span></div><button class="btn pri" id="errorReload" style="margin-top:12px">Reload</button></div>';
    }
    const errorReload = $('#errorReload', main); if (errorReload) errorReload.onclick = () => location.reload();
    $$('.nav-item').forEach((n) => n.classList.toggle('on', n.dataset.view === view));
    $$('.tab').forEach((n) => n.classList.toggle('on', n.dataset.view === view));
    paintChrome();
  };

  function paintChrome() {
    const db = App.DB(), st = db.settings;
    const me = App.me() || {};
    $('#btnLang').textContent = App.lang() === 'hi' ? 'हिं' : 'EN';
    $('#whoPill').textContent = String(me.name || '?').slice(0, 2).toUpperCase();
    $('#whoPill').title = me.name + ' · ' + t('set.' + me.role);
    const sp = $('#storePill');
    sp.textContent = '🏪 ' + (db.stores.find((s) => s.id === st.activeStore) || {}).name;
    sp.hidden = !App.isOwner();
    $('#btnLock').hidden = !st.pinOn;
    const acc = App.auth.currentAccount();
    $('#btnLogout').hidden = !acc;               /* nothing to log out of while auth is off */
    $('#btnLogout').title = acc ? 'Log out (@' + acc.username + ')' : 'Log out';
    $$('.nav-item, .tab').forEach(n => { n.hidden = !App.isOwner() && ['dashboard', 'settings', 'reports', 'suppliers'].includes(n.dataset.view); });
    const h = App.stats.health();
    const hm = $('#healthMini');
    if (hm) hm.hidden = !App.isOwner();
    if (hm && App.isOwner()) hm.innerHTML = '<span class="muted">' + t('dash.health') + '</span><b style="color:' +
      (h.score >= 75 ? 'var(--ok)' : h.score >= 45 ? 'var(--warn)' : 'var(--bad)') + '">' + h.score + '/100</b>' +
      '<div class="pbar" style="margin-top:6px"><i class="' + (h.score >= 75 ? 'g' : h.score >= 45 ? '' : 'r') + '" style="width:' + h.score + '%"></i></div>';
    App.applyI18n();
    paintNet();
  }

  /* ───────── connectivity pill ───────── */
  function paintNet() {
    const pill = $('#netPill'); if (!pill) return;
    const on = navigator.onLine, q = App.sync.pending();
    const span = pill.querySelector('span');
    pill.classList.toggle('off', !on);
    pill.classList.toggle('sync', on && q > 0);
    span.textContent = on ? 'Saved on this device · online' : 'Saved on this device · offline';
    pill.title = 'Cloud sync is not available. Export backups from Settings.';
  }
  App.on('net', paintNet);
  App.on('saving', busy => {
    $('#shell').inert = busy || App.isLocked();
    $('#modalRoot').inert = busy;
    $('#shell').setAttribute('aria-busy', String(busy));
    const status = $('#netPill span');
    if (busy && status) status.textContent = 'Saving on this device…';
    else if (booted && !App.isLocked()) paintNet();
  });

  let wasOffline = !navigator.onLine;
  w.addEventListener('offline', () => {
    wasOffline = true;
    App.toast('warn', t('sync.offline'), t('sync.offlineHint'));
  });
  w.addEventListener('online', () => {
    if (wasOffline) App.toast('ok', t('sync.online'), App.sync.pending() ? t('sync.pending', { n: App.sync.pending() }) : '');
    wasOffline = false;
  });

  /* re-render whenever state changes, but never while typing */
  let rerender = null, needsRender = false;
  function refreshWhenReady() {
    if (!booted || !needsRender) return;
    const a = document.activeElement;
    if ((a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) || $('#modalRoot').children.length) { paintChrome(); return; }
    needsRender = false;
    App.render();
  }
  App.on('change', () => {
    needsRender = true;
    clearTimeout(rerender);
    rerender = setTimeout(refreshWhenReady, 90);
  });
  App.on('modalclosed', refreshWhenReady);
  document.addEventListener('focusout', () => setTimeout(refreshWhenReady, 0));
  w.addEventListener('error', (e) => { if (e.error) App.reportError(e.error); });
  w.addEventListener('unhandledrejection', (e) => { App.reportError(e.reason); });

  /* ───────── PIN lock screen ───────── */
  let pinBuf = '', onUnlock = null, pinBusy = false;
  function paintPin() {
    $('#pinDots').innerHTML = [0, 1, 2, 3].map((i) => '<i class="' + (i < pinBuf.length ? 'f' : '') + '"></i>').join('');
  }
  App.lock = async function (after) {
    const st = App.DB().settings;
    if (!st.pinOn || !st.pin) {
      if (App.auth.gateOn()) { (await doLogout()); return; }
      after && after(); return;
    }
    App.setLocked(true);
    $('#shell').inert = true;
    $('#main').innerHTML = '';
    onUnlock = after;
    pinBuf = ''; pinBusy = false;
    $('#lockTitle').textContent = st.shopName;
    $('#lockSub').textContent = t('lock.enter');
    $('#pinErr').textContent = '';
    paintPin();
    $('#lockScreen').hidden = false;
    $('#shell').hidden = true;
  };
  function pinPress(k) {
    if (pinBusy || !App.isLocked()) return;
    const st = App.DB().settings;
    if (k === 'del') pinBuf = pinBuf.slice(0, -1);
    else if (pinBuf.length < 4) pinBuf += k;
    paintPin(); App.buzz();
    if (pinBuf.length === 4) {
      pinBusy = true;
      const lockEpoch = App.context().epoch;
      setTimeout(async () => {
        if (lockEpoch !== App.context().epoch) return;
        pinBusy = false;
        try {
          App.auth.checkPin(pinBuf, st.pin);
          if (App.auth.gateOn() && !App.auth.currentAccount()) { (await doLogout()); return; }
          App.setLocked(false);
          $('#shell').inert = false;
          $('#lockScreen').hidden = true;
          $('#shell').hidden = false;
          const f = onUnlock; onUnlock = null;
          f && f();
        } catch (e) {
          $('#pinErr').textContent = e.message;
          $('.lock-card').classList.add('shake');
          setTimeout(() => $('.lock-card').classList.remove('shake'), 460);
          pinBuf = ''; paintPin(); App.buzz(120);
        }
      }, 130);
    }
  }
  $('#pinPad').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫']
    .map((k) => k === '' ? '<span></span>' : '<button data-k="' + (k === '⌫' ? 'del' : k) + '">' + k + '</button>').join('');
  $('#pinPad').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) pinPress(b.dataset.k); });
  document.addEventListener('keydown', (e) => {
    if ($('#lockScreen').hidden) return;
    if (/^\d$/.test(e.key)) pinPress(e.key);
    else if (e.key === 'Backspace') pinPress('del');
  });

  /* ───────── chrome wiring ───────── */
  $$('.nav-item, .tab').forEach((b) => b.addEventListener('click', () => App.go(b.dataset.view)));
  $('#btnMenu').onclick = () => { $('#sidenav').classList.add('open'); $('#scrim').classList.add('on'); };
  $('#scrim').onclick = () => { $('#sidenav').classList.remove('open'); $('#scrim').classList.remove('on'); };
  $('#btnTheme').onclick = async () => {
    const st = App.DB().settings;
    st.theme = st.theme === 'dark' ? 'light' : 'dark';
    (await App.save({ sync: false, render: false }));
    App.applyTheme();
  };
  $('#btnLang').onclick = async () => {
    (await App.setLang(App.lang() === 'hi' ? 'en' : 'hi'));
    App.render();
    App.toast('ok', App.lang() === 'hi' ? 'भाषा: हिन्दी' : 'Language: English');
  };
  $('#btnLock').onclick = async () => (await App.lock(() => App.render()));
  $('#whoPill').onclick = () => App.switchStaff();
  $('#storePill').onclick = () => App.storePicker();
  $('#btnLogout').onclick = () => {
    App.confirm('Log out?', 'Your data stays saved on this device — log back in any time with your username and password.')
      .then(async (ok) => { if (ok) (await doLogout()); });
  };
  async function doLogout() {
    (await App.auth.logOut());
    booted = false;
    location.hash = '';
    location.reload();
  }
  App.logout = doLogout;
  let idleTimer;
  async function suspend() {
    if (!booted || App.isLocked()) return;
    App.invalidateContext();
    if (App.auth.gateOn() || App.DB().settings.pinOn) (await App.lock(() => App.render()));
  }
  async function activity() {
    clearTimeout(idleTimer);
    if (booted && App.auth.gateOn() && !App.auth.currentAccount()) { (await suspend()); return; }
    idleTimer = setTimeout(suspend, 5 * 60 * 1000);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(e => document.addEventListener(e, activity, { passive: true }));
  document.addEventListener('visibilitychange', async () => { if (document.hidden) (await suspend()); else (await activity()); });
  activity().catch(App.reportError);

  /* keyboard shortcuts for a desktop counter */
  document.addEventListener('keydown', (e) => {
    if (!booted || !$('#lockScreen').hidden) return;
    const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName);
    if (e.altKey && /^[1-7]$/.test(e.key)) {
      e.preventDefault();
      App.go(['dashboard', 'billing', 'inventory', 'customers', 'suppliers', 'reports', 'settings'][+e.key - 1]);
      return;
    }
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); const s = $('#posSearch') || $('#invQ') || $('#cusQ'); if (s) s.focus(); }
    if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.metaKey) App.go('billing');
    if (e.key.toLowerCase() === 'v' && view === 'billing') App.startVoice();
  });

  w.addEventListener('hashchange', () => {
    const v = location.hash.replace('#', '');
    if (booted && v && v !== view && App.views[v]) App.go(v);
  });

  /* ───────── auth screen ───────── */
  let authMode = 'login';
  function setAuthMode(mode) {
    authMode = mode === 'signup' ? 'signup' : 'login';
    $$('#authTabs .auth-tab').forEach((b) => b.classList.toggle('on', b.dataset.mode === authMode));
    $('#fShop').hidden = authMode !== 'signup';
    $('#fConfirm').hidden = authMode !== 'signup';
    $('#authSub').textContent = authMode === 'signup' ? 'Create your shop’s account' : 'Sign in to open your counter';
    $('#authSubmit').textContent = authMode === 'signup' ? 'Create account' : 'Log in';
    $('#authErr').textContent = '';
    $('#authSwitch').innerHTML = authMode === 'signup'
      ? 'Already have an account? <button type="button" id="authToggle">Log in</button>'
      : 'New here? <button type="button" id="authToggle">Create an account</button>';
    const tog = $('#authToggle'); if (tog) tog.onclick = () => setAuthMode(authMode === 'signup' ? 'login' : 'signup');
    const first = authMode === 'signup' ? $('#a_shop') : $('#a_user');
    if (first && w.innerWidth > 860) setTimeout(() => first.focus(), 60);
  }
  $$('#authTabs .auth-tab').forEach((b) => b.addEventListener('click', () => setAuthMode(b.dataset.mode)));

  $('#authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#authSubmit'), errEl = $('#authErr');
    errEl.textContent = '';
    btn.disabled = true;
    const prevLabel = btn.textContent;
    btn.textContent = authMode === 'signup' ? 'Creating…' : 'Signing in…';
    try {
      let acc;
      if (authMode === 'signup') {
        acc = await App.auth.signUp({
          username: $('#a_user').value, password: $('#a_pass').value,
          confirm: $('#a_pass2').value, shopName: $('#a_shop').value
        });
        App.toast('ok', 'Account created', 'Welcome to Dukaan OS, ' + acc.shopName + '!');
      } else {
        acc = await App.auth.logIn({ username: $('#a_user').value, password: $('#a_pass').value });
        App.toast('ok', 'Welcome back', acc.shopName);
      }
      (await enterShell(acc.id));
      $('#authScreen').hidden = true;
      $('#a_pass').value = ''; $('#a_pass2').value = '';
    } catch (err) {
      errEl.textContent = err.message || 'Something went wrong';
      btn.disabled = false;
      btn.textContent = prevLabel;
    }
  });

  /* ───────── boot ───────── */
  async function enterShell(accountId) {
    (await App.boot(accountId));
    App.setLocked(false);
    $('#shell').inert = false;
    App.applyTheme();
    document.documentElement.lang = App.lang();

    const hash = location.hash.replace('#', '');
    if (hash && App.views[hash]) view = hash;

    const run = () => {
      $('#boot').hidden = false;
      $('#boot').classList.remove('out');
      requestAnimationFrame(() => $('#boot').classList.add('out'));
      $('#shell').hidden = false;
      booted = true;
      App.render();
      setTimeout(() => { $('#boot').hidden = true; }, 450);
      /* morning brief once a day, after the UI has settled */
      setTimeout(async () => {
        if (!App.isLocked() && App.isOwner() && !document.querySelector('.modal-back')) (await App.morningBrief(false));
      }, 1100);
      if (navigator.onLine) App.sync.drain();
    };

    /* honour the skeleton for a beat so the first paint never flashes empty */
    setTimeout(async () => {
      if (App.DB().settings.pinOn && App.DB().settings.pin) {
        $('#boot').hidden = true;
        (await App.lock(() => { $('#shell').hidden = false; booted = true; App.render(); if (navigator.onLine) App.sync.drain(); }));
      } else run();
    }, 320);
  }

  /* The login gate is OFF by default: the counter opens straight to the
     shop, no sign-in in the way. A shopkeeper who wants the till locked
     down turns it on from Settings → Account & security, which creates
     their account and carries the existing shop data across. Either way
     the storage model is identical (see dataKey() in core.js) and nothing
     is ever seeded — a fresh install starts genuinely empty. */
  const LOCAL_ACCOUNT_ID = 'local';

  async function start() {
    try {
      if (!await App.acquireWriter()) throw new Error('Dukaan OS is already open in another tab. Close that tab, then reload this one.');
      document.documentElement.lang = 'en';
      $('#authScreen').hidden = true;

      if (!App.auth.gateOn()) { (await enterShell(LOCAL_ACCOUNT_ID)); return; }

      setAuthMode('login');
      const acc = App.auth.currentAccount();

      if (!acc) {
        /* Gate is on and nobody is signed in — the counter stays shut. */
        $('#boot').hidden = true;
        $('#shell').hidden = true;
        $('#lockScreen').hidden = true;
        $('#authScreen').hidden = false;
        return;
      }
      (await enterShell(acc.id));
    } catch (e) {
      $('#boot').hidden = true;
      $('#shell').hidden = true;
      $('#authScreen').hidden = true;
      const panel = document.createElement('div');
      panel.className = 'card';
      panel.innerHTML = '<h2>Counter could not open</h2><p>' + App.esc(e.message) +
        '</p><p>Existing shop data has been preserved. Close other tabs and retry. If data is damaged, keep this browser profile and contact the shop owner to recover from a backup.</p>' +
        '<button class="btn pri" id="retryOpen">Reload</button>';
      document.body.appendChild(panel);
      $('#retryOpen', panel).onclick = () => location.reload();
      App.setLocked(true);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  /* Service worker — makes the app installable and fully offline.
     Skipped on localhost: the cache-first shell would otherwise keep
     serving the previous build while developing. */
  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !isLocalhost) {
    w.addEventListener('load', () => navigator.serviceWorker.register('sw.js').then(registration => {
      const notifyUpdate = () => {
        if (registration.waiting) App.toast('info', 'Update ready', 'Finish your work, close every Dukaan OS tab, then reopen to install the update.');
      };
      notifyUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener('statechange', notifyUpdate);
      });
    }).catch(() => { }));
  }
})(window);
