import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import SafeIcon from '../SafeIcon';
import ProgressBar from './ProgressBar';
import { useTranslation } from '../../i18n/i18n';
import { useTheme } from '../../theme/ThemeContext';

const LOADING_STATUS_STRINGS = [
  'STATUS · Getting things ready',
  'STATUS · Loading HTML5 engine & graphics',
  'STATUS · Optimizing audio & touch controls',
  'STATUS · Almost there, launching arcade...',
];

export default function GameLoadingOverlay({
  game,
  loadProgress = 15,
  statusIndex = 0,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <View style={styles.loadingOverlay}>
      {/* Centered App Icon with Glow Frame */}
      <View style={styles.iconCenterWrapper}>
        <View style={styles.iconGlowFrame}>
          {game?.iconUrl ? (
            <Image source={{ uri: game.iconUrl }} style={styles.loadingGameIcon} />
          ) : (
            <View style={styles.loadingIconPlaceholder}>
              <SafeIcon name="game-controller" size={44} color={theme.primary} />
            </View>
          )}
        </View>

        <Text style={styles.loadingTitleText} numberOfLines={1}>
          {game?.title || 'Game'}
        </Text>
        <Text style={styles.loadingCategoryText}>{game?.category || 'Arcade'}</Text>
      </View>

      {/* Progress Label & Modular Animated Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressLabelText}>{t('loading_game_assets')}</Text>
          <Text style={styles.progressPercentText}>{Math.round(loadProgress)}%</Text>
        </View>

        <ProgressBar progress={loadProgress} height={6} fillColor={theme.primary} />
      </View>

      {/* Bottom Rotating Status Line */}
      <Text style={styles.bottomStatusText}>
        {LOADING_STATUS_STRINGS[statusIndex % LOADING_STATUS_STRINGS.length]}
      </Text>
    </View>
  );
}

import styles from '../../styles/GameLoadingOverlay.styles.js';
