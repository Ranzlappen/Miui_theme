/* Renders the settings panel for a section, generically from the platform schema. */
(function () {
  'use strict';

  const U = window.Util;

  function fieldRow(field, control, extraClass) {
    const row = U.el('div', { class: 'field ' + (extraClass || ''), 'data-key': field.key });
    const head = U.el('div', { class: 'field-head' }, [
      U.el('label', { class: 'field-label', text: field.label, for: 'ctl-' + field.key })
    ]);
    row.appendChild(head);
    row.appendChild(control);
    if (field.hint) row.appendChild(U.el('p', { class: 'field-hint', text: field.hint }));
    return row;
  }

  /* ---------- individual control builders ---------- */

  function colorControl(field) {
    const wrap = U.el('div', { class: 'ctl-color' });
    const parts = () => U.colorParts(window.State.value(field.key) || field.default || '#FF000000');

    const swatch = U.el('input', { type: 'color', id: 'ctl-' + field.key, title: 'Pick color' });
    const hex = U.el('input', { type: 'text', class: 'hex-input', spellcheck: 'false', title: 'AARRGGBB hex' });
    const alpha = U.el('input', { type: 'range', min: 0, max: 255, step: 1, class: 'alpha-range', title: 'Opacity' });
    const alphaLabel = U.el('span', { class: 'alpha-label' });

    function sync() {
      const p = parts();
      swatch.value = p.rgbHex.toLowerCase();
      hex.value = U.normalizeColor(window.State.value(field.key) || field.default);
      alpha.value = p.a;
      alphaLabel.textContent = Math.round(p.a / 2.55) + '%';
      const css = U.toCss(hex.value);
      swatch.style.boxShadow = '0 0 0 3px ' + css;
    }

    swatch.addEventListener('input', () => {
      window.State.set(field.key, U.composeColor(swatch.value, parts().a));
      sync();
    });
    alpha.addEventListener('input', () => {
      window.State.set(field.key, U.composeColor(parts().rgbHex, Number(alpha.value)));
      sync();
    });
    hex.addEventListener('change', () => {
      const norm = U.normalizeColor(hex.value);
      if (norm) window.State.set(field.key, norm);
      else U.toast('Invalid hex color — use #RRGGBB or #AARRGGBB', 'error');
      sync();
    });

    wrap.append(swatch, hex, alpha, alphaLabel);
    sync();
    return wrap;
  }

  function textControl(field, multiline) {
    const input = multiline
      ? U.el('textarea', { id: 'ctl-' + field.key, rows: 3 })
      : U.el('input', { type: 'text', id: 'ctl-' + field.key });
    input.value = window.State.value(field.key) ?? '';
    input.addEventListener('change', () => window.State.set(field.key, input.value));
    return input;
  }

  function sliderControl(field) {
    const wrap = U.el('div', { class: 'ctl-slider' });
    const range = U.el('input', {
      type: 'range', id: 'ctl-' + field.key,
      min: field.min, max: field.max, step: field.step || 1
    });
    const out = U.el('span', { class: 'slider-out' });
    range.value = window.State.value(field.key) ?? field.default;
    const render = () => { out.textContent = range.value + (field.unit || ''); };
    range.addEventListener('input', () => {
      window.State.set(field.key, Number(range.value));
      render();
    });
    render();
    wrap.append(range, out);
    return wrap;
  }

  function selectControl(field) {
    const sel = U.el('select', { id: 'ctl-' + field.key });
    for (const o of field.options) {
      sel.appendChild(U.el('option', { value: o.value, text: o.label }));
    }
    sel.value = String(window.State.value(field.key) ?? field.default);
    sel.addEventListener('change', () => window.State.set(field.key, sel.value));
    return sel;
  }

  function toggleControl(field) {
    const wrap = U.el('label', { class: 'ctl-toggle' });
    const input = U.el('input', { type: 'checkbox', id: 'ctl-' + field.key });
    input.checked = !!window.State.value(field.key);
    input.addEventListener('change', () => window.State.set(field.key, input.checked));
    wrap.append(input, U.el('span', { class: 'toggle-track' }, U.el('span', { class: 'toggle-thumb' })));
    return wrap;
  }

  function uploadControl(field) {
    const wrap = U.el('div', { class: 'ctl-upload' });
    const input = U.el('input', { type: 'file', accept: field.accept || '*/*', hidden: '' });
    const btn = U.el('button', { class: 'btn small', type: 'button', text: 'Choose file…' });
    const info = U.el('span', { class: 'upload-info' });
    const clear = U.el('button', { class: 'btn ghost small', type: 'button', text: '✕', title: 'Remove' });
    let thumb = null;

    function render() {
      const asset = window.State.asset(field.key);
      info.textContent = asset ? `${asset.name} · ${U.humanSize(asset.size)}` : 'No file selected';
      clear.hidden = !asset;
      if (thumb) { thumb.remove(); thumb = null; }
      if (asset && field.type === 'image') {
        thumb = U.el('img', { class: 'upload-thumb', src: asset.dataUrl, alt: '' });
        wrap.appendChild(thumb);
      }
      if (asset && field.type === 'audio') {
        thumb = U.el('audio', { class: 'upload-audio', controls: '', src: asset.dataUrl });
        wrap.appendChild(thumb);
      }
    }

    btn.addEventListener('click', () => input.click());
    clear.addEventListener('click', () => { window.State.setAsset(field.key, null); render(); });
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 24 * 1024 * 1024) {
        U.toast('File too large (max 24 MB)', 'error');
        return;
      }
      const dataUrl = await U.fileToDataUrl(file);
      window.State.setAsset(field.key, { name: file.name, size: file.size, dataUrl });
      input.value = '';
      render();
    });

    wrap.append(btn, info, clear, input);
    render();
    return wrap;
  }

  /* Editor for arbitrary theme_values entries in any module. */
  function customValuesControl(field) {
    const KINDS = ['color', 'dimen', 'bool', 'integer', 'string', 'drawable'];
    const wrap = U.el('div', { class: 'ctl-custom' });
    const list = U.el('div', { class: 'custom-list' });

    function entries() {
      return window.State.value(field.key) || [];
    }
    function save(next) {
      window.State.set(field.key, next);
      render();
    }

    function render() {
      list.innerHTML = '';
      const items = entries();
      if (!items.length) {
        list.appendChild(U.el('p', { class: 'field-hint', text: 'No custom entries yet. Anything you add here is written verbatim into the chosen module\'s theme_values.xml.' }));
      }
      items.forEach((item, i) => {
        const moduleSel = U.el('select', {}, field.modules.map(m => U.el('option', { value: m.value, text: m.value })));
        moduleSel.value = item.module;
        const kindSel = U.el('select', {}, KINDS.map(k => U.el('option', { value: k, text: k })));
        kindSel.value = item.kind;
        const nameIn = U.el('input', { type: 'text', placeholder: 'entry_name', value: item.name, spellcheck: 'false' });
        const valueIn = U.el('input', { type: 'text', placeholder: 'value', value: item.value, spellcheck: 'false' });
        const del = U.el('button', { class: 'btn ghost small', type: 'button', text: '✕', title: 'Delete entry' });

        const update = (patch) => {
          const next = entries().map((e, j) => j === i ? Object.assign({}, e, patch) : e);
          save(next);
        };
        moduleSel.addEventListener('change', () => update({ module: moduleSel.value }));
        kindSel.addEventListener('change', () => update({ kind: kindSel.value }));
        nameIn.addEventListener('change', () => {
          if (nameIn.value && !U.validXmlName(nameIn.value)) {
            U.toast('Entry names must be valid XML names (letters, digits, _ .)', 'error');
            return;
          }
          update({ name: nameIn.value });
        });
        valueIn.addEventListener('change', () => update({ value: valueIn.value }));
        del.addEventListener('click', () => save(entries().filter((_, j) => j !== i)));

        list.appendChild(U.el('div', { class: 'custom-row' }, [moduleSel, kindSel, nameIn, valueIn, del]));
      });
    }

    const add = U.el('button', { class: 'btn small', type: 'button', text: '+ Add entry' });
    add.addEventListener('click', () => {
      save(entries().concat([{ module: field.modules[0].value, kind: 'color', name: '', value: '#FF000000' }]));
    });

    wrap.append(list, add);
    render();
    return wrap;
  }

  /* ---------- panel renderer ---------- */

  window.Controls = {
    buildField(field) {
      switch (field.type) {
        case 'color': return fieldRow(field, colorControl(field), 'row');
        case 'text': return fieldRow(field, textControl(field, false));
        case 'textarea': return fieldRow(field, textControl(field, true));
        case 'slider': return fieldRow(field, sliderControl(field), 'row');
        case 'select': return fieldRow(field, selectControl(field), 'row');
        case 'toggle': return fieldRow(field, toggleControl(field), 'row');
        case 'image':
        case 'audio':
        case 'font':
        case 'file': return fieldRow(field, uploadControl(field));
        case 'custom-values': return fieldRow(field, customValuesControl(field));
        default: return fieldRow(field, U.el('span', { text: 'Unsupported field type: ' + field.type }));
      }
    },

    renderSection(section, container, filter) {
      container.innerHTML = '';
      const q = (filter || '').trim().toLowerCase();
      for (const field of section.fields) {
        if (q && !(field.label.toLowerCase().includes(q) || field.key.toLowerCase().includes(q))) continue;
        container.appendChild(this.buildField(field));
      }
      if (!container.children.length) {
        container.appendChild(U.el('p', { class: 'field-hint', text: 'No settings match your search in this section.' }));
      }
    }
  };
})();
