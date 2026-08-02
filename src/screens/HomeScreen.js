import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppLayout from '../components/AppLayout';
import GameGridCard from '../components/GameGridCard';
import GameListCard from '../components/GameListCard';
import SafeIcon from '../components/SafeIcon';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import {
  getLiveGamesList,
  getLiveCategoriesList,
  getAvailableCategoriesForGames,
} from '../services/gameService';
import { getFavoriteGames, toggleFavoriteGame } from '../storage/favoritesStorage';
import { getRecentGames } from '../storage/recentGamesStorage';
import { getUserRatings } from '../storage/ratingsStorage';

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [games, setGames] = useState([]);
  const [liveCategories, setLiveCategories] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [userRatingsMap, setUserRatingsMap] = useState({});

  // Horizontal scroll tracking states
  const [showRecentChevron, setShowRecentChevron] = useState(false);
  const [showFeaturedChevron, setShowFeaturedChevron] = useState(false);

  const fetchHomeData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [liveList, categoriesList] = await Promise.all([
        getLiveGamesList(),
        getLiveCategoriesList(),
      ]);
      setGames(liveList);
      setLiveCategories(categoriesList);
    } catch (e) {
      console.warn('Fetch home data error:', e);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchHomeData(true);

      const favs = await getFavoriteGames();
      setFavoriteIds(new Set(favs.map((f) => f.id)));

      const ratings = await getUserRatings();
      setUserRatingsMap(ratings);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getRecentGames().then(setRecentGames);
      getFavoriteGames().then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))));
      getUserRatings().then(setUserRatingsMap);

      if (games.length === 0) {
        fetchHomeData(false);
      }
    }, [games.length])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData(false);
    const favs = await getFavoriteGames();
    setFavoriteIds(new Set(favs.map((f) => f.id)));
    const recent = await getRecentGames();
    setRecentGames(recent);
    setRefreshing(false);
  };

  const availableCategories = useMemo(() => {
    return getAvailableCategoriesForGames(games, liveCategories);
  }, [games, liveCategories]);

  const displayCategoryChips = useMemo(() => {
    const chipList = [{ id: 'popular', title: t('popularity') || 'Popular', icon: 'sparkles-outline', themeColor: theme.primary }];
    availableCategories.forEach((c) => {
      chipList.push({
        id: c.id,
        title: c.title,
        icon: c.icon || 'game-controller-outline',
        themeColor: c.themeColor || theme.primary,
      });
    });
    return chipList;
  }, [availableCategories, theme, t]);

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

  const popularGamesList = useMemo(() => {
    let list = games;
    if (selectedCategory && selectedCategory !== 'Popular' && selectedCategory !== t('popularity')) {
      list = list.filter((g) => g.category && g.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (g) =>
          (g.title && g.title.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q))
      );
    }
    return list.slice(0, 5);
  }, [games, selectedCategory, searchQuery, t]);

  const handleRecentScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setShowRecentChevron(offsetX > 35);
  };

  const handleFeaturedScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setShowFeaturedChevron(offsetX > 35);
  };

  return (
    <AppLayout
      title={
        <View style={styles.brandHeaderRow}>
          <View style={styles.brandHeaderIconBox}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.brandHeaderIcon}
              resizeMode="contain"
            />
          </View>
          <View style={{ justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.headerTitleMain, { color: theme.text }]}>Game </Text>
              <Text style={[styles.headerTitleAccent, { color: theme.primary }]}>Arcade</Text>
            </View>
            <Text style={[styles.headerSubTitle, { color: theme.subText }]}>{t('instant_games_sub')}</Text>
          </View>
        </View>
      }
      currentTab="Home"
      navigation={navigation}
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      <View style={styles.container}>
        {/* Search Bar Input */}
        <View style={[styles.searchBarRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <SafeIcon name="search-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t('search_games_placeholder')}
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <SafeIcon name="close-circle" size={16} color={theme.subText} />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : games.length === 0 ? (
          <View style={styles.emptyContainer}>
            <SafeIcon name="game-controller-outline" size={48} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_games_available')}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={() => fetchHomeData(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.retryBtnText}>{t('retry_loading_games')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Section 1: Continue Playing Horizontal Carousel */}
            {!searchQuery && recentGames.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('continue_playing')}</Text>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Browse', { filter: 'recent', title: t('continue_playing') })}
                    activeOpacity={0.7}
                    disabled={!showRecentChevron}
                    style={[styles.chevronBtn, { opacity: showRecentChevron ? 1 : 0 }]}
                  >
                    <SafeIcon name="chevron-forward" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                  onScroll={handleRecentScroll}
                  scrollEventThrottle={16}
                >
                  {recentGames.map((game) => {
                    const isFav = favoriteIds.has(game.id);
                    const userRating = userRatingsMap[game.id]?.rating;
                    const ratingScore = userRating ? `${userRating}.0` : (game.rating || '4.7');
                    return (
                      <GameGridCard
                        key={game.id}
                        game={game}
                        cardWidth={190}
                        marginRight={14}
                        imageHeight={118}
                        isFavorite={isFav}
                        ratingScore={ratingScore}
                        showPlayOverlay={true}
                        onPress={() => handlePlayGame(game)}
                        onFavToggle={handleToggleFav}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Section 2: Horizontal Category Chips */}
            {!searchQuery && displayCategoryChips.length > 0 && (
              <View style={styles.sectionContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  {displayCategoryChips.map((cat) => {
                    const isSelected = selectedCategory === cat.title;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.cardBg,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => {
                          setSelectedCategory(cat.title);
                          if (cat.title !== 'Popular' && cat.title !== t('popularity')) {
                            navigation.navigate('Browse', { category: cat.title, categoryObj: cat });
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <SafeIcon
                          name={cat.icon}
                          size={14}
                          color={isSelected ? '#ffffff' : cat.themeColor}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.categoryChipText,
                            { color: isSelected ? '#ffffff' : theme.text, fontWeight: isSelected ? '700' : '500' },
                          ]}
                        >
                          {cat.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Section 3: Featured Games Horizontal Carousel */}
            {!searchQuery && featuredGames.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('featured_games')}</Text>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('Browse', { filter: 'featured', title: t('featured_games') })}
                    activeOpacity={0.7}
                    disabled={!showFeaturedChevron}
                    style={[styles.chevronBtn, { opacity: showFeaturedChevron ? 1 : 0 }]}
                  >
                    <SafeIcon name="chevron-forward" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10 }}
                  onScroll={handleFeaturedScroll}
                  scrollEventThrottle={16}
                >
                  {featuredGames.map((game) => {
                    const isFav = favoriteIds.has(game.id);
                    const userRating = userRatingsMap[game.id]?.rating;
                    const ratingScore = userRating ? `${userRating}.0` : (game.rating || '4.7');

                    return (
                      <GameGridCard
                        key={game.id}
                        game={game}
                        cardWidth={190}
                        marginRight={14}
                        imageHeight={118}
                        isFavorite={isFav}
                        ratingScore={ratingScore}
                        onPress={() => handlePlayGame(game)}
                        onFavToggle={handleToggleFav}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Section 4: Top 5 Popular Games Vertical List */}
            {popularGamesList.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('popular_games')}</Text>
                </View>

                <View style={styles.popularList}>
                  {popularGamesList.map((game) => {
                    const userRating = userRatingsMap[game.id]?.rating;
                    const ratingScore = userRating ? `${userRating}.0` : (game.rating || '4.6');

                    return (
                      <GameListCard
                        key={game.id}
                        game={game}
                        ratingScore={ratingScore}
                        rightActionType="play"
                        onPress={() => handlePlayGame(game)}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  brandHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  brandHeaderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#261819',
    borderWidth: 1,
    borderColor: 'rgba(233,69,96,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  brandHeaderIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  headerTitleMain: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerTitleAccent: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubTitle: {
    fontSize: 11,
    marginTop: 1,
  },
  container: {
    paddingVertical: 12,
    paddingHorizontal: 20,
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
    marginBottom: 14,
  },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  chevronBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 13,
  },
  popularList: {
    marginTop: 6,
  },
});
