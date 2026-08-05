import { useState, useCallback } from 'react';
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
import SafeBannerAd from '../components/ui/SafeBannerAd';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { handlePlayGameWithAd } from '../utils/adNavigation';
import { getFavoriteGames, toggleFavoriteGame, removeMultipleFavoriteGames, clearAllFavoriteGames } from '../storage/favoritesStorage';
import { getUserRatings } from '../storage/ratingsStorage';

export default function FavoritesScreen({ navigation }) {
  const { showAlert } = useCustomAlert();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [favorites, setFavorites] = useState([]);
  const [userRatingsMap, setUserRatingsMap] = useState({});

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const isAllSelected = favorites.length > 0 && selectedIds.size === favorites.length;

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        getFavoriteGames().then(setFavorites);
        getUserRatings().then(setUserRatingsMap);
      });
      return () => task.cancel();
    }, [])
  );

  const handleRemoveFav = async (game) => {
    showAlert(
      t('remove_favorite_title'),
      `Are you sure you want to remove "${game.title}" from your favorites?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            const updated = await toggleFavoriteGame(game);
            setFavorites(updated);
          },
        },
      ]
    );
  };

  const handleToggleSelect = (gameId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      if (next.size === 0) {
        setSelectionMode(false);
      }
      return next;
    });
  };

  const handleSelectAllToggle = () => {
    if (selectedIds.size === favorites.length) {
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else {
      setSelectedIds(new Set(favorites.map((g) => g.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    showAlert(
      'Remove Selected Favorites',
      `Are you sure you want to remove ${selectedIds.size} game(s) from your favorites?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const idsArray = Array.from(selectedIds);
            const updated = await removeMultipleFavoriteGames(idsArray);
            setFavorites(updated);
            setSelectedIds(new Set());
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    showAlert(
      t('clear_all_favorites_title'),
      t('clear_all_favorites_msg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear_all'),
          style: 'destructive',
          onPress: async () => {
            await clearAllFavoriteGames();
            setFavorites([]);
            setSelectedIds(new Set());
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const handlePlayGame = (game) => {
    if (selectionMode) {
      handleToggleSelect(game.id);
      return;
    }
    handlePlayGameWithAd(navigation, game);
  };

  const pageTitle = selectionMode ? `Selected (${selectedIds.size})` : t('tab_favorites');

  const headerRightAction = selectionMode ? (
    <View style={styles.headerActionRow}>
      <AnimatedTouch onPress={handleSelectAllToggle} style={styles.headerIconBtn}>
        <Ionicons
          name={isAllSelected ? 'checkbox' : 'square-outline'}
          size={24}
          color={theme.primary}
        />
      </AnimatedTouch>

      <AnimatedTouch
        onPress={handleDeleteSelected}
        style={[styles.headerIconBtn, { marginLeft: 8 }]}
      >
        <Ionicons name="trash-outline" size={22} color="#E94560" />
      </AnimatedTouch>

      <AnimatedTouch
        onPress={() => {
          setSelectionMode(false);
          setSelectedIds(new Set());
        }}
        style={[styles.headerIconBtn, { marginLeft: 8 }]}
      >
        <Ionicons name="close" size={22} color={theme.subText} />
      </AnimatedTouch>
    </View>
  ) : favorites.length > 0 ? (
    <AnimatedTouch onPress={handleClearAll} style={styles.headerClearAllBtn}>
      <Ionicons name="trash-outline" size={16} color="#E94560" style={{ marginRight: 4 }} />
      <Text style={[styles.headerClearAllText, { color: '#E94560' }]}>{t('clear_all')}</Text>
    </AnimatedTouch>
  ) : null;

  return (
    <AppLayout
      heroTitle={pageTitle}
      heroSubtitle={`${favorites.length} saved titles for quick access`}
      rightAction={headerRightAction}
      currentTab="Favorites"
      navigation={navigation}
      scrollable={true}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={54} color={theme.subText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('no_favorites_yet')}</Text>
            <Text style={[styles.emptySub, { color: theme.subText }]}>{t('no_favorites_sub')}</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {favorites.map((game) => {
              const isSelected = selectedIds.has(game.id);
              const userRating = userRatingsMap[game.id]?.rating;
              const ratingScore = userRating ? `${userRating}.0` : (game.rating || '4.8');

              return (
                <GameListCard
                  key={game.id}
                  game={game}
                  ratingScore={ratingScore}
                  isSelected={selectionMode ? isSelected : false}
                  rightActionType={selectionMode ? 'select' : 'trash'}
                  onPress={() => handlePlayGame(game)}
                  onLongPress={() => {
                    if (!selectionMode) {
                      setSelectionMode(true);
                      handleToggleSelect(game.id);
                    }
                  }}
                  {...(selectionMode ? { onSelect: () => handleToggleSelect(game.id) } : { onRightAction: () => handleRemoveFav(game) })}
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

import styles from '../styles/FavoritesScreen.styles.js';
import { useCustomAlert } from '../context/AlertContext';
