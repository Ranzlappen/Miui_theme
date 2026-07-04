/* App bootstrap: navigation, top bar actions, search, keyboard shortcuts. */
(function () {
  'use strict';

  const U = window.Util;
  const $ = (sel) => document.querySelector(sel);

  let activeSection = null;
  let searchQuery = '';

  /* ---------- section navigation ---------- */

  function buildNav() {
    const nav = $('#section-nav');
    nav.innerHTML = '';
    for (const sec of window.State.def().sections) {
      const btn = U.el('button', { class: 'nav-item', 'data-section': sec.id }, [
        U.el('span', { class: 'nav-icon', text: sec.icon }),
        U.el('span', { class: 'nav-label', text: sec.title })
      ]);
      btn.addEventListener('click', () => {
        searchQuery = '';
        $('#field-search').value = '';
        selectSection(sec.id);
      });
      nav.appendChild(btn);
    }
  }

  function selectSection(id) {
    const def = window.State.def();
    activeSection = def.sections.find(s => s.id === id) || def.sections[0];
    document.querySelectorAll('.nav-item').forEach(b =>
      b.classList.toggle('active', b.dataset.section === activeSection.id));
    renderPanel();
  }

  function renderPanel() {
    const fields = $('#panel-fields');
    if (searchQuery.trim()) {
      $('#panel-title').textContent = 'Search results';
      $('#panel-desc').textContent = `Settings matching “${searchQuery.trim()}” across all sections.`;
      $('#panel-reset').hidden = true;
      fields.innerHTML = '';
      const q = searchQuery.trim().toLowerCase();
      let count = 0;
      for (const sec of window.State.def().sections) {
        const matches = sec.fields.filter(f =>
          f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) ||
          (f.hint || '').toLowerCase().includes(q));
        if (!matches.length) continue;
        fields.appendChild(U.el('h3', { class: 'search-group', text: sec.icon + ' ' + sec.title }));
        for (const f of matches) {
          fields.appendChild(window.Controls.buildField(f));
          count++;
        }
      }
      if (!count) fields.appendChild(U.el('p', { class: 'field-hint', text: 'Nothing matches. Try “clock”, “accent”, “radius”, “wallpaper”…' }));
    } else {
      $('#panel-title').textContent = activeSection.icon + ' ' + activeSection.title;
      $('#panel-desc').textContent = activeSection.description || '';
      $('#panel-reset').hidden = false;
      window.Controls.renderSection(activeSection, fields);
    }
  }

  /* ---------- modal ---------- */

  function showFilesModal() {
    const files = window.State.def().describeFiles(window.State.get());
    const body = $('#modal-body');
    body.innerHTML = '';
    for (const f of files) {
      body.appendChild(U.el('h4', { class: 'modal-file-path', text: f.path }));
      body.appendChild(U.el('pre', { class: 'modal-file-content', text: f.content }));
    }
    $('#modal-backdrop').hidden = false;
  }

  /* ---------- export ---------- */

  async function exportPackage() {
    const btn = $('#btn-export');
    const def = window.State.def();
    btn.disabled = true;
    btn.textContent = 'Building…';
    try {
      const blob = await def.buildPackage(window.State.get());
      const name = U.slug(window.State.value('title')) + '.' + def.packageExt;
      U.downloadBlob(blob, name);
      U.toast(`Exported ${name} (${U.humanSize(blob.size)}). Import it with the MIUI Themes app.`, 'success');
    } catch (e) {
      console.error(e);
      U.toast('Export failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '⬇ Export .' + def.packageExt;
    }
  }

  /* ---------- platform switching ---------- */

  function buildPlatformSelect() {
    const sel = $('#platform-select');
    sel.innerHTML = '';
    for (const p of window.Platforms.all()) {
      sel.appendChild(U.el('option', { value: p.id, text: p.name }));
    }
    sel.value = window.State.get().platform;
    sel.addEventListener('change', () => {
      if (!confirm('Switching platform starts a new project for that platform. Continue?')) {
        sel.value = window.State.get().platform;
        return;
      }
      window.State.switchPlatform(sel.value);
    });
    /* With a single registered platform the selector is informational */
    sel.disabled = window.Platforms.all().length < 2;
    if (sel.disabled) sel.title = 'More platforms (One UI, ColorOS…) can be added under js/platforms/';
  }

  function fullRefresh() {
    $('#platform-name').textContent = window.State.def().name + ' Theme Designer';
    $('#btn-export').textContent = '⬇ Export .' + window.State.def().packageExt;
    buildNav();
    selectSection(activeSection ? activeSection.id : window.State.def().sections[0].id);
    window.Preview.rebuild();
  }

  /* ---------- boot ---------- */

  function init() {
    window.State.init();
    buildPlatformSelect();
    buildNav();
    selectSection(window.State.def().sections[0].id);
    window.Preview.init();

    window.State.subscribe((state, meta) => {
      window.Preview.apply(state);
      /* Structural changes need the panel re-rendered so controls show current values */
      if (meta.replaced || meta.platform || meta.section) {
        if (meta.platform) fullRefresh();
        else renderPanel();
      }
    });

    /* top bar */
    $('#btn-export').addEventListener('click', exportPackage);
    $('#btn-save').addEventListener('click', () => {
      window.State.exportProject();
      U.toast('Project saved as JSON — import it later to continue editing.', 'success');
    });
    $('#btn-import').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        window.State.importProject(await file.text());
        U.toast('Project imported.', 'success');
      } catch (err) {
        U.toast(err.message, 'error');
      }
      e.target.value = '';
    });
    $('#btn-undo').addEventListener('click', () => window.State.undo() || U.toast('Nothing to undo'));
    $('#btn-redo').addEventListener('click', () => window.State.redo() || U.toast('Nothing to redo'));
    $('#btn-xml').addEventListener('click', showFilesModal);
    $('#modal-close').addEventListener('click', () => { $('#modal-backdrop').hidden = true; });
    $('#modal-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.hidden = true;
    });
    $('#panel-reset').addEventListener('click', () => {
      if (confirm(`Reset “${activeSection.title}” to defaults?`)) {
        window.State.resetSection(activeSection.id);
        U.toast('Section reset.');
      }
    });

    /* search */
    $('#field-search').addEventListener('input', U.debounce((e) => {
      searchQuery = e.target.value;
      renderPanel();
    }, 150));

    /* keyboard shortcuts */
    document.addEventListener('keydown', (e) => {
      const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !inField) {
        e.preventDefault(); window.State.undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z')) && !inField) {
        e.preventDefault(); window.State.redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault(); window.State.exportProject();
      } else if (e.key === 'Escape') {
        $('#modal-backdrop').hidden = true;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
