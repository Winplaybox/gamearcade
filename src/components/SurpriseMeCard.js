import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SafeIcon from './SafeIcon';
import { useTranslation } from '../i18n/i18n';

/**
 * SurpriseMeCard
 * ──────────────
 * Dark pill card — "Can't Decide?" on the left,
 * coral "Surprise Me" button on the right.
 *
 * Props:
 *   onPress  — called when the Surprise Me button is tapped
 *   style    — optional outer container style overrides
 */
export default function SurpriseMeCard({ onPress, category, style }) {
  const { t } = useTranslation();
  const isSpecificCategory = Boolean(
    category &&
    category !== 'All' &&
    category !== 'Popular' &&
    category !== 'Featured'
  );

  const subtitleText = isSpecificCategory
    ? `Pick a random ${category} game for you..`
    : 'Let us pick a masterpiece for you..';

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Left: text block */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{t('cant_decide')}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitleText}
        </Text>
      </View>

      {/* Right: button pill */}
      <View style={styles.surpriseBtn}>
        <SafeIcon name="dice-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.surpriseBtnText}>{t('surprise_me')}</Text>
      </View>
    </TouchableOpacity>
  );
}

import styles from '../styles/SurpriseMeCard.styles.js';
