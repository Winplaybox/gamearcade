import React, { useState, useCallback } from 'react';
import { useCustomAlert } from '../context/AlertContext';
import {
  View,
  Text,
  InteractionManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedTouch from '../components/AnimatedTouch';
import AppLayout from '../components/AppLayout';
import GameListCard from '../components/GameListCard';
import SafeIcon from '../components/SafeIcon';
import SafeBannerAd from '../components/ui/SafeBannerAd';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { handlePlayGameWithAd } from '../utils/adNavigation';
import {
  getRecentGames,
  removeRecentGame,
  clearAllRecentGames,
  formatTimeAgo,
  formatDuration,
} from '../storage/recentGamesStorage';
import { getUserRatings } from '../storage/ratingsStorage';

export default function ContinuePlayingScreen({ navigation }) {
  const { showAlert } = useCustomAlert();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [recentGames, setRecentGames] = useState([]);
  const [userRatingsMap, setUserRatingsMap] = useState({});

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        getRecentGames().then(setRecentGames);
        getUserRatings().then(setUserRatingsMap);
      });
      return () => task.cancel();
    }, [])
  );

  const handleRemoveOne = (gameId, gameTitle) => {
    showAlert(
      'Remove Game History',
      `Remove "${gameTitle}" from your play history?`,
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('remove') || 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = await removeRecentGame(gameId);
            setRecentGames(updated);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    showAlert(
      'Clear Play History',
      'Are you sure you want to clear your entire play history?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('clear_all') || 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const updated = await clearAllRecentGames();
            setRecentGames(updated);
          },
        },
      ]
    );
  };

  const handlePlayGame = (game) => {
    handlePlayGameWithAd(navigation, game);
  };

  const headerRightAction = recentGames.length > 0 ? (
    <AnimatedTouch onPress={handleClearAll} style={styles.headerClearAllBtn}>
      <Ionicons name="trash-outline" size={16} color="#E94560" style={{ marginRight: 4 }} />
      <Text style={[styles.headerClearAllText, { color: '#E94560' }]}>{t('clear_all')}</Text>
    </AnimatedTouch>
  ) : null;

  return (
    <AppLayout
      heroTitle={t('continue_playing')}
      heroSubtitle="Pick up right where you left off"
      showBack={true}
      onBack={() => navigation.goBack()}
      rightAction={headerRightAction}
      navigation={navigation}
      scrollable={true}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {recentGames.length === 0 ? (
          <View style={styles.emptyContainer}>
            <SafeIcon name="time-outline" size={54} color={theme.subText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('no_play_history_yet')}</Text>
            <Text style={[styles.emptySub, { color: theme.subText }]}>
              {t('empty_history_sub')}
            </Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {recentGames.map((item) => {
              const userRating = userRatingsMap[item.id]?.rating;
              const ratingScore = userRating ? `${userRating}.0` : (item.rating || '4.6');
              const timeStampText = `${formatDuration(item.durationMs)} played • ${formatTimeAgo(item.timestamp)}`;

              return (
                <GameListCard
                  key={item.id}
                  game={item}
                  ratingScore={ratingScore}
                  subText={`${item.category || 'Arcade'} • ★ ${ratingScore}`}
                  timeStampText={timeStampText}
                  rightActionType="trash"
                  onPress={() => handlePlayGame(item)}
                  onRightAction={() => handleRemoveOne(item.id, item.title)}
                />
              );
            })}
          </View>
        )}
        <SafeBannerAd />
      </View>
    </AppLayout>
  );
}

import styles from '../styles/ContinuePlayingScreen.styles.js';
