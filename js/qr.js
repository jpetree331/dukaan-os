/* ══════════════════════════════════════════════════════════
   Dukaan OS — minimal QR encoder (byte mode, ECC L/M)
   Written in-house so the UPI QR still renders with zero
   internet, which is the whole point of section 16.
   ══════════════════════════════════════════════════════════ */
(function (w) {
  'use strict';

  const ECC_CW = {
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]
  };
  const ECC_BLK = {
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]
  };
  const FORMAT_BITS = { L: 1, M: 0, Q: 3, H: 2 };

  function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z & 0xFF;
  }
  function rsDivisor(deg) {
    const r = new Uint8Array(deg); r[deg - 1] = 1;
    let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < deg; j++) { r[j] = gfMul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; }
      root = gfMul(root, 0x02);
    }
    return r;
  }
  function rsRemainder(data, div) {
    const res = new Uint8Array(div.length);
    for (let k = 0; k < data.length; k++) {
      const factor = data[k] ^ res[0];
      res.copyWithin(0, 1); res[res.length - 1] = 0;
      for (let i = 0; i < div.length; i++) res[i] ^= gfMul(div[i], factor);
    }
    return res;
  }

  function rawDataModules(ver) {
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function dataCodewords(ver, ecl) {
    return Math.floor(rawDataModules(ver) / 8) - ECC_CW[ecl][ver] * ECC_BLK[ecl][ver];
  }
  function alignPositions(ver) {
    if (ver === 1) return [];
    const n = Math.floor(ver / 7) + 2;
    const step = (ver === 32) ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    const out = [6];
    for (let pos = ver * 4 + 10; out.length < n; pos -= step) out.splice(1, 0, pos);
    return out;
  }

  function utf8(str) {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xC0 | (c >> 6), 0x80 | (c & 63)); }
      else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < str.length) {
        const c2 = str.charCodeAt(++i);
        const cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
        out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      } else { out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
    }
    return out;
  }

  function encode(text, eclWanted) {
    const bytes = utf8(String(text));
    const ecl = ECC_CW[eclWanted] ? eclWanted : 'M';
    let ver = 0;
    for (let v = 1; v <= 40; v++) {
      const ccBits = v <= 9 ? 8 : 16;
      if (dataCodewords(v, ecl) * 8 >= 4 + ccBits + bytes.length * 8) { ver = v; break; }
    }
    if (!ver) throw new Error('QR: data too long');

    /* bit stream */
    const bits = [];
    const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    push(4, 4);
    push(bytes.length, ver <= 9 ? 8 : 16);
    bytes.forEach((b) => push(b, 8));

    const cap = dataCodewords(ver, ecl) * 8;
    push(0, Math.min(4, cap - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);
    for (let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) push(pad, 8);

    const dat = new Uint8Array(bits.length / 8);
    bits.forEach((b, i) => { dat[i >>> 3] |= b << (7 - (i & 7)); });

    /* blocks + interleave */
    const numBlocks = ECC_BLK[ecl][ver], eccLen = ECC_CW[ecl][ver];
    const rawCw = Math.floor(rawDataModules(ver) / 8);
    const shortLen = Math.floor(rawCw / numBlocks) - eccLen;
    const numShort = numBlocks - rawCw % numBlocks;
    const div = rsDivisor(eccLen), blocks = [];
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const len = shortLen + (i < numShort ? 0 : 1);
      const d = dat.slice(k, k + len); k += len;
      blocks.push({ d, e: rsRemainder(d, div) });
    }
    const out = [];
    for (let i = 0; i < shortLen + 1; i++)
      blocks.forEach((b, j) => { if (i < b.d.length) out.push(b.d[i]); });
    for (let i = 0; i < eccLen; i++) blocks.forEach((b) => out.push(b.e[i]));

    /* matrix */
    const size = ver * 4 + 17;
    const mod = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const setF = (x, y, v) => { if (x >= 0 && x < size && y >= 0 && y < size) { mod[y][x] = v; fn[y][x] = true; } };

    for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        setF(cx + dx, cy + dy, d !== 2 && d !== 4);
      }
    };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);

    const ap = alignPositions(ver);
    for (let i = 0; i < ap.length; i++) for (let j = 0; j < ap.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
        setF(ap[j] + dx, ap[i] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }

    function drawFormat(mask) {
      let d = (FORMAT_BITS[ecl] << 3) | mask, rem = d;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const b = ((d << 10) | rem) ^ 0x5412;
      const bit = (i) => (b >>> i) & 1;
      for (let i = 0; i <= 5; i++) setF(8, i, !!bit(i));
      setF(8, 7, !!bit(6)); setF(8, 8, !!bit(7)); setF(7, 8, !!bit(8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, !!bit(i));
      for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, !!bit(i));
      for (let i = 8; i < 15; i++) setF(8, size - 15 + i, !!bit(i));
      setF(8, size - 8, true);
    }
    drawFormat(0);

    if (ver >= 7) {
      let rem = ver;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      const b = (ver << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const v = !!((b >>> i) & 1), a = size - 11 + (i % 3), c = Math.floor(i / 3);
        setF(a, c, v); setF(c, a, v);
      }
    }

    /* data zigzag */
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
          if (!fn[y][x] && i < out.length * 8) { mod[y][x] = ((out[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
        }
      }
    }

    const maskFn = [
      (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0,
      (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
      (x, y) => (x * y) % 2 + (x * y) % 3 === 0, (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0,
      (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0
    ];
    const applyMask = (m) => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++)
        if (!fn[y][x] && maskFn[m](x, y)) mod[y][x] = !mod[y][x];
    };
    function penalty() {
      let p = 0;
      for (let y = 0; y < size; y++) {
        let run = 1;
        for (let x = 1; x < size; x++) {
          if (mod[y][x] === mod[y][x - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
          else run = 1;
        }
      }
      for (let x = 0; x < size; x++) {
        let run = 1;
        for (let y = 1; y < size; y++) {
          if (mod[y][x] === mod[y - 1][x]) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
          else run = 1;
        }
      }
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
        const c = mod[y][x];
        if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3;
      }
      let dark = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (mod[y][x]) dark++;
      const total = size * size;
      p += Math.floor(Math.abs(dark * 20 - total * 10) / total) * 10;
      return p;
    }

    let best = 0, bestP = Infinity;
    for (let m = 0; m < 8; m++) {
      applyMask(m); drawFormat(m);
      const p = penalty();
      if (p < bestP) { bestP = p; best = m; }
      applyMask(m);
    }
    applyMask(best); drawFormat(best);

    return { size, modules: mod, version: ver, ecl };
  }

  function svg(text, opts) {
    opts = opts || {};
    const q = encode(text, opts.ecl || 'M');
    const b = opts.border == null ? 3 : opts.border;
    const dim = q.size + b * 2;
    let path = '';
    for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++)
      if (q.modules[y][x]) path += 'M' + (x + b) + ',' + (y + b) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim + '" shape-rendering="crispEdges" width="' +
      (opts.size || 220) + '" height="' + (opts.size || 220) + '">' +
      '<rect width="' + dim + '" height="' + dim + '" fill="' + (opts.light || '#fff') + '"/>' +
      '<path d="' + path + '" fill="' + (opts.dark || '#111') + '"/></svg>';
  }

  function toCanvas(ctx, text, x, y, px, dark, light) {
    const q = encode(text, 'M');
    const s = px / q.size;
    ctx.fillStyle = light || '#fff'; ctx.fillRect(x, y, px, px);
    ctx.fillStyle = dark || '#000';
    for (let r = 0; r < q.size; r++) for (let c = 0; c < q.size; c++)
      if (q.modules[r][c]) ctx.fillRect(x + c * s, y + r * s, Math.ceil(s), Math.ceil(s));
  }

  /* NPCI UPI deep-link / QR payload */
  function upiUri(vpa, name, amount, note) {
    if (!vpa) return '';
    let u = 'upi://pay?pa=' + encodeURIComponent(vpa) + '&pn=' + encodeURIComponent(name || 'Shop') + '&cu=INR';
    if (amount > 0) u += '&am=' + Number(amount).toFixed(2);
    if (note) u += '&tn=' + encodeURIComponent(String(note).slice(0, 40));
    return u;
  }

  w.QR = { encode, svg, toCanvas, upiUri };
})(window);
