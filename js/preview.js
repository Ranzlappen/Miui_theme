/* Live phone preview.
 *
 * Screens are built once; on every state change apply() pushes the theme into the
 * phone via CSS custom properties (declared per-field in the platform schema as
 * `cssVar`) plus a handful of structural updates (wallpapers, clock format,
 * visibility toggles, icon shapes, uploaded fonts).
 */
(function () {
  'use strict';

  const U = window.Util;
  const $ = (sel) => document.querySelector(sel);

  const DEMO_APPS = [
    ['📞', 'Phone'], ['💬', 'Messages'], ['🌐', 'Browser'], ['📷', 'Camera'],
    ['🎵', 'Music'], ['🖼️', 'Gallery'], ['📧', 'Mail'], ['🗺️', 'Maps'],
    ['🕐', 'Clock'], ['🛒', 'Store'], ['📁', 'Files'], ['⚙️', 'Settings']
  ];
  const DOCK_APPS = [['📞', 'Phone'], ['💬', 'Messages'], ['🌐', 'Browser'], ['📷', 'Camera']];
  const APP_TINTS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4',
    '#8BC34A', '#3F51B5', '#E91E63', '#795548', '#607D8B', '#FFC107'];

  let fontRegular = null;
  let fontBold = null;
  let activeScreen = 'home';

  /* ---------- screen builders ---------- */

  function appIcon(glyph, label, tintIndex, opts) {
    const icon = U.el('div', { class: 'app' }, [
      U.el('div', { class: 'app-icon', style: `--tint:${APP_TINTS[tintIndex % APP_TINTS.length]}` },
        U.el('span', { class: 'app-glyph', text: glyph })),
      U.el('span', { class: 'app-label', text: label })
    ]);
    if (opts && opts.noLabel) icon.querySelector('.app-label').remove();
    return icon;
  }

  function buildHome() {
    const s = U.el('div', { class: 'screen', id: 'screen-home' });
    s.appendChild(U.el('div', { class: 'widget-clock' }, [
      U.el('div', { class: 'widget-time', text: '10:24' }),
      U.el('div', { class: 'widget-date', text: 'Fri, July 3' })
    ]));
    const grid = U.el('div', { class: 'app-grid' });
    DEMO_APPS.forEach(([g, l], i) => grid.appendChild(appIcon(g, l, i)));
    s.appendChild(grid);
    s.appendChild(U.el('div', { class: 'page-dots' }, [
      U.el('span', { class: 'dot on' }), U.el('span', { class: 'dot' })
    ]));
    s.appendChild(U.el('div', { class: 'search-bar' }, [
      U.el('span', { class: 'search-ic', text: '🔍' }),
      U.el('span', { class: 'search-txt', text: 'Search' })
    ]));
    const dock = U.el('div', { class: 'dock' });
    DOCK_APPS.forEach(([g, l], i) => dock.appendChild(appIcon(g, l, i, { noLabel: true })));
    s.appendChild(dock);
    return s;
  }

  function buildLock() {
    const s = U.el('div', { class: 'screen', id: 'screen-lock' });
    s.appendChild(U.el('div', { class: 'ls-dim' }));
    s.appendChild(U.el('div', { class: 'ls-content' }, [
      U.el('div', { class: 'ls-clock', id: 'ls-clock' }),
      U.el('div', { class: 'ls-date', id: 'ls-date', text: 'Friday, July 3' }),
      U.el('div', { class: 'ls-owner', id: 'ls-owner' }),
      U.el('div', { class: 'ls-spacer' }),
      U.el('div', { class: 'ls-hint', id: 'ls-hint' }),
      U.el('div', { class: 'ls-shortcuts', id: 'ls-shortcuts' }, [
        U.el('span', { class: 'ls-shortcut', text: '🔦' }),
        U.el('span', { class: 'ls-shortcut', text: '📷' })
      ])
    ]));
    return s;
  }

  function buildShade() {
    const s = U.el('div', { class: 'screen', id: 'screen-shade' });
    const panel = U.el('div', { class: 'shade' });
    panel.appendChild(U.el('div', { class: 'shade-head' }, [
      U.el('span', { class: 'shade-time', text: '10:24 · Fri, Jul 3' }),
      U.el('span', { class: 'shade-gear', text: '⚙️' })
    ]));
    const tiles = U.el('div', { class: 'qs-grid' });
    [['📶', 'Wi‑Fi', true], ['📡', 'Data', true], ['🔵', 'Bluetooth', false], ['🔦', 'Torch', false],
     ['✈️', 'Airplane', false], ['🔄', 'Rotate', true], ['🌙', 'DND', false], ['📍', 'Location', true]]
      .forEach(([g, l, on]) => {
        tiles.appendChild(U.el('div', { class: 'qs-tile' + (on ? ' on' : '') }, [
          U.el('span', { class: 'qs-ic', text: g }),
          U.el('span', { class: 'qs-lbl', text: l })
        ]));
      });
    panel.appendChild(tiles);
    panel.appendChild(U.el('div', { class: 'brightness' }, [
      U.el('span', { text: '🔆' }),
      U.el('div', { class: 'bright-track' }, U.el('div', { class: 'bright-fill' }))
    ]));
    [['💬 Messages', 'Alex', 'See you at 6 tonight?'],
     ['📧 Mail', 'Design weekly', 'Your theme was featured — take a look'],
     ['🎵 Music', 'Now playing', 'Midnight City — M83']]
      .forEach(([app, title, text]) => {
        panel.appendChild(U.el('div', { class: 'notif' }, [
          U.el('div', { class: 'notif-app', text: app }),
          U.el('div', { class: 'notif-title', text: title }),
          U.el('div', { class: 'notif-text', text: text })
        ]));
      });
    s.appendChild(panel);
    return s;
  }

  function buildSettings() {
    const s = U.el('div', { class: 'screen', id: 'screen-settings' });
    const page = U.el('div', { class: 'set-page' });
    page.appendChild(U.el('div', { class: 'set-title-big', text: 'Settings' }));
    const groups = [
      [['📶', 'Wi‑Fi', 'HomeNetwork_5G', 'chev'], ['🔵', 'Bluetooth', 'On · 2 devices', 'chev']],
      [['🖼️', 'Wallpaper', 'Themes, icons, fonts', 'chev'], ['🔔', 'Notifications', 'All apps allowed', 'switch-on'], ['🌙', 'Dark mode', 'Scheduled', 'switch-off']],
      [['🔋', 'Battery', '82% — about 1 day left', 'chev'], ['🛡️', 'Privacy', 'Permission manager', 'chev']]
    ];
    for (const g of groups) {
      const card = U.el('div', { class: 'set-card' });
      g.forEach(([ic, title, sum, trail], i) => {
        const row = U.el('div', { class: 'set-row' }, [
          U.el('span', { class: 'set-ic' }, U.el('span', { text: ic })),
          U.el('div', { class: 'set-texts' }, [
            U.el('div', { class: 'set-row-title', text: title }),
            U.el('div', { class: 'set-row-sum', text: sum })
          ]),
          trail === 'chev'
            ? U.el('span', { class: 'set-chev', text: '›' })
            : U.el('span', { class: 'mini-switch ' + (trail === 'switch-on' ? 'on' : '') }, U.el('span', { class: 'mini-thumb' }))
        ]);
        card.appendChild(row);
        if (i < g.length - 1) card.appendChild(U.el('div', { class: 'set-div' }));
      });
      page.appendChild(card);
    }
    s.appendChild(page);
    return s;
  }

  function buildControls() {
    const s = U.el('div', { class: 'screen', id: 'screen-controls' });
    const page = U.el('div', { class: 'ctl-page' });
    page.appendChild(U.el('div', { class: 'ctl-appbar', text: 'Sample app' }));

    const body = U.el('div', { class: 'ctl-body' });
    body.appendChild(U.el('button', { class: 'demo-btn primary', text: 'Primary button', type: 'button' }));
    body.appendChild(U.el('button', { class: 'demo-btn secondary', text: 'Secondary button', type: 'button' }));

    const switches = U.el('div', { class: 'demo-rows' });
    [['Enable feature', true], ['Sync in background', false]].forEach(([label, on]) => {
      switches.appendChild(U.el('div', { class: 'demo-row' }, [
        U.el('span', { class: 'demo-row-label', text: label }),
        U.el('span', { class: 'mini-switch big ' + (on ? 'on' : '') }, U.el('span', { class: 'mini-thumb' }))
      ]));
    });
    switches.appendChild(U.el('div', { class: 'demo-row' }, [
      U.el('span', { class: 'demo-row-label', text: 'Accept terms' }),
      U.el('span', { class: 'demo-check', text: '✓' })
    ]));
    body.appendChild(switches);

    body.appendChild(U.el('div', { class: 'demo-seek' }, U.el('div', { class: 'demo-seek-fill' })));

    const dlg = U.el('div', { class: 'demo-dialog' }, [
      U.el('div', { class: 'dlg-title', text: 'Delete item?' }),
      U.el('div', { class: 'dlg-text', text: 'This action cannot be undone. The item will be removed from all synced devices.' }),
      U.el('div', { class: 'dlg-actions' }, [
        U.el('span', { class: 'dlg-neg', text: 'Cancel' }),
        U.el('span', { class: 'dlg-pos', text: 'Delete' })
      ])
    ]);
    body.appendChild(dlg);
    page.appendChild(body);
    s.appendChild(page);
    return s;
  }

  /* ---------- theme application ---------- */

  function cssValueFor(field, value) {
    switch (field.type) {
      case 'color': return U.toCss(value);
      case 'slider': {
        const v = Number(value) * (field.cssScale || 1);
        return field.cssUnit ? v + field.cssUnit : String(v);
      }
      case 'toggle': return value ? (field.cssOn ?? '1') : (field.cssOff ?? '0');
      default: return String(value);
    }
  }

  function iconStyle(state) {
    const v = state.values;
    const shape = v.iconShape;
    let radius = '22%', clip = 'none';
    if (shape === 'circle') radius = '50%';
    else if (shape === 'squircle') radius = '38%';
    else if (shape === 'rounded') radius = v.iconRadius + '%';
    else if (shape === 'teardrop') radius = '50% 50% 50% 16%';
    else if (shape === 'original') radius = '22%';
    if (shape === 'hexagon') {
      radius = '0';
      clip = 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)';
    }
    let bg = 'var(--tint)';
    if (v.iconBgEnable) {
      bg = v.iconBgGradient
        ? `linear-gradient(${v.iconBgAngle}deg, ${U.toCss(v.iconBg)}, ${U.toCss(v.iconBg2)})`
        : U.toCss(v.iconBg);
    }
    return { radius, clip, bg };
  }

  async function applyFonts(state) {
    const phone = $('#phone');
    const reg = state.assets.fontRegular;
    const bold = state.assets.fontBold;
    try {
      if (reg && (!fontRegular || fontRegular._src !== reg.dataUrl)) {
        if (fontRegular) document.fonts.delete(fontRegular);
        fontRegular = new FontFace('ThemeFontRegular', `url(${reg.dataUrl})`);
        fontRegular._src = reg.dataUrl;
        await fontRegular.load();
        document.fonts.add(fontRegular);
      }
      if (!reg && fontRegular) { document.fonts.delete(fontRegular); fontRegular = null; }
      if (bold && (!fontBold || fontBold._src !== bold.dataUrl)) {
        if (fontBold) document.fonts.delete(fontBold);
        fontBold = new FontFace('ThemeFontRegular', `url(${bold.dataUrl})`, { weight: 'bold' });
        fontBold._src = bold.dataUrl;
        await fontBold.load();
        document.fonts.add(fontBold);
      }
      if (!bold && fontBold) { document.fonts.delete(fontBold); fontBold = null; }
    } catch (e) {
      U.toast('Could not load font: ' + e.message, 'error');
    }
    phone.style.setProperty('--font-family',
      (fontRegular ? "'ThemeFontRegular', " : '') + (state.values.fontFallback || 'system-ui'));
  }

  function wallpaperCss(state, assetKey) {
    const asset = state.assets[assetKey];
    if (asset) return `url("${asset.dataUrl}") center / cover no-repeat`;
    return `linear-gradient(var(--wp-angle), ${U.toCss(state.values.wpGradientA)}, ${U.toCss(state.values.wpGradientB)})`;
  }

  function apply(state) {
    const def = window.State.def();
    const phone = $('#phone');

    for (const field of window.Platforms.fields(def)) {
      if (!field.cssVar) continue;
      const value = state.values[field.key];
      if (value === undefined || value === null) continue;
      phone.style.setProperty(field.cssVar, cssValueFor(field, value));
    }

    /* wallpapers */
    $('#screen-home').style.background = wallpaperCss(state, 'homeWallpaper');
    $('#screen-lock').style.background = wallpaperCss(state, 'lockWallpaper');

    /* status bar */
    $('#sb-clock').style.display = state.values.sbClockShow ? '' : 'none';
    const batt = state.values.sbBatteryStyle;
    $('#sb-batt').dataset.style = batt;

    /* lock screen */
    const lsClock = $('#ls-clock');
    const fmt = state.values.lsClockFormat;
    lsClock.className = 'ls-clock fmt-' + fmt;
    lsClock.innerHTML = fmt === 'stacked' ? '10<br>24' : '10:24';
    $('#ls-date').style.display = state.values.lsDateShow ? '' : 'none';
    const owner = $('#ls-owner');
    owner.textContent = state.values.lsOwnerText || '';
    owner.style.display = state.values.lsOwnerText ? '' : 'none';
    $('#ls-hint').textContent = state.values.lsHintText || '';
    $('#ls-shortcuts').style.display = state.values.lsShortcuts ? '' : 'none';

    /* home screen */
    $('#screen-home').classList.toggle('no-labels', !state.values.homeLabelShow);
    $('#screen-home').classList.toggle('no-dock-bg', !state.values.dockShow);
    $('.search-bar').style.display = state.values.searchBarShow ? '' : 'none';
    $('.widget-clock').style.display = state.values.widgetClockShow ? '' : 'none';

    /* icons */
    const ic = iconStyle(state);
    phone.style.setProperty('--icon-radius', ic.radius);
    phone.style.setProperty('--icon-clip', ic.clip);
    phone.style.setProperty('--icon-bg', ic.bg);
    phone.style.setProperty('--icon-scale', state.values.iconScale / 100);
    phone.style.setProperty('--icon-border',
      state.values.iconBorder ? `inset 0 0 0 ${state.values.iconBorderWidth * 0.5}px ${U.toCss(state.values.iconBorderColor)}` : 'none');
    phone.classList.toggle('icons-gloss', !!state.values.iconGloss);

    /* settings app dividers */
    $('#screen-settings').classList.toggle('with-dividers', !!state.values.setDividers);

    applyFonts(state);
  }

  /* ---------- tabs & clock ---------- */

  function selectScreen(id) {
    activeScreen = id;
    document.querySelectorAll('#screens .screen').forEach(el => {
      el.classList.toggle('active', el.id === 'screen-' + id);
    });
    document.querySelectorAll('#preview-tabs button').forEach(b => {
      b.classList.toggle('active', b.dataset.screen === id);
      b.setAttribute('aria-selected', b.dataset.screen === id ? 'true' : 'false');
    });
    /* the status bar sits over the lock/home wallpaper; over app screens it gets a hint of contrast */
    $('#phone').classList.toggle('on-app-screen', id === 'settings' || id === 'controls');
  }

  function tickClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const clock = $('#sb-clock');
    if (clock) clock.textContent = `${hh}:${mm}`;
  }

  window.Preview = {
    init() {
      const screens = $('#screens');
      screens.append(buildHome(), buildLock(), buildShade(), buildSettings(), buildControls());

      const tabs = $('#preview-tabs');
      for (const sc of window.State.def().previewScreens) {
        const b = U.el('button', { text: sc.label, 'data-screen': sc.id, role: 'tab' });
        b.addEventListener('click', () => selectScreen(sc.id));
        tabs.appendChild(b);
      }
      selectScreen('home');
      tickClock();
      setInterval(tickClock, 30000);
      apply(window.State.get());
    },

    rebuild() {
      $('#screens').innerHTML = '';
      $('#preview-tabs').innerHTML = '';
      this.init();
    },

    apply
  };
})();
