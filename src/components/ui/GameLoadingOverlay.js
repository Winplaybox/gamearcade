import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import SafeIcon from '../SafeIcon';
import ProgressBar from './ProgressBar';
import { useTranslation } from '../../i18n/i18n';

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

  return (
    <View style={styles.loadingOverlay}>
      {/* Centered App Icon with Glow Frame */}
      <View style={styles.iconCenterWrapper}>
        <View style={styles.iconGlowFrame}>
          {game?.iconUrl ? (
            <Image source={{ uri: game.iconUrl }} style={styles.loadingGameIcon} />
          ) : (
            <View style={styles.loadingIconPlaceholder}>
              <SafeIcon name="game-controller" size={44} color="#E94560" />
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

        <ProgressBar progress={loadProgress} height={6} fillColor="#E94560" />
      </View>

      {/* Bottom Rotating Status Line */}
      <Text style={styles.bottomStatusText}>
        {LOADING_STATUS_STRINGS[statusIndex % LOADING_STATUS_STRINGS.length]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1D1011',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    paddingHorizontal: 28,
  },
  iconCenterWrapper: {
    alignItems: 'center',
    marginBottom: 36,
    justifyContent: 'center',
    display: 'flex',
  },
  iconGlowFrame: {
    borderRadius: 24,
    shadowColor: '#E94560',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 16,
  },
  loadingGameIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
  },
  loadingIconPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#261819',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F7DCDD',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  loadingCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2BEBF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2BEBF',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E94560',
  },
  bottomStatusText: {
    position: 'absolute',
    bottom: 36,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(226, 190, 191, 0.6)',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
