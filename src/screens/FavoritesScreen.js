import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { getFavoriteGames, toggleFavoriteGame } from '../storage/favoritesStorage';
import { getUserRatings } from '../storage/ratingsStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FavoritesScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRatingsMap, setUserRatingsMap] = useState({});

  useFocusEffect(
    useCallback(() => {
      getFavoriteGames().then(setFavorites);
      getUserRatings().then(setUserRatingsMap);
    }, [])
  );

  const handleRemoveFav = (game) => {
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
          },
        },
      ]
    );
  };

  const handlePlayGame = (game) => {
    navigation.navigate('Game', { game });
  };

  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favorites;
    const q = searchQuery.toLowerCase().trim();
    return favorites.filter(
      (g) =>
        (g.title && g.title.toLowerCase().includes(q)) ||
        (g.category && g.category.toLowerCase().includes(q))
    );
  }, [favorites, searchQuery]);

  return (
    <AppLayout title={t('tab_favorites')} currentTab="Favorites" navigation={navigation} scrollable={false}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Search Input */}
        <View style={[styles.searchBarRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t('search_placeholder')}
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={theme.subText} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Count Badge & Clear All Header */}
        <View style={styles.countHeaderRow}>
          <Text style={[styles.countText, { color: theme.subText }]}>
            {filteredFavorites.length} {t('saved_games')}
          </Text>
          {favorites.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={[styles.clearAllText, { color: theme.primary }]}>{t('clear_all')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Favorites List */}
        <FlatList
          data={filteredFavorites}
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
            const userRating = userRatingsMap[item.id]?.rating;
            const ratingScore = userRating ? `${userRating}.0` : (item.rating || '4.6');
            return (
              <TouchableOpacity
                style={[styles.favListItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                onPress={() => handlePlayGame(item)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: item.iconUrl }} style={styles.favItemImage} />
                <View style={styles.favItemMeta}>
                  <Text style={[styles.favItemTitle, { color: theme.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.favItemCategory, { color: theme.subText }]}>{item.category || 'Arcade'}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FFC107" />
                    <Text style={[styles.ratingText, { color: theme.subText }]}>
                      {ratingScore}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.unfavBtn}
                  onPress={() => handleRemoveFav(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color="#E94560" />
                </TouchableOpacity>
              </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  countHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearAllText: {
    fontSize: 12,
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
  favListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  favItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  favItemMeta: {
    flex: 1,
    marginLeft: 12,
  },
  favItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  favItemCategory: {
    fontSize: 11,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  unfavBtn: {
    padding: 8,
  },
});
