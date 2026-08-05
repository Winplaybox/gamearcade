import React from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * SafeIcon
 * --------
 * Thin wrapper around Ionicons that:
 *  1. Remaps known-invalid / deprecated icon names to valid equivalents.
 *  2. Catches any runtime render error and falls back to a neutral icon.
 *
 * DO NOT add a whitelist here — it will silently replace every icon that
 * isn't listed, breaking navigation arrows, filter icons, settings icons, etc.
 */

const ICON_REMAP = {
  // Legacy / deprecated names
  'crosshair-outline':          'locate-outline',
  'crosshair':                  'locate',
  'hand-index-thumb-outline':   'hand-left-outline',
  'hand-index-thumb':           'hand-left',
  'castle-outline':             'shield-outline',
  'castle':                     'shield',
  'sparkle-outline':            'sparkles-outline',
  'sparkle':                    'sparkles',
  'hand-grab-outline':          'hand-left-outline',
  'hand-grab':                  'hand-left',
  'shield-alert-outline':       'shield-outline',
  'shield-alert':               'shield',
  'gamepad-outline':            'game-controller-outline',
  'gamepad':                    'game-controller',
  'trophy-variant-outline':     'trophy-outline',
  'fire-outline':               'flame-outline',
  'fire':                       'flame',

  // Tab / nav icons that have known alternate names
  'apps-outline':               'grid-outline',
  'apps':                       'grid',
  'dice':                       'dice-outline',

  // GameScreen orientation icons — fallback to rotate generic if not found
  'phone-landscape-outline':    'phone-landscape-outline',
  'phone-portrait-outline':     'phone-portrait-outline',
  'expand-outline':             'expand-outline',
  'contract':                   'contract',

  // Genre icon safe fallbacks
  'balloon-outline':            'happy-outline',
  'balloon':                    'happy',
  'egg-outline':                'ellipse-outline',
  'egg':                        'ellipse',
  'footsteps-outline':          'walk-outline',
  'footsteps':                  'walk',
  'golf-outline':               'golf',
  'text-outline':               'document-text-outline',
  'body-outline':               'person-outline',
  'woman-outline':              'person-outline',
  'fitness-outline':            'barbell-outline',
  'fitness':                    'barbell',
  'helicopter-outline':         'airplane-outline',
  'helicopter':                 'airplane',
  'analytics-outline':          'bar-chart-outline',
  'analytics':                  'bar-chart',
  'park-outline':               'leaf-outline',
  'park':                       'leaf',

  // Sharp variants that may not exist — map to standard
  'bus-sharp':                  'bus',
  'car-sport-sharp':            'car-sport',
  'shield-sharp':               'shield',
  'skull-sharp':                'skull',
  'flame-sharp':                'flame',
  'color-wand-sharp':           'color-wand',
  'happy-sharp':                'happy',
  'disc-sharp':                 'disc',
  'grid-sharp':                 'grid',
  'construct-sharp':            'construct',
  'sparkles-sharp':             'sparkles',
  'snow-sharp':                 'snow',
  'locate-sharp':               'locate',
  'leaf-sharp':                 'leaf',
  'brush-sharp':                'brush',
  'layers-sharp':               'layers',
  'balloon-sharp':              'happy',
};

export default function SafeIcon({ name, size = 20, color = '#ffffff', style }) {
  const resolvedName = (name && ICON_REMAP[name]) ? ICON_REMAP[name] : (name || 'game-controller-outline');

  try {
    return <Ionicons name={resolvedName} size={size} color={color} style={style} />;
  } catch (e) {
    return <Ionicons name="game-controller-outline" size={size} color={color} style={style} />;
  }
}
