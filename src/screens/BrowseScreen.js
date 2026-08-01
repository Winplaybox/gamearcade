import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { getLiveGamesList, getCategoriesFromGames } from '../services/gameService';
import { getFavoriteGames, toggleFavoriteGame } from '../storage/favoritesStorage';

const { width } = Dimensions.get('window');

export default function BrowseScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const categories = useMemo(() => {
    return getCategoriesFromGames(games);
  }, [games]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const liveList = await getLiveGamesList();
      setGames(liveList);
      setLoading(false);
    })();
  }, []);

  // Refresh favorite state whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getFavoriteGames().then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))));
    }, [])
  );

  const handleToggleFav = async (game) => {
    const updated = await toggleFavoriteGame(game);
    setFavoriteIds(new Set(updated.map((f) => f.id)));
  };

  const handlePlayGame = (game) => {
    navigation.navigate('Game', { game });
  };

  const filteredGames = useMemo(() => {
    let list = games;
    if (selectedCategory !== 'All') {
      list = list.filter(
        (g) => g.category && g.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (g) =>
          (g.title && g.title.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q))
      );
    }
    return list;
  }, [games, selectedCategory, searchQuery]);

  return (
    <AppLayout title="Browse Games" currentTab="Browse" navigation={navigation} scrollable={false}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Search Input */}
        <View style={[styles.searchBarRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search games..."
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

        {/* Dynamic Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.inputBg,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryPillText, { color: isSelected ? '#ffffff' : theme.text }]}>
                  {cat === 'All' ? 'All' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Games Found Count Header */}
        <View style={styles.countHeader}>
          <Text style={[styles.countText, { color: theme.subText }]}>
            {filteredGames.length} Games Found
          </Text>
        </View>

        {/* 2-Column Game Grid */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredGames}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="game-controller-outline" size={48} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No games found.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isFav = favoriteIds.has(item.id);
              return (
                <TouchableOpacity
                  style={[styles.gameCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                  onPress={() => handlePlayGame(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item.iconUrl }} style={styles.gameImage} />
                    <TouchableOpacity
                      style={styles.favFloatingBtn}
                      onPress={() => handleToggleFav(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isFav ? 'heart' : 'heart-outline'}
                        size={16}
                        color={isFav ? '#E94560' : '#ffffff'}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.cardCategory, { color: theme.subText }]}>{item.category || 'Arcade'}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#FFC107" />
                      <Text style={[styles.ratingText, { color: theme.subText }]}>
                        {item.rating || '4.6'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
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
  categoriesScroll: {
    maxHeight: 40,
    marginBottom: 12,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  countHeader: {
    marginBottom: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  gridContent: {
    paddingBottom: 16,
  },
  gameCard: {
    width: (width - 44) / 2,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 110,
    width: '100%',
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  favFloatingBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 12,
  },
  cardMeta: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardCategory: {
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
});
