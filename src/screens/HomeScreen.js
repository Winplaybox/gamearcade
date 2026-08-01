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
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { getLiveGamesList, getCategoriesFromGames } from '../services/gameService';
import { getFavoriteGames, toggleFavoriteGame } from '../storage/favoritesStorage';
import { getRecentGames } from '../storage/recentGamesStorage';
import { getUserRatings } from '../storage/ratingsStorage';

const { width } = Dimensions.get('window');

const CATEGORY_COLOR_PALETTE = [
  { icon: 'flame', color: '#E94560' },
  { icon: 'car-sport', color: '#3A86FF' },
  { icon: 'extension-puzzle', color: '#8338EC' },
  { icon: 'football', color: '#FF006E' },
  { icon: 'game-controller', color: '#FFBE0B' },
  { icon: 'shield-checkmark', color: '#FB5607' },
];

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [games, setGames] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [userRatingsMap, setUserRatingsMap] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const liveList = await getLiveGamesList();
      setGames(liveList);
      setLoading(false);

      const favs = await getFavoriteGames();
      setFavoriteIds(new Set(favs.map((f) => f.id)));

      const ratings = await getUserRatings();
      setUserRatingsMap(ratings);
    })();
  }, []);

  // Refresh recent games, favorites, and user ratings whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getRecentGames().then(setRecentGames);
      getFavoriteGames().then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))));
      getUserRatings().then(setUserRatingsMap);
    }, [])
  );

  const dynamicCategories = useMemo(() => {
    const rawCatList = getCategoriesFromGames(games).filter((c) => c !== 'All');
    return rawCatList.slice(0, 6).map((catName, index) => {
      const styleObj = CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length];
      return {
        id: catName,
        label: catName,
        icon: styleObj.icon,
        color: styleObj.color,
      };
    });
  }, [games]);

  const handleToggleFav = async (game) => {
    const updated = await toggleFavoriteGame(game);
    setFavoriteIds(new Set(updated.map((f) => f.id)));
  };

  const handlePlayGame = (game) => {
    navigation.navigate('Game', { game });
  };

  const featuredGames = useMemo(() => {
    return games.filter((g) => g.isFeatured || g.status === 'approved').slice(0, 5);
  }, [games]);

  return (
    <AppLayout
      title={
        <View style={{ paddingVertical: 4 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>🎮 Game Arcade</Text>
          <Text style={[styles.headerSubTitle, { color: theme.subText }]}>{t('instant_games_sub')}</Text>
        </View>
      }
      currentTab="Home"
      navigation={navigation}
      scrollable
    >
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={[styles.searchBarRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t('search_games_placeholder')}
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

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : games.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="game-controller-outline" size={48} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_games_available')}</Text>
          </View>
        ) : (
          <>
            {/* Continue Playing Section */}
            {!searchQuery && recentGames.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('continue_playing')}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Browse', { filter: 'recent', title: t('continue_playing') })}>
                    <Text style={[styles.seeAllText, { color: theme.primary }]}>{t('see_all')}</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {recentGames.map((game) => {
                    const isFav = favoriteIds.has(game.id);
                    return (
                      <TouchableOpacity
                        key={game.id}
                        style={[styles.continueCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                        onPress={() => handlePlayGame(game)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: game.iconUrl }} style={styles.continueImage} />
                        <View style={styles.playOverlayIcon}>
                          <Ionicons name="play" size={20} color="#ffffff" />
                        </View>
                        <TouchableOpacity
                          style={styles.favFloatingBtn}
                          onPress={() => handleToggleFav(game)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isFav ? 'heart' : 'heart-outline'}
                            size={16}
                            color={isFav ? '#E94560' : '#ffffff'}
                          />
                        </TouchableOpacity>
                        <View style={styles.continueMeta}>
                          <Text style={[styles.continueTitle, { color: theme.text }]} numberOfLines={1}>
                            {game.title}
                          </Text>
                          <Text style={[styles.continueCategory, { color: theme.subText }]}>{game.category || 'Arcade'}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Dynamic Categories Grid */}
            {!searchQuery && dynamicCategories.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('categories')}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Browse', { category: 'All' })}>
                    <Text style={[styles.seeAllText, { color: theme.primary }]}>{t('see_all')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.categoriesGrid}>
                  {dynamicCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryGridCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                      onPress={() => navigation.navigate('Browse', { category: cat.id })}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.categoryIconCircle, { backgroundColor: `${cat.color}20` }]}>
                        <Ionicons name={cat.icon} size={22} color={cat.color} />
                      </View>
                      <Text style={[styles.categoryGridLabel, { color: theme.text }]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Featured Games Carousel */}
            {featuredGames.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('featured_games')}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Browse', { filter: 'featured', title: t('featured_games') })}>
                    <Text style={[styles.seeAllText, { color: theme.primary }]}>{t('see_all')}</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                  {featuredGames.map((game) => {
                    const isFav = favoriteIds.has(game.id);
                    const userRating = userRatingsMap[game.id]?.rating;
                    const ratingScore = userRating ? `${userRating}.0` : (game.rating || '4.6');
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
                          <Ionicons
                            name={isFav ? 'heart' : 'heart-outline'}
                            size={18}
                            color={isFav ? '#E94560' : '#ffffff'}
                          />
                        </TouchableOpacity>
                        <View style={styles.featuredOverlay}>
                          <Text style={styles.featuredCardTitle} numberOfLines={1}>
                            {game.title}
                          </Text>
                          <Text style={styles.featuredCardCategory}>
                            {game.category || 'Arcade'} • ★ {ratingScore}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubTitle: {
    fontSize: 11,
    marginTop: 1,
  },
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
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
  sectionContainer: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  continueCard: {
    width: 150,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  continueImage: {
    width: '100%',
    height: 95,
  },
  playOverlayIcon: {
    position: 'absolute',
    top: 30,
    left: 58,
    backgroundColor: 'rgba(233,69,96,0.85)',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favFloatingBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 12,
  },
  continueMeta: {
    padding: 8,
  },
  continueTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  continueCategory: {
    fontSize: 10,
    marginTop: 2,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  categoryGridCard: {
    width: (width - 44) / 3,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryGridLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuredCard: {
    width: 210,
    height: 135,
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
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11,13,18,0.85)',
    padding: 8,
  },
  featuredCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  featuredCardCategory: {
    color: '#9298A5',
    fontSize: 11,
    marginTop: 2,
  },
});
