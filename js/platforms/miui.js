/* MIUI / HyperOS platform definition.
 *
 * Declares every customizable aspect of a MIUI theme (sections + fields), how each
 * field maps onto the exported .mtz package, and how it binds to the live preview.
 *
 * .mtz layout produced by buildPackage():
 *   description.xml                     theme metadata
 *   wallpaper/default_wallpaper.jpg     home wallpaper
 *   wallpaper/default_lock_wallpaper.jpg
 *   preview/preview_launcher_0.jpg      store/preview images (generated)
 *   preview/preview_lockscreen_0.jpg
 *   fonts/Roboto-Regular.ttf            system font replacement
 *   fonts/Roboto-Bold.ttf
 *   ringtones/ringtone.mp3|ogg …        sounds
 *   boots/bootanimation.zip             boot animation
 *   framework-res                       nested zip → theme_values.xml
 *   com.android.systemui                nested zip → theme_values.xml
 *   com.miui.home                       nested zip → theme_values.xml
 *   com.android.settings                nested zip → theme_values.xml
 *   icons                               nested zip → transform_config.xml + mask/border/pattern PNGs
 *
 * NOTE: theme_values key names vary slightly across MIUI versions. Every key this
 * designer emits can be overridden or extended via the "Advanced" section, which
 * writes arbitrary entries into any module.
 */
(function () {
  'use strict';

  const MODULES = [
    { value: 'framework-res', label: 'framework-res (system-wide)' },
    { value: 'com.android.systemui', label: 'com.android.systemui (status bar / shade)' },
    { value: 'com.miui.home', label: 'com.miui.home (launcher)' },
    { value: 'com.android.settings', label: 'com.android.settings' },
    { value: 'com.android.mms', label: 'com.android.mms (messaging)' },
    { value: 'com.android.contacts', label: 'com.android.contacts (dialer/contacts)' }
  ];

  const c = (key, label, def, module, name, cssVar, hint) => ({
    key, label, type: 'color', default: def, cssVar,
    target: module ? { module, name, kind: 'color' } : null, hint
  });

  const sections = [

    /* ------------------------------------------------ 1. Theme info */
    {
      id: 'info', title: 'Theme info', icon: 'ℹ️',
      description: 'Metadata written to description.xml — shown in the MIUI theme store and theme manager.',
      fields: [
        { key: 'title', label: 'Theme title', type: 'text', default: 'My Theme' },
        { key: 'designer', label: 'Designer', type: 'text', default: '' },
        { key: 'author', label: 'Author', type: 'text', default: '' },
        { key: 'version', label: 'Version', type: 'text', default: '1.0' },
        {
          key: 'uiVersion', label: 'Target MIUI version', type: 'select', default: '13',
          options: [
            { value: '10', label: 'MIUI 10' }, { value: '11', label: 'MIUI 11' },
            { value: '12', label: 'MIUI 12' }, { value: '12.5', label: 'MIUI 12.5' },
            { value: '13', label: 'MIUI 13' }, { value: '14', label: 'MIUI 14' },
            { value: '15', label: 'HyperOS' }
          ]
        },
        { key: 'description', label: 'Description', type: 'textarea', default: 'Created with Android Theme Studio.' }
      ]
    },

    /* ------------------------------------------------ 2. Wallpapers */
    {
      id: 'wallpaper', title: 'Wallpapers', icon: '🖼️',
      description: 'Home and lock screen wallpapers. Recommended size 1080×2400 or larger. If no image is set, a wallpaper is generated from the gradient below.',
      fields: [
        { key: 'homeWallpaper', label: 'Home wallpaper', type: 'image', default: null, accept: 'image/*' },
        { key: 'lockWallpaper', label: 'Lock screen wallpaper', type: 'image', default: null, accept: 'image/*' },
        c('wpGradientA', 'Generated wallpaper — top color', '#FF0F2027', null, null, '--wp-a'),
        c('wpGradientB', 'Generated wallpaper — bottom color', '#FF2C5364', null, null, '--wp-b'),
        { key: 'wpGradientAngle', label: 'Gradient angle', type: 'slider', default: 160, min: 0, max: 360, step: 5, unit: '°', cssVar: '--wp-angle', cssUnit: 'deg' }
      ]
    },

    /* ------------------------------------------------ 3. System palette */
    {
      id: 'palette', title: 'System colors', icon: '🎨',
      description: 'Core palette applied system-wide through framework-res.',
      fields: [
        c('accentColor', 'Accent color', '#FF3482FF', 'framework-res', 'miui_accent_color', '--accent', 'Primary highlight used by switches, buttons, links and selection.'),
        c('accentSecondary', 'Secondary accent', '#FF00C9A7', 'framework-res', 'miui_accent_color_secondary', '--accent-2'),
        c('windowBg', 'Window background', '#FFF7F7F7', 'framework-res', 'miui_window_bg_color', '--window-bg'),
        c('cardBg', 'Card / surface background', '#FFFFFFFF', 'framework-res', 'miui_card_bg_color', '--card-bg'),
        c('textPrimary', 'Primary text', '#E6000000', 'framework-res', 'miui_text_color_primary', '--text-1'),
        c('textSecondary', 'Secondary text', '#8A000000', 'framework-res', 'miui_text_color_secondary', '--text-2'),
        c('textHint', 'Hint / disabled text', '#42000000', 'framework-res', 'miui_text_color_hint', '--text-3'),
        c('dividerColor', 'Divider lines', '#1F000000', 'framework-res', 'miui_divider_color', '--divider'),
        c('errorColor', 'Error / destructive', '#FFF4433C', 'framework-res', 'miui_error_color', '--error'),
        c('successColor', 'Success', '#FF36B37E', 'framework-res', 'miui_success_color', '--success'),
        c('warningColor', 'Warning', '#FFFFAB00', 'framework-res', 'miui_warning_color', '--warning')
      ]
    },

    /* ------------------------------------------------ 4. Status bar */
    {
      id: 'statusbar', title: 'Status bar', icon: '📶',
      description: 'The strip along the top: clock, signal, battery.',
      fields: [
        c('sbBg', 'Background', '#00000000', 'com.android.systemui', 'status_bar_bg_color', '--sb-bg', 'Fully transparent by default so the wallpaper shows through.'),
        c('sbIconColor', 'Icon color', '#FFFFFFFF', 'com.android.systemui', 'status_bar_icon_color', '--sb-icon'),
        c('sbClockColor', 'Clock color', '#FFFFFFFF', 'com.android.systemui', 'status_bar_clock_color', '--sb-clock'),
        { key: 'sbClockShow', label: 'Show clock', type: 'toggle', default: true, target: { module: 'com.android.systemui', name: 'status_bar_show_clock', kind: 'bool' } },
        { key: 'sbClockSize', label: 'Clock size', type: 'slider', default: 13, min: 10, max: 17, step: 1, unit: 'dp', cssVar: '--sb-clock-size', cssUnit: 'px', target: { module: 'com.android.systemui', name: 'status_bar_clock_size', kind: 'dimen' } },
        {
          key: 'sbBatteryStyle', label: 'Battery style', type: 'select', default: 'icon',
          options: [
            { value: 'icon', label: 'Icon only' }, { value: 'percent', label: 'Percentage only' },
            { value: 'both', label: 'Icon + percentage' }
          ],
          target: { module: 'com.android.systemui', name: 'status_bar_battery_style', kind: 'string' }
        },
        c('sbBatteryColor', 'Battery color', '#FFFFFFFF', 'com.android.systemui', 'status_bar_battery_color', '--sb-batt')
      ]
    },

    /* ------------------------------------------------ 5. Notification shade */
    {
      id: 'notifications', title: 'Notification shade', icon: '🔔',
      description: 'Quick settings tiles, brightness slider and notification cards.',
      fields: [
        c('shadeBg', 'Shade background', '#B3000000', 'com.android.systemui', 'notification_panel_bg_color', '--shade-bg'),
        { key: 'shadeBlur', label: 'Background blur', type: 'slider', default: 18, min: 0, max: 40, step: 2, unit: 'px', cssVar: '--shade-blur', cssUnit: 'px', hint: 'Preview effect; real blur depends on device support.' },
        c('qsTileOn', 'Tile — active', '#FF3482FF', 'com.android.systemui', 'qs_tile_on_bg_color', '--qs-on'),
        c('qsTileOff', 'Tile — inactive', '#33FFFFFF', 'com.android.systemui', 'qs_tile_off_bg_color', '--qs-off'),
        c('qsIconOn', 'Tile icon — active', '#FFFFFFFF', 'com.android.systemui', 'qs_tile_on_icon_color', '--qs-ic-on'),
        c('qsIconOff', 'Tile icon — inactive', '#DEFFFFFF', 'com.android.systemui', 'qs_tile_off_icon_color', '--qs-ic-off'),
        c('qsLabelColor', 'Tile labels', '#DEFFFFFF', 'com.android.systemui', 'qs_tile_label_color', '--qs-label'),
        { key: 'qsTileRadius', label: 'Tile corner radius', type: 'slider', default: 18, min: 0, max: 32, step: 2, unit: 'dp', cssVar: '--qs-radius', cssUnit: 'px', target: { module: 'com.android.systemui', name: 'qs_tile_radius', kind: 'dimen' } },
        { key: 'qsColumns', label: 'Tile columns', type: 'slider', default: 4, min: 3, max: 6, step: 1, cssVar: '--qs-cols', target: { module: 'com.android.systemui', name: 'qs_columns', kind: 'integer' } },
        c('brightnessColor', 'Brightness slider', '#FFFFFFFF', 'com.android.systemui', 'brightness_slider_color', '--bright'),
        c('notifCardBg', 'Notification card', '#F2FFFFFF', 'com.android.systemui', 'notification_card_bg_color', '--notif-bg'),
        { key: 'notifCardRadius', label: 'Card corner radius', type: 'slider', default: 16, min: 0, max: 28, step: 2, unit: 'dp', cssVar: '--notif-radius', cssUnit: 'px', target: { module: 'com.android.systemui', name: 'notification_card_radius', kind: 'dimen' } },
        c('notifTitleColor', 'Notification title', '#E6000000', 'com.android.systemui', 'notification_title_color', '--notif-title'),
        c('notifTextColor', 'Notification text', '#8A000000', 'com.android.systemui', 'notification_text_color', '--notif-text')
      ]
    },

    /* ------------------------------------------------ 6. Lock screen */
    {
      id: 'lockscreen', title: 'Lock screen', icon: '🔒',
      description: 'Clock, date and unlock affordances on the lock screen.',
      fields: [
        c('lsClockColor', 'Clock color', '#FFFFFFFF', 'framework-res', 'lock_screen_clock_color', '--ls-clock'),
        {
          key: 'lsClockFormat', label: 'Clock layout', type: 'select', default: 'stacked',
          options: [
            { value: 'inline', label: 'Single line — 10:24' },
            { value: 'stacked', label: 'Stacked — 10 / 24' },
            { value: 'mono', label: 'Minimal — 10:24 thin' }
          ],
          target: { module: 'framework-res', name: 'lock_screen_clock_style', kind: 'string' }
        },
        { key: 'lsClockSize', label: 'Clock size', type: 'slider', default: 64, min: 32, max: 110, step: 2, unit: 'dp', cssVar: '--ls-clock-size', cssUnit: 'px', target: { module: 'framework-res', name: 'lock_screen_clock_size', kind: 'dimen' } },
        {
          key: 'lsClockWeight', label: 'Clock weight', type: 'select', default: '300',
          options: [
            { value: '100', label: 'Thin' }, { value: '300', label: 'Light' },
            { value: '400', label: 'Regular' }, { value: '600', label: 'Semibold' }, { value: '800', label: 'Heavy' }
          ],
          cssVar: '--ls-clock-weight'
        },
        { key: 'lsDateShow', label: 'Show date', type: 'toggle', default: true },
        c('lsDateColor', 'Date color', '#CCFFFFFF', 'framework-res', 'lock_screen_date_color', '--ls-date'),
        { key: 'lsOwnerText', label: 'Signature text', type: 'text', default: '', hint: 'Optional owner text shown under the date.', target: { module: 'framework-res', name: 'lock_screen_owner_info', kind: 'string' } },
        { key: 'lsHintText', label: 'Unlock hint text', type: 'text', default: 'Swipe up to unlock' },
        c('lsHintColor', 'Unlock hint color', '#99FFFFFF', 'framework-res', 'lock_screen_hint_color', '--ls-hint'),
        { key: 'lsShortcuts', label: 'Corner shortcuts (flashlight / camera)', type: 'toggle', default: true },
        { key: 'lsDim', label: 'Wallpaper dim', type: 'slider', default: 20, min: 0, max: 70, step: 5, unit: '%', cssVar: '--ls-dim', cssScale: 0.01 }
      ]
    },

    /* ------------------------------------------------ 7. Home screen */
    {
      id: 'home', title: 'Home screen', icon: '🏠',
      description: 'Launcher: icon labels, dock, folders, search bar and grid.',
      fields: [
        c('homeLabelColor', 'Icon label color', '#FFFFFFFF', 'com.miui.home', 'icon_title_text_color', '--home-label'),
        { key: 'homeLabelShadow', label: 'Label shadow', type: 'toggle', default: true, cssVar: '--home-label-shadow', cssOn: '0 1px 3px rgba(0,0,0,.6)', cssOff: 'none' },
        { key: 'homeLabelSize', label: 'Label size', type: 'slider', default: 12, min: 9, max: 15, step: 1, unit: 'dp', cssVar: '--home-label-size', cssUnit: 'px', target: { module: 'com.miui.home', name: 'icon_title_text_size', kind: 'dimen' } },
        { key: 'homeLabelShow', label: 'Show labels', type: 'toggle', default: true },
        { key: 'gridCols', label: 'Grid columns', type: 'slider', default: 4, min: 3, max: 6, step: 1, cssVar: '--grid-cols', target: { module: 'com.miui.home', name: 'launcher_grid_columns', kind: 'integer' } },
        { key: 'gridRows', label: 'Grid rows', type: 'slider', default: 5, min: 4, max: 7, step: 1, cssVar: '--grid-rows', target: { module: 'com.miui.home', name: 'launcher_grid_rows', kind: 'integer' } },
        { key: 'dockShow', label: 'Show dock background', type: 'toggle', default: true },
        c('dockBg', 'Dock background', '#33FFFFFF', 'com.miui.home', 'dock_bg_color', '--dock-bg'),
        { key: 'dockRadius', label: 'Dock corner radius', type: 'slider', default: 26, min: 0, max: 40, step: 2, unit: 'dp', cssVar: '--dock-radius', cssUnit: 'px', target: { module: 'com.miui.home', name: 'dock_bg_radius', kind: 'dimen' } },
        c('folderBg', 'Folder preview background', '#4DFFFFFF', 'com.miui.home', 'folder_icon_bg_color', '--folder-bg'),
        { key: 'searchBarShow', label: 'Show search bar', type: 'toggle', default: true },
        c('searchBarBg', 'Search bar background', '#E6FFFFFF', 'com.miui.home', 'search_bar_bg_color', '--search-bg'),
        c('searchBarIcon', 'Search bar icon', '#FF3482FF', 'com.miui.home', 'search_bar_icon_color', '--search-ic'),
        { key: 'widgetClockShow', label: 'Show clock widget', type: 'toggle', default: true },
        c('widgetClockColor', 'Clock widget color', '#FFFFFFFF', 'com.miui.home', 'widget_clock_color', '--widget-clock')
      ]
    },

    /* ------------------------------------------------ 8. Icons */
    {
      id: 'icons', title: 'App icons', icon: '🔷',
      description: 'Icon mask, background, border and scale. Exported as mask/pattern PNGs plus transform_config.xml in the icons module.',
      fields: [
        {
          key: 'iconShape', label: 'Icon shape', type: 'select', default: 'squircle',
          options: [
            { value: 'original', label: 'Original (no mask)' },
            { value: 'circle', label: 'Circle' },
            { value: 'squircle', label: 'Squircle' },
            { value: 'rounded', label: 'Rounded square' },
            { value: 'teardrop', label: 'Teardrop' },
            { value: 'hexagon', label: 'Hexagon' }
          ]
        },
        { key: 'iconRadius', label: 'Corner radius (rounded square)', type: 'slider', default: 28, min: 0, max: 50, step: 2, unit: '%' },
        { key: 'iconScale', label: 'Icon scale', type: 'slider', default: 100, min: 60, max: 110, step: 2, unit: '%' },
        { key: 'iconBgEnable', label: 'Solid icon background', type: 'toggle', default: false, hint: 'Draw a colored plate behind every icon.' },
        c('iconBg', 'Background color', '#FFFFFFFF', null, null, null),
        { key: 'iconBgGradient', label: 'Gradient background', type: 'toggle', default: false },
        c('iconBg2', 'Gradient second color', '#FFD8E6FF', null, null, null),
        { key: 'iconBgAngle', label: 'Gradient angle', type: 'slider', default: 135, min: 0, max: 360, step: 15, unit: '°' },
        { key: 'iconBorder', label: 'Border ring', type: 'toggle', default: false },
        c('iconBorderColor', 'Border color', '#FFFFFFFF', null, null, null),
        { key: 'iconBorderWidth', label: 'Border width', type: 'slider', default: 4, min: 1, max: 12, step: 1, unit: 'px' },
        { key: 'iconGloss', label: 'Gloss overlay', type: 'toggle', default: false, hint: 'Subtle top-light pattern layered over icons.' }
      ]
    },

    /* ------------------------------------------------ 9. Typography */
    {
      id: 'typography', title: 'Fonts', icon: '🔤',
      description: 'Replace the system font. Upload .ttf files — they are packaged as Roboto replacements, which MIUI applies system-wide.',
      fields: [
        { key: 'fontRegular', label: 'Regular font (.ttf)', type: 'font', default: null, accept: '.ttf,.otf,font/ttf,font/otf' },
        { key: 'fontBold', label: 'Bold font (.ttf, optional)', type: 'font', default: null, accept: '.ttf,.otf,font/ttf,font/otf' },
        { key: 'fontScale', label: 'Preview text scale', type: 'slider', default: 100, min: 85, max: 115, step: 5, unit: '%', cssVar: '--font-scale', cssScale: 0.01 },
        {
          key: 'fontFallback', label: 'Preview fallback family', type: 'select', default: 'system-ui',
          options: [
            { value: 'system-ui', label: 'System UI' }, { value: 'Roboto, sans-serif', label: 'Roboto' },
            { value: 'Georgia, serif', label: 'Serif' }, { value: 'ui-monospace, monospace', label: 'Monospace' }
          ],
          cssVar: '--font-fallback', hint: 'Only affects this preview when no font file is uploaded.'
        }
      ]
    },

    /* ------------------------------------------------ 10. Buttons & controls */
    {
      id: 'controls', title: 'Buttons & controls', icon: '🎚️',
      description: 'Buttons, switches, checkboxes, sliders and touch ripples.',
      fields: [
        c('btnBg', 'Button background', '#FF3482FF', 'framework-res', 'button_bg_color', '--btn-bg'),
        c('btnText', 'Button text', '#FFFFFFFF', 'framework-res', 'button_text_color', '--btn-text'),
        c('btnSecondaryBg', 'Secondary button background', '#14000000', 'framework-res', 'button_secondary_bg_color', '--btn2-bg'),
        c('btnSecondaryText', 'Secondary button text', '#E6000000', 'framework-res', 'button_secondary_text_color', '--btn2-text'),
        { key: 'btnRadius', label: 'Button corner radius', type: 'slider', default: 22, min: 0, max: 30, step: 2, unit: 'dp', cssVar: '--btn-radius', cssUnit: 'px', target: { module: 'framework-res', name: 'button_radius', kind: 'dimen' } },
        c('switchOn', 'Switch — on track', '#FF3482FF', 'framework-res', 'switch_on_track_color', '--switch-on'),
        c('switchOff', 'Switch — off track', '#26000000', 'framework-res', 'switch_off_track_color', '--switch-off'),
        c('switchThumb', 'Switch thumb', '#FFFFFFFF', 'framework-res', 'switch_thumb_color', '--switch-thumb'),
        c('checkboxOn', 'Checkbox — checked', '#FF3482FF', 'framework-res', 'checkbox_on_color', '--check-on'),
        c('seekbarProgress', 'Slider progress', '#FF3482FF', 'framework-res', 'seekbar_progress_color', '--seek-fill'),
        c('seekbarTrack', 'Slider track', '#1F000000', 'framework-res', 'seekbar_track_color', '--seek-track'),
        c('rippleColor', 'Touch ripple', '#1A000000', 'framework-res', 'ripple_color', '--ripple')
      ]
    },

    /* ------------------------------------------------ 11. Dialogs & menus */
    {
      id: 'dialogs', title: 'Dialogs & menus', icon: '💬',
      description: 'Alert dialogs, popup menus and sheets.',
      fields: [
        c('dialogBg', 'Dialog background', '#FFFFFFFF', 'framework-res', 'dialog_bg_color', '--dlg-bg'),
        { key: 'dialogRadius', label: 'Dialog corner radius', type: 'slider', default: 24, min: 0, max: 36, step: 2, unit: 'dp', cssVar: '--dlg-radius', cssUnit: 'px', target: { module: 'framework-res', name: 'dialog_bg_radius', kind: 'dimen' } },
        c('dialogTitle', 'Dialog title', '#E6000000', 'framework-res', 'dialog_title_color', '--dlg-title'),
        c('dialogText', 'Dialog message', '#8A000000', 'framework-res', 'dialog_message_color', '--dlg-text'),
        c('dialogPositive', 'Confirm button', '#FF3482FF', 'framework-res', 'dialog_button_positive_color', '--dlg-pos'),
        c('dialogNegative', 'Cancel button', '#8A000000', 'framework-res', 'dialog_button_negative_color', '--dlg-neg'),
        c('menuBg', 'Popup menu background', '#FFFFFFFF', 'framework-res', 'popup_menu_bg_color', '--menu-bg'),
        c('menuText', 'Popup menu text', '#E6000000', 'framework-res', 'popup_menu_text_color', '--menu-text')
      ]
    },

    /* ------------------------------------------------ 12. Settings app */
    {
      id: 'settingsapp', title: 'Settings app', icon: '⚙️',
      description: 'The MIUI Settings look: list cards, item titles, icons.',
      fields: [
        c('setBg', 'Background', '#FFF7F7F7', 'com.android.settings', 'settings_bg_color', '--set-bg'),
        c('setCardBg', 'List card background', '#FFFFFFFF', 'com.android.settings', 'settings_card_bg_color', '--set-card'),
        { key: 'setCardRadius', label: 'Card corner radius', type: 'slider', default: 16, min: 0, max: 28, step: 2, unit: 'dp', cssVar: '--set-radius', cssUnit: 'px', target: { module: 'com.android.settings', name: 'settings_card_radius', kind: 'dimen' } },
        c('setTitle', 'Item title', '#E6000000', 'com.android.settings', 'settings_item_title_color', '--set-title'),
        c('setSummary', 'Item summary', '#8A000000', 'com.android.settings', 'settings_item_summary_color', '--set-sum'),
        c('setIconTint', 'Item icon tint', '#FFFFFFFF', 'com.android.settings', 'settings_icon_color', '--set-ic'),
        c('setIconBg', 'Item icon plate', '#FF3482FF', 'com.android.settings', 'settings_icon_bg_color', '--set-ic-bg'),
        { key: 'setDividers', label: 'Show dividers', type: 'toggle', default: false }
      ]
    },

    /* ------------------------------------------------ 13. Sounds */
    {
      id: 'sounds', title: 'Sounds', icon: '🔊',
      description: 'Bundle ringtone, notification and alarm sounds (mp3 / ogg).',
      fields: [
        { key: 'ringtone', label: 'Ringtone', type: 'audio', default: null, accept: 'audio/*' },
        { key: 'notifSound', label: 'Notification sound', type: 'audio', default: null, accept: 'audio/*' },
        { key: 'alarmSound', label: 'Alarm sound', type: 'audio', default: null, accept: 'audio/*' }
      ]
    },

    /* ------------------------------------------------ 14. Boot animation */
    {
      id: 'boot', title: 'Boot animation', icon: '🚀',
      description: 'Attach a bootanimation.zip (standard Android boot animation format: desc.txt + part folders).',
      fields: [
        { key: 'bootAnimation', label: 'bootanimation.zip', type: 'file', default: null, accept: '.zip,application/zip' }
      ]
    },

    /* ------------------------------------------------ 15. Advanced */
    {
      id: 'advanced', title: 'Advanced / custom values', icon: '🧪',
      description: 'Write any extra entry into any module\'s theme_values.xml — colors, dimens, booleans, integers, strings or drawables. Use this to target keys specific to your MIUI version, or anything this designer does not expose yet. Custom entries override built-in ones with the same name.',
      fields: [
        { key: 'customValues', label: 'Custom entries', type: 'custom-values', default: [], modules: MODULES }
      ]
    }
  ];

  const previewScreens = [
    { id: 'home', label: 'Home' },
    { id: 'lock', label: 'Lock screen' },
    { id: 'shade', label: 'Notifications' },
    { id: 'settings', label: 'Settings' },
    { id: 'controls', label: 'Controls' }
  ];

  window.Platforms.register({
    id: 'miui',
    name: 'MIUI / HyperOS',
    packageExt: 'mtz',
    modules: MODULES,
    sections,
    previewScreens,

    buildPackage(state) {
      return window.MtzExport.build(state, this);
    },

    describeFiles(state) {
      return window.MtzExport.describe(state, this);
    }
  });
})();
