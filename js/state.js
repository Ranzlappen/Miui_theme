/* Central theme state.
 *
 * Shape:
 * {
 *   formatVersion: 1,
 *   platform: 'miui',
 *   values: { fieldKey: value, ... }      scalars per schema field
 *   assets: { fieldKey: {name, size, dataUrl}, ... }   uploaded files (image/audio/font/file)
 * }
 *
 * The whole project (including embedded assets) round-trips through JSON, which is
 * what "Save project" / "Import" exchange and what localStorage persists.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'ats.project.v1';
  const ASSET_TYPES = new Set(['image', 'audio', 'font', 'file']);
  const MAX_UNDO = 60;

  const listeners = [];
  let state = null;
  let undoStack = [];
  let redoStack = [];

  function platformDef() {
    return window.Platforms.get(state.platform);
  }

  function freshState(platformId) {
    const def = window.Platforms.get(platformId);
    const values = {};
    for (const f of window.Platforms.fields(def)) {
      if (ASSET_TYPES.has(f.type)) continue;
      values[f.key] = Array.isArray(f.default) ? f.default.slice() : f.default;
    }
    return { formatVersion: 1, platform: platformId, values, assets: {} };
  }

  function emit(meta) {
    for (const fn of listeners) fn(state, meta || {});
  }

  const persist = window.Util.debounce(function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* Quota exceeded (large embedded assets). The in-memory session still works;
         "Save project" always works because it streams to a file. */
      console.warn('Autosave skipped:', e.message);
    }
  }, 600);

  function snapshot() {
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  }

  window.State = {
    init() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.formatVersion === 1 && window.Platforms.get(parsed.platform)) {
            state = this.migrate(parsed);
            return;
          }
        }
      } catch (e) { /* corrupt storage — start fresh */ }
      state = freshState(window.Platforms.all()[0].id);
    },

    /* Fill in any fields added to the schema since the project was saved. */
    migrate(parsed) {
      const base = freshState(parsed.platform);
      base.values = Object.assign(base.values, parsed.values || {});
      base.assets = parsed.assets || {};
      return base;
    },

    get() { return state; },
    def() { return platformDef(); },

    value(key) { return state.values[key]; },
    asset(key) { return state.assets[key] || null; },

    set(key, value, opts) {
      if (state.values[key] === value) return;
      if (!opts || !opts.noSnapshot) snapshot();
      state.values[key] = value;
      persist();
      emit({ key });
    },

    setAsset(key, asset) {
      snapshot();
      if (asset) state.assets[key] = asset;
      else delete state.assets[key];
      persist();
      emit({ key, asset: true });
    },

    resetSection(sectionId) {
      const def = platformDef();
      const sec = def.sections.find(s => s.id === sectionId);
      if (!sec) return;
      snapshot();
      const fresh = freshState(state.platform);
      for (const f of sec.fields) {
        if (ASSET_TYPES.has(f.type)) delete state.assets[f.key];
        else state.values[f.key] = fresh.values[f.key];
      }
      persist();
      emit({ section: sectionId });
    },

    switchPlatform(platformId) {
      if (!window.Platforms.get(platformId) || platformId === state.platform) return;
      snapshot();
      state = freshState(platformId);
      persist();
      emit({ platform: true });
    },

    replace(next) {
      snapshot();
      state = this.migrate(next);
      persist();
      emit({ replaced: true });
    },

    undo() {
      if (!undoStack.length) return false;
      redoStack.push(JSON.stringify(state));
      state = JSON.parse(undoStack.pop());
      persist();
      emit({ replaced: true });
      return true;
    },

    redo() {
      if (!redoStack.length) return false;
      undoStack.push(JSON.stringify(state));
      state = JSON.parse(redoStack.pop());
      persist();
      emit({ replaced: true });
      return true;
    },

    exportProject() {
      const name = window.Util.slug(state.values.title || 'theme');
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      window.Util.downloadBlob(blob, name + '.atstudio.json');
    },

    importProject(json) {
      const parsed = JSON.parse(json);
      if (!parsed || parsed.formatVersion !== 1 || !window.Platforms.get(parsed.platform)) {
        throw new Error('Not a valid Android Theme Studio project file.');
      }
      this.replace(parsed);
    },

    subscribe(fn) { listeners.push(fn); }
  };
})();
