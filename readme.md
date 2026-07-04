# 🎨 Android Theme Studio — MIUI Theme Designer

A fully customizable, browser-based **MIUI / HyperOS theme designer** with a live phone
preview and one-click export to an installable **`.mtz`** package. 100% static
JavaScript — no build step, no server, no dependencies to install — designed to be
hosted on **GitHub Pages** (or opened straight from disk).

## ✨ Features

- **Every aspect customizable**, organized into 15 sections:
  theme info · wallpapers · system colors · status bar · notification shade ·
  lock screen · home screen · app icons · fonts · buttons & controls ·
  dialogs & menus · Settings app · sounds · boot animation · advanced custom values
- **Live phone preview** with five switchable screens (Home, Lock, Notifications,
  Settings, Controls) that update instantly as you tweak values
- **Full color control** — ARGB colors with per-color opacity, hex entry (`#AARRGGBB`)
- **Icon designer** — mask shape (circle / squircle / rounded / teardrop / hexagon),
  scale, background plate, gradients, border ring, gloss overlay; exported as
  real mask/border/pattern PNGs rendered in-browser
- **Uploads** — wallpapers, fonts (`.ttf`, previewed live), ringtone / notification /
  alarm sounds, `bootanimation.zip`
- **Generated wallpapers** — if you don't upload one, a configurable gradient
  wallpaper is rendered and packaged for you
- **Advanced escape hatch** — write *any* entry (`color`, `dimen`, `bool`, `integer`,
  `string`, `drawable`) into *any* module's `theme_values.xml`, so keys specific to
  your MIUI version are never out of reach
- **`View files`** — inspect every XML file the exporter will generate before exporting
- **Projects** — autosaved to your browser, plus save/import as a portable `.json`
  file (assets embedded)
- **Undo / redo** (`Ctrl+Z` / `Ctrl+Shift+Z`), global settings search, section resets

## 🚀 Run it

### On GitHub Pages
1. Repository **Settings → Pages**
2. Source: **Deploy from a branch**, select your branch and `/ (root)`, save
3. Open `https://<user>.github.io/<repo>/`

### Locally
Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## 📦 What the export contains

`.mtz` is a zip archive. The designer produces:

```
mytheme.mtz
├── description.xml                  theme metadata (title, designer, version…)
├── wallpaper/
│   ├── default_wallpaper.jpg        uploaded image or generated gradient
│   └── default_lock_wallpaper.jpg
├── preview/                         store preview images (generated)
├── fonts/Roboto-Regular.ttf         your uploaded font (MIUI applies it system-wide)
├── ringtones/…                      ringtone / notification / alarm
├── boots/bootanimation.zip
├── framework-res                    nested zip → theme_values.xml (system palette,
├── com.android.systemui               controls, dialogs, status bar, shade…)
├── com.miui.home                    nested zip → theme_values.xml (launcher)
├── com.android.settings             nested zip → theme_values.xml
└── icons                            nested zip → transform_config.xml + mask PNGs
```

Install it on-device via **Themes app → Profile → Import** (or copy the file to
`MIUI/theme/` and apply).

> **Note:** MIUI's recognized `theme_values` key names vary between MIUI versions
> and regions, and newer MIUI/HyperOS builds restrict third-party themes on some
> ROMs. The **Advanced** section lets you add or override any key for your exact
> ROM. The generated package structure follows the classic `.mtz` layout.

## 🧩 Architecture — adding other manufacturers

Everything is driven by a *platform definition* (`js/platforms/miui.js`): the settings
panels, the live preview bindings, and the exporter are all generated from one schema.
To add another manufacturer (Samsung One UI, ColorOS, OxygenOS…):

1. Create `js/platforms/oneui.js` that calls `Platforms.register({...})` with its own
   sections/fields and a `buildPackage()` implementation for that vendor's format.
2. Add a `<script>` tag for it in `index.html`.

The platform selector in the top bar picks it up automatically — no other changes needed.

```
index.html
css/app.css              designer UI + preview styling (CSS-variable driven)
js/util.js               color math, XML, file helpers
js/platforms/registry.js platform abstraction
js/platforms/miui.js     the MIUI schema + export mapping  ← add new vendors beside this
js/state.js              state store, autosave, undo/redo, project files
js/controls.js           schema → settings panel renderer
js/preview.js            schema → live phone preview
js/export/mtz.js         .mtz packaging (JSZip), XML + canvas asset generation
js/vendor/jszip.min.js   JSZip 3.10.1 (MIT)
```

## 📄 License

MIT. JSZip is bundled under its MIT license.
