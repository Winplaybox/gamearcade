import React from 'react';
import { Ionicons } from '@expo/vector-icons';

// Mapping table for invalid/deprecated icon names to valid Ionicons names
const INVALID_ICON_MAP = {
  'crosshair-outline': 'locate-outline',
  'crosshair': 'locate',
  'hand-index-thumb-outline': 'hand-left-outline',
  'hand-index-thumb': 'hand-left',
  'castle-outline': 'shield-outline',
  'castle': 'shield',
  'sparkle-outline': 'sparkles-outline',
  'sparkle': 'sparkles',
  'hand-grab-outline': 'hand-left-outline',
  'hand-grab': 'hand-left',
  'shield-alert-outline': 'shield-outline',
  'shield-alert': 'shield',
  'gamepad-outline': 'game-controller-outline',
  'gamepad': 'game-controller',
  'trophy-variant-outline': 'trophy-outline',
  'fire-outline': 'flame-outline',
  'fire': 'flame',
};

export default function SafeIcon({ name, size = 20, color = '#ffffff', style }) {
  let validName = name || 'game-controller-outline';

  if (INVALID_ICON_MAP[validName]) {
    validName = INVALID_ICON_MAP[validName];
  }

  // Fallback check to ensure icon never crashes or logs unhandled warnings
  try {
    return <Ionicons name={validName} size={size} color={color} style={style} />;
  } catch (e) {
    return <Ionicons name="game-controller-outline" size={size} color={color} style={style} />;
  }
}
