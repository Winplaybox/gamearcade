import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { DEFAULT_GAMES, getCategoriesList } from '../services/gameService';
import { getFavoriteGames, toggleFavoriteGame } from '../storage/favoritesStorage';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const categories = getCategoriesList();

  useEffect(() => {
    (async () => {
      const favs = await getFavoriteGames();
      setFavoriteIds(new Set(favs.map((f) => f.id)));
    })();
  }, []);

  const handleToggleFav = async (game) => {
    const updated = await toggleFavoriteGame(game);
    setFavoriteIds(new Set(updated.map((f) => f.id)));
  };

  const handlePlayGame = (game) => {
    navigation.navigate('Game', { game });
  };

  const filteredGames = useMemo(() => {
    let list = DEFAULT_GAMES;
    if (selectedCategory !== 'All') {
      list = list.filter((g) => g.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((g) => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q));
    }
    return list;
  }, [selectedCategory, searchQuery]);

  const featuredGames = useMemo(() => {
    return DEFAULT_GAMES.filter((g) => g.isFeatured);
  }, []);

  return (
    <AppLayout title={t('app_name')} currentTab="Home" navigation={navigation} scrollable>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={[styles.searchBarRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
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

        {/* Category Pills Slider */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  { backgroundColor: isSelected ? theme.primary : theme.cardBg, borderColor: theme.border },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryPillText, { color: isSelected ? '#ffffff' : theme.text }]}>
                  {cat === 'All' ? t('all_categories') : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured Games Carousel (Only when search is empty and 'All' category) */}
        {!searchQuery && selectedCategory === 'All' && featuredGames.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🔥 {t('featured_games')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {featuredGames.map((game) => {
                const isFav = favoriteIds.has(game.id);
                return (
                  <TouchableOpacity
                    key={game.id}
                    style={[styles.featuredCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                    onPress={() => handlePlayGame(game)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: game.iconUrl }} style={styles.featuredImage} />
                    <TouchableOpacity
                      style={styles.favFloatingBtn}
                      onPress={() => handleToggleFav(game)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={18} color={isFav ? '#e94560' : '#ffffff'} />
                    </TouchableOpacity>
                    <View style={styles.featuredOverlay}>
                      <Text style={styles.featuredCardTitle} numberOfLines={1}>
                        {game.title}
                      </Text>
                      <Text style={styles.featuredCardCategory}>{game.category} • ★ {game.rating}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Instant Games Grid */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🎮 ALL INSTANT GAMES</Text>
          <View style={styles.gamesGrid}>
            {filteredGames.map((game) => {
              const isFav = favoriteIds.has(game.id);
              return (
                <TouchableOpacity
                  key={game.id}
                  style={[styles.gameGridCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                  onPress={() => handlePlayGame(game)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: game.iconUrl }} style={styles.gameGridImage} />
                  <TouchableOpacity
                    style={styles.gridFavBtn}
                    onPress={() => handleToggleFav(game)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={16} color={isFav ? '#e94560' : '#ffffff'} />
                  </TouchableOpacity>
                  <View style={styles.gameGridMeta}>
                    <Text style={[styles.gameGridTitle, { color: theme.text }]} numberOfLines={1}>
                      {game.title}
                    </Text>
                    <Text style={[styles.gameGridSub, { color: theme.subText }]}>{game.category} • ★ {game.rating}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    marginBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredCard: {
    width: 220,
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  favFloatingBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 14,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  featuredCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  featuredCardCategory: {
    color: '#e2e8f0',
    fontSize: 11,
    marginTop: 2,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  gameGridCard: {
    width: (width - 44) / 2,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gameGridImage: {
    width: '100%',
    height: 110,
  },
  gridFavBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 12,
  },
  gameGridMeta: {
    padding: 10,
  },
  gameGridTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  gameGridSub: {
    fontSize: 11,
    marginTop: 3,
  },
});
