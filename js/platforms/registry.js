/* Platform registry.
 *
 * A "platform" describes one Android manufacturer skin (MIUI, One UI, ColorOS, …).
 * Everything in the app — the settings panels, the live preview bindings and the
 * exporter — is driven by the platform definition, so adding a new manufacturer
 * means adding one file that calls Platforms.register() and nothing else.
 *
 * Platform definition shape:
 * {
 *   id:          'miui',
 *   name:        'MIUI / HyperOS',
 *   packageExt:  'mtz',
 *   sections: [{
 *     id, title, icon, description,
 *     fields: [{
 *       key         unique within the platform
 *       label
 *       type        'color' | 'text' | 'textarea' | 'number' | 'slider' |
 *                   'select' | 'toggle' | 'image' | 'audio' | 'font' | 'file' | 'custom-values'
 *       default
 *       hint        optional help text
 *       target      optional { module, name, kind } — where the value lands in the
 *                   exported package ('kind' defaults to sensible per type)
 *       cssVar      optional CSS custom property applied to the preview phone
 *       min/max/step/unit    for slider / number
 *       options     [{value,label}] for select
 *       accept      MIME filter for uploads
 *     }]
 *   }],
 *   previewScreens: [{id,label}],
 *   buildPackage(state, helpers) -> Promise<Blob>   the exporter
 *   describeFiles(state) -> [{path, content}]        text preview of generated files
 * }
 */
(function () {
  'use strict';

  const defs = new Map();

  window.Platforms = {
    register(def) {
      defs.set(def.id, def);
    },
    get(id) {
      return defs.get(id);
    },
    all() {
      return [...defs.values()];
    },
    /* Flat field list with section back-references — used by search and state init. */
    fields(def) {
      const out = [];
      for (const sec of def.sections) {
        for (const f of sec.fields) out.push(Object.assign({ section: sec }, f));
      }
      return out;
    }
  };
})();
