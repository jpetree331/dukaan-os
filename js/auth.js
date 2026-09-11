/* ══════════════════════════════════════════════════════════
   Dukaan OS — accounts: sign up / log in / log out
   Local convenience login, not server-enforced authorization or encryption.
   Passwords use salted PBKDF2-SHA256; shop records and staff PINs remain
   in local browser storage. A person controlling that storage can bypass
   the gate. Account namespaces prevent accidental mixing of shop records.
   ══════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';
  const App = w.App;

  const ACCOUNTS_KEY = 'dukaanos.accounts';
  const SESSION_KEY = 'dukaanos.session';
  const GATE_KEY = 'dukaanos.authgate';
  const LOCAL_ID = 'local';
  const ITER = 150000;

  function loadAccounts() {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); }
    catch (e) { throw new Error('Account data is unreadable. Preserve storage and restore a backup.'); }
  }
  function saveAccounts(list) {
    App.assertWriter();
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list)); }
    catch (e) { console.error('Could not save accounts', e); throw new Error('Storage is full or unavailable'); }
  }

  function bytesToHex(bytes) { return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(''); }
  function hexToBytes(hex) {
    const a = new Uint8Array(hex.length / 2);
    for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16);
    return a;
  }

  async function derive(password, saltHex) {
    if (!w.crypto || !w.crypto.subtle) throw new Error('This browser cannot run secure login — please update it');
    const enc = new TextEncoder();
    const salt = saltHex ? hexToBytes(saltHex) : w.crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await w.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await w.crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, keyMaterial, 256);
    return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(salt) };
  }

  function normUser(u) { return String(u || '').trim(); }
  function findAccount(accounts, username) {
    const n = normUser(username).toLowerCase();
    return accounts.find((a) => a.username.toLowerCase() === n);
  }

  const Auth = {
    accounts: loadAccounts,

    /* Whether the app demands a login before opening. Off by default —
       the counter opens straight to the shop — but a shopkeeper who wants
       the till protected can switch it on from Settings. */
    gateOn() {
      try { return localStorage.getItem(GATE_KEY) === 'on'; } catch (e) { return false; }
    },

    /* Turning the gate on/off moves the shop's data between the anonymous
       "local" namespace and the account's own, so the shopkeeper keeps
       working with the same bills and stock either way instead of
       suddenly staring at an empty till. */
    enableGate(accountId) {
      App.assertWriter();
      const local = localStorage.getItem('dukaanos.v2.' + LOCAL_ID);
      if (local) { App.validateData(JSON.parse(local)); localStorage.setItem('dukaanos.v2.' + accountId, local); }
      App.boot(accountId);
      localStorage.setItem(GATE_KEY, 'on');
    },
    disableGate() {
      App.requirePermission('settings');
      const s = this.session();
      if (s && s.accountId) {
        const mine = localStorage.getItem('dukaanos.v2.' + s.accountId);
        if (mine) localStorage.setItem('dukaanos.v2.' + LOCAL_ID, mine);
      }
      localStorage.setItem(GATE_KEY, 'off');
      localStorage.removeItem(SESSION_KEY);
      App.boot(LOCAL_ID);
    },

    session() {
      try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
      catch (e) { return null; }
    },

    /* the account for the current session, or null if there isn't a valid one */
    currentAccount() {
      const s = this.session();
      if (!s || !s.accountId) return null;
      return loadAccounts().find((a) => a.id === s.accountId) || null;
    },

    async signUp({ username, password, confirm, shopName }) {
      username = normUser(username);
      shopName = String(shopName || '').trim();
      if (username.length < 3) throw new Error('Username must be at least 3 characters');
      if (!/^[a-zA-Z0-9_.]+$/.test(username)) throw new Error('Username can only use letters, numbers, "." and "_"');
      if (!shopName) throw new Error('Enter your shop name');
      password = String(password || '');
      if (password.length < 6) throw new Error('Password must be at least 6 characters');
      if (password !== confirm) throw new Error('Passwords do not match');

      const accounts = loadAccounts();
      if (findAccount(accounts, username)) throw new Error('That username is already taken');

      const { hash, salt } = await derive(password);
      const acc = {
        id: App.uid('ac'), username, shopName, hash, salt,
        createdAt: Date.now(), lastLoginAt: Date.now()
      };
      accounts.push(acc);
      saveAccounts(accounts);
      App.initAccountData(acc.id, shopName);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ accountId: acc.id, at: Date.now() }));
      return acc;
    },

    async logIn({ username, password }) {
      const accounts = loadAccounts();
      const acc = findAccount(accounts, username);
      if (!acc) throw new Error('No account with that username');
      const { hash } = await derive(String(password || ''), acc.salt);
      if (hash !== acc.hash) throw new Error('Incorrect password');
      acc.lastLoginAt = Date.now();
      saveAccounts(accounts);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ accountId: acc.id, at: Date.now() }));
      return acc;
    },

    logOut() {
      try { App.persistNow && App.persistNow(); } catch (e) { /* best-effort flush before leaving */ }
      localStorage.removeItem(SESSION_KEY);
      App.accountId = null;
    },

    async changePassword(accountId, oldPassword, newPassword) {
      const accounts = loadAccounts();
      const acc = accounts.find((a) => a.id === accountId);
      if (!acc) throw new Error('Account not found');
      const check = await derive(String(oldPassword || ''), acc.salt);
      if (check.hash !== acc.hash) throw new Error('Current password is incorrect');
      if (String(newPassword || '').length < 6) throw new Error('New password must be at least 6 characters');
      const fresh = await derive(newPassword);
      acc.hash = fresh.hash; acc.salt = fresh.salt;
      saveAccounts(accounts);
    },

    /* Removes the login AND every bill/item/customer/supplier that account
       ever had. Requires the password again — this is irreversible. */
    async deleteAccount(accountId, password) {
      const accounts = loadAccounts();
      const acc = accounts.find((a) => a.id === accountId);
      if (!acc) throw new Error('Account not found');
      const { hash } = await derive(String(password || ''), acc.salt);
      if (hash !== acc.hash) throw new Error('Incorrect password');
      saveAccounts(accounts.filter((a) => a.id !== accountId));
      App.wipeAccountData(accountId);
      const s = this.session();
      if (s && s.accountId === accountId) localStorage.removeItem(SESSION_KEY);
    }
  };

  App.auth = Auth;
})(window);
