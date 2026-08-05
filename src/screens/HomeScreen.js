import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  InteractionManager,
  Dimensions,
  Image,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useFocusEffect } from '@react-navigation/native';
import AnimatedTouch from '../components/AnimatedTouch';
import AppLayout from '../components/AppLayout';
import GameGridCard from '../components/GameGridCard';
import GameListCard from '../components/GameListCard';
import GenreCard from '../components/GenreCard';
import SafeIcon from '../components/SafeIcon';
import SafeBannerAd from '../components/ui/SafeBannerAd';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import {
  getFeaturedGames,
  getPopularGames,
  getLiveCategoriesList,
  getLiveGamesList, // used for surprise me pool only now
} from '../services/gameService';
import { handlePlayGameWithAd } from '../utils/adNavigation';
import { getFavoriteGames, toggleFavoriteGame } from '../storage/favoritesStorage';
import { getRecentGames } from '../storage/recentGamesStorage';
import { getUserRatings } from '../storage/ratingsStorage';
import SurpriseMeCard from '../components/SurpriseMeCard';
import { HomeScreenSkeleton } from '../components/SkeletonLoader';

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [featuredGames, setFeaturedGames] = useState([]);
  const [popularGamesList, setPopularGamesList] = useState([]);
  const [games, setGames] = useState([]); // used for Surprise Me pool
  const [liveCategories, setLiveCategories] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [userRatingsMap, setUserRatingsMap] = useState({});


  const fetchHomeData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [featList, popList, categoriesList, surprisePool] = await Promise.all([
        getFeaturedGames(),
        getPopularGames(),
        getLiveCategoriesList(),
        getLiveGamesList({ limit: 100 }) // fetch 100 random games for surprise me pool
      ]);
      setFeaturedGames(featList);
      setPopularGamesList(popList);
      setGames(surprisePool);
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
      // Defer all AsyncStorage reads until AFTER the navigation
      // transition animation is fully complete (prevents JS thread jank)
      const task = InteractionManager.runAfterInteractions(() => {
        getRecentGames().then(setRecentGames);
        getFavoriteGames().then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))));
        getUserRatings().then(setUserRatingsMap);

        if (games.length === 0) {
          fetchHomeData(false);
        }
      });
      return () => task.cancel();
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

  // Removed availableCategories dynamic logic for home screen to save processing, just use liveCategories
  const displayCategoryChips = useMemo(() => {
    return liveCategories.map((c) => ({
      id: c.id,
      title: c.title,
      icon: c.icon || 'game-controller-outline',
      themeColor: c.themeColor || theme.primary,
    }));
  }, [liveCategories, theme]);

  const handleToggleFav = async (game) => {
    const updated = await toggleFavoriteGame(game);
    setFavoriteIds(new Set(updated.map((f) => f.id)));
  };

  const handlePlayGame = (game) => {
    handlePlayGameWithAd(navigation, game);
  };


  // Featured & Popular now come directly from state


  const handleSurprise = useCallback(() => {
    const pool = games;
    if (pool.length === 0) return;
    const randomGame = pool[Math.floor(Math.random() * pool.length)];
    navigation.navigate('Game', { game: randomGame });
  }, [games, navigation]);

  return (
    <AppLayout
      title={
        <View style={styles.brandHeaderRow}>
          <Image
            source={require('../../assets/react-logo.png')}
            style={{ aspectRatio: 1 / 1, width: 64 }}
            resizeMode="contain"

          />
          <View style={{ justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.headerTitleMain, { color: theme.text }]}>{t('game')}</Text>
              <Text style={[styles.headerTitleAccent, { color: theme.primary }]}>{t('arcade')}</Text>
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
        {loading ? (
          <HomeScreenSkeleton />
        ) : (featuredGames.length === 0 && popularGamesList.length === 0) ? (
          <View style={styles.emptyContainer}>
            <SafeIcon name="game-controller-outline" size={48} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_games_available')}</Text>
            <AnimatedTouch
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={() => fetchHomeData(true)}
            >
              <Text style={[styles.retryBtnText, { color: theme.onPrimary }]}>{t('retry_loading_games')}</Text>
            </AnimatedTouch>
          </View>
        ) : (
          <>
            {/* Section 1: Continue Playing Horizontal Carousel */}
            {recentGames.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('continue_playing')}</Text>

                  <AnimatedTouch
                    onPress={() => navigation.navigate('ContinuePlaying')}
                    style={[styles.chevronBtn]}
                  >
                    <SafeIcon name="chevron-forward" size={20} color={theme.primary} />
                  </AnimatedTouch>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10, marginHorizontal: -20 }}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  scrollEventThrottle={16}
                >
                  {recentGames.slice(0, 10).map((game) => {
                    const duration = game.durationMs || 0;
                    const progress = duration > 0 ? Math.min(100, Math.max(15, Math.round((duration / 300000) * 100))) : 15;
                    return (
                      <GameGridCard
                        key={game.id}
                        game={game}
                        variant="continuePlaying"
                        cardWidth={(SCREEN_WIDTH - 48) / 2}
                        marginRight={12}
                        imageHeight={125}
                        progressPercent={progress}
                        onPress={() => handlePlayGame(game)}
                      />
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Section 2: Horizontal Category Badges */}
            {displayCategoryChips.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('browse_genres')}</Text>
                  <AnimatedTouch
                    onPress={() => navigation.navigate('Categories')}
                    style={[styles.chevronBtn]}
                  >
                    <SafeIcon name="chevron-forward" size={20} color={theme.primary} />
                  </AnimatedTouch>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10, marginHorizontal: -20 }}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  scrollEventThrottle={16}
                >
                  {displayCategoryChips.slice(0, 10).map((cat) => (
                    <GenreCard
                      key={cat.id}
                      item={cat}
                      variant="small"
                      cardWidth={120}
                      style={{ marginRight: 12 }}
                      onPress={(item) => {
                        navigation.navigate('Browse', { category: item.title, categoryObj: item });
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Surprise Me Card */}
            {(featuredGames.length > 0 || popularGamesList.length > 0) && (
              <SurpriseMeCard
                onPress={handleSurprise}
                style={{ marginHorizontal: 0, marginTop: 4, marginBottom: 18 }}
              />
            )}

            {/* Section 3: Featured Games Horizontal Carousel */}
            {featuredGames.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('featured_games')}</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 10, marginHorizontal: -20 }}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  scrollEventThrottle={16}
                >
                  {featuredGames.slice(0, 10).map((game) => {
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
                  {popularGamesList.slice(0, 10).map((game, index) => {
                    const tagText = (game.tags && game.tags.length > 0) ? game.tags[0] : (game.category === 'Action' ? (t('shooter') || 'Shooter') : (t('arcade') || 'Arcade'));
                    const subText = `${game.category || 'Arcade'} • ${tagText}`;

                    return (
                      <GameListCard
                        key={game.id}
                        game={game}
                        rankNumber={index + 1}
                        useTextPlayBtn={true}
                        subText={subText}
                        onPress={() => handlePlayGame(game)}
                      />
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
        <SafeBannerAd />
      </View>
    </AppLayout>
  );
}

import styles from '../styles/HomeScreen.styles.js';
