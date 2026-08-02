import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import GameListCard from '../components/GameListCard';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { getFavoriteGames, toggleFavoriteGame } from '../storage/favoritesStorage';
import { getUserRatings } from '../storage/ratingsStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FavoritesScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [favorites, setFavorites] = useState([]);
  const [userRatingsMap, setUserRatingsMap] = useState({});

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useFocusEffect(
    useCallback(() => {
      getFavoriteGames().then(setFavorites);
      getUserRatings().then(setUserRatingsMap);
    }, [])
  );

  const handleRemoveFav = async (game) => {
    Alert.alert(
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
    Alert.alert(
      'Remove Selected Favorites',
      `Are you sure you want to remove ${selectedIds.size} game(s) from your favorites?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = favorites.filter((g) => !selectedIds.has(g.id));
            await AsyncStorage.setItem('gamearcade_favorites_v1', JSON.stringify(updated));
            setFavorites(updated);
            setSelectedIds(new Set());
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('clear_all_favorites_title'),
      t('clear_all_favorites_msg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear_all'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('gamearcade_favorites_v1');
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
    navigation.navigate('Game', { game });
  };

  const pageTitle = selectionMode ? `Selected (${selectedIds.size})` : t('tab_favorites');

  const headerRightAction = selectionMode ? (
    <View style={styles.headerActionRow}>
      <TouchableOpacity onPress={handleSelectAllToggle} style={styles.headerIconBtn} activeOpacity={0.7}>
        <Ionicons
          name={selectedIds.size === favorites.length ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
          size={24}
          color={theme.primary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleDeleteSelected}
        style={[styles.headerIconBtn, { marginLeft: 8 }]}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={22} color="#E94560" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setSelectionMode(false);
          setSelectedIds(new Set());
        }}
        style={[styles.headerIconBtn, { marginLeft: 8 }]}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={22} color={theme.subText} />
      </TouchableOpacity>
    </View>
  ) : favorites.length > 0 ? (
    <TouchableOpacity onPress={handleClearAll} style={styles.headerClearAllBtn} activeOpacity={0.7}>
      <Ionicons name="trash-outline" size={16} color="#E94560" style={{ marginRight: 4 }} />
      <Text style={[styles.headerClearAllText, { color: '#E94560' }]}>{t('clear_all')}</Text>
    </TouchableOpacity>
  ) : null;

  return (
    <AppLayout
      title={pageTitle}
      rightAction={headerRightAction}
      currentTab="Favorites"
      navigation={navigation}
      scrollable={false}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Count Badge Header */}
        <View style={styles.countHeaderRow}>
          <Text style={[styles.countText, { color: theme.subText }]}>
            {favorites.length} {t('saved_games')}
          </Text>
        </View>

        {/* Reused GameListCard Component for Vertical Favorites List View */}
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={54} color={theme.subText} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('no_favorites_saved')}</Text>
              <Text style={[styles.emptySub, { color: theme.subText }]}>
                {t('no_favorites_sub')}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
            const userRating = userRatingsMap[item.id]?.rating;
            const ratingScore = userRating ? `${userRating}.0` : (item.rating || '4.6');

            return (
              <GameListCard
                key={item.id}
                game={item}
                ratingScore={ratingScore}
                subText={`${item.category || 'Arcade'} • ★ ${ratingScore}`}
                rightActionType={selectionMode ? 'select' : 'trash'}
                selectionMode={selectionMode}
                isSelected={isSelected}
                onPress={() => handlePlayGame(item)}
                onLongPress={() => {
                  setSelectionMode(true);
                  handleToggleSelect(item.id);
                }}
                onRightAction={() => {
                  if (selectionMode) handleToggleSelect(item.id);
                  else handleRemoveFav(item);
                }}
              />
            );
          }}
        />
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  countHeaderRow: {
    marginBottom: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 4,
  },
  headerClearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerClearAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
