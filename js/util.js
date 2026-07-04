/* Shared helpers: color math, XML escaping, data conversion, DOM sugar. */
(function () {
  'use strict';

  const U = {};

  /* ---------- DOM ---------- */

  U.el = function (tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (v !== null && v !== undefined) node.setAttribute(k, v);
      }
    }
    if (children) {
      for (const c of [].concat(children)) {
        if (c === null || c === undefined) continue;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return node;
  };

  U.debounce = function (fn, ms) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  };

  U.toast = function (msg, kind) {
    const box = document.getElementById('toasts');
    if (!box) return;
    const t = U.el('div', { class: 'toast ' + (kind || 'info'), text: msg });
    box.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
  };

  /* ---------- Colors ----------
     Internal color format is Android-style #AARRGGBB (always 9 chars, uppercase). */

  U.normalizeColor = function (raw) {
    if (typeof raw !== 'string') return '#FF000000';
    let s = raw.trim().replace(/^#/, '').toUpperCase();
    if (!/^[0-9A-F]+$/.test(s)) return null;
    if (s.length === 3) s = 'FF' + s.split('').map(c => c + c).join('');
    else if (s.length === 4) s = s.split('').map(c => c + c).join('');
    else if (s.length === 6) s = 'FF' + s;
    else if (s.length !== 8) return null;
    return '#' + s;
  };

  U.colorParts = function (aarrggbb) {
    const c = U.normalizeColor(aarrggbb) || '#FF000000';
    return {
      a: parseInt(c.slice(1, 3), 16),
      r: parseInt(c.slice(3, 5), 16),
      g: parseInt(c.slice(5, 7), 16),
      b: parseInt(c.slice(7, 9), 16),
      rgbHex: '#' + c.slice(3)
    };
  };

  U.composeColor = function (rgbHex, alpha255) {
    const rgb = rgbHex.replace(/^#/, '').toUpperCase();
    const a = Math.max(0, Math.min(255, Math.round(alpha255)));
    return '#' + a.toString(16).padStart(2, '0').toUpperCase() + rgb;
  };

  U.toCss = function (aarrggbb) {
    const p = U.colorParts(aarrggbb);
    return `rgba(${p.r},${p.g},${p.b},${(p.a / 255).toFixed(3)})`;
  };

  /* Perceived luminance 0..1 — used to auto-pick contrasting preview text. */
  U.luminance = function (aarrggbb) {
    const p = U.colorParts(aarrggbb);
    return (0.299 * p.r + 0.587 * p.g + 0.114 * p.b) / 255;
  };

  /* ---------- XML ---------- */

  U.xmlEscape = function (s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  };

  U.validXmlName = function (s) {
    return /^[A-Za-z_][A-Za-z0-9_.]*$/.test(s);
  };

  /* ---------- Data conversion ---------- */

  U.dataUrlToBytes = function (dataUrl) {
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  };

  U.fileToDataUrl = function (file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  };

  U.downloadBlob = function (blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };

  U.humanSize = function (bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  U.slug = function (s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'theme';
  };

  window.Util = U;
})();
