/* Portable encrypted backups. This protects the file, not browser storage. */
(function (w) {
  'use strict';
  const App = w.App, ITER = 600000;
  const aad = new TextEncoder().encode('DukaanOS encrypted backup v1');
  const base64 = (bytes) => {
    let text = '';
    for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(text);
  };
  function bytes(text, max) {
    if (typeof text !== 'string' || text.length > max || !/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw new Error('Invalid encrypted backup.');
    return Uint8Array.from(atob(text), c => c.charCodeAt(0));
  }
  async function key(password, salt) {
    if (typeof password !== 'string' || password.length < 12 || password.length > 256) throw new Error('Backup password must contain 12 to 256 characters.');
    const material = await w.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return w.crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', iterations: ITER, salt }, material,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  App.backups = {
    validatePayload(data) {
      if (!data || data.storageVersion !== 3) return App.validateData(data);
      App.checkDataBounds(data);
      if (Object.keys(data).some(k=>!['storageVersion','book','provenance'].includes(k))) throw new Error('Unknown checkpoint backup field.');
      const p=data.provenance;
      if(!p || p.kind!=='snapshot-checkpoint' || !/^[a-f0-9]{64}$/.test(p.sourceHash) || !Number.isSafeInteger(p.capturedAt) || p.capturedAt<0)throw new Error('Invalid checkpoint provenance.');
      return {storageVersion:3,book:App.validateData(data.book),provenance:{kind:p.kind,sourceHash:p.sourceHash,capturedAt:p.capturedAt}};
    },
    businessData(data) { const p=this.validatePayload(data);return p.storageVersion===3?p.book:p; },
    capture() {
      App.requirePermission('settings');
      const book=App.validateData(App.DB()),m=App.migrations&&App.migrations.info(App.accountId);
      return m?{storageVersion:3,book,provenance:{kind:'snapshot-checkpoint',sourceHash:m.sourceHash,capturedAt:Date.now()}}:book;
    },
    async encrypt(data, password) {
      const payload = this.validatePayload(data),clean=payload.storageVersion===3?payload.book:payload;
      // Restores preserve local security settings; do not distribute reusable PINs.
      clean.settings.pin = ''; clean.settings.pinOn = false;
      clean.staff.forEach(s => { s.pin = ''; });
      const plaintext = new TextEncoder().encode(JSON.stringify(payload));
      // Leave room for the GCM tag, base64 expansion and JSON envelope so every emitted file is importable.
      if (plaintext.length > Math.floor((App.limits.fileBytes - 1024) * 3 / 4) - 16) throw new Error('Backup exceeds the supported file size.');
      const salt = w.crypto.getRandomValues(new Uint8Array(16)), iv = w.crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await w.crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad },
        await key(password, salt), plaintext);
      return { app: 'DukaanOS', format: 'encrypted', version: 1, kdf: 'PBKDF2-SHA256', iterations: ITER,
        salt: base64(salt), iv: base64(iv), ciphertext: base64(new Uint8Array(ciphertext)) };
    },
    async decrypt(envelope, password) {
      if (!envelope || envelope.app !== 'DukaanOS' || envelope.format !== 'encrypted' || envelope.version !== 1 ||
        envelope.kdf !== 'PBKDF2-SHA256' || envelope.iterations !== ITER) throw new Error('Unsupported encrypted backup.');
      const salt = bytes(envelope.salt, 24), iv = bytes(envelope.iv, 16), ciphertext = bytes(envelope.ciphertext, App.limits.fileBytes);
      if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) throw new Error('Invalid encrypted backup.');
      let plain;
      try { plain = await w.crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad }, await key(password, salt), ciphertext); }
      catch (e) { throw new Error('Wrong backup password or damaged backup. Nothing was restored.'); }
      return this.validatePayload(JSON.parse(new TextDecoder().decode(plain)));
    }
  };
})(window);
