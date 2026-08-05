import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  RefreshControl,
  Animated,
  InteractionManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AnimatedTouch from '../components/AnimatedTouch';
import AppLayout from '../components/AppLayout';
import SafeBannerAd from '../components/ui/SafeBannerAd';
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
import AppConfig from '../config/AppConfig';
import { handlePlayGameWithAd } from '../utils/adNavigation';
import { getFavoriteGames, toggleFavoriteGame } from '../storage/favoritesStorage';
import { getUserRatings } from '../storage/ratingsStorage';
import { getRecentGames, formatTimeAgo, formatDuration } from '../storage/recentGamesStorage';
import {
  GameGridSkeletonList,
  GameListSkeletonList,
  GameGridCardSkeleton,
} from '../components/SkeletonLoader';
import SurpriseMeCard from '../components/SurpriseMeCard';
import styles from '../styles/BrowseScreen.styles.js';



/**
 * Parse hex color to RGB components
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Darken a hex color by a factor (0–1)
 */
function darken(hex, factor = 0.55) {
  if (!hex || !hex.startsWith('#')) return hex;
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
  } catch (e) {
    return hex;
  }
}

const POPULARITY_OPTIONS = ['All', 'Most Popular', 'Trending', 'Newest'];
const RATING_OPTIONS = [
  { label: 'All Ratings', value: 0 },
  { label: '4.5+ ★', value: 4.5 },
  { label: '4.0+ ★', value: 4.0 },
  { label: '3.5+ ★', value: 3.5 },
];
const SESSION_LENGTH_OPTIONS = [
  { label: 'All Lengths', value: 'All' },
  { label: 'Quick (< 3m)', value: 'Quick' },
  { label: 'Medium (3-10m)', value: 'Medium' },
  { label: 'Long (10m+)', value: 'Long' },
];

export default function BrowseScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const routeFilter = route?.params?.filter;
  const routeTitle = route?.params?.title;
  const isRecentContext = routeFilter === 'recent';
  const routeCategory = route?.params?.category || route?.params?.selectedCategory || null;
  const isCategoryContext = !!routeCategory && !isRecentContext;

  const [paginatedGames, setPaginatedGames] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const fetchGames = useCallback(async (pageNum, reset = false, currentFilters = {}) => {
    if (!reset) setLoadingMore(true);
    
    const params = {
      page: pageNum,
      limit: AppConfig.PAGE_SIZE,
      search: currentFilters.search || searchQuery,
      category: isCategoryContext ? selectedCategory : (currentFilters.category || filterCategory),
      rating: currentFilters.rating || filterRating,
      sort: currentFilters.sort || filterPopularity
    };
    
    // Ignore category if "All"
    if (params.category === 'All') params.category = '';
    
    try {
      const liveList = await getLiveGamesList(params);
      
      if (reset) {
        setPaginatedGames(liveList);
      } else {
        setPaginatedGames(prev => {
          // Avoid duplicates by filtering out IDs already present
          const existingIds = new Set(prev.map(g => g.id));
          const newGames = liveList.filter(g => !existingIds.has(g.id));
          return [...prev, ...newGames];
        });
      }
      
      if (liveList.length < AppConfig.PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (e) {
      console.warn("Fetch games failed", e);
    } finally {
      setLoadingMore(false);
    }
  }, [searchQuery, filterCategory, filterRating, filterPopularity, isCategoryContext, selectedCategory]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    if (isRecentContext) {
      const recent = await getRecentGames();
      setRecentGames(recent);
    } else {
      const [categoriesList] = await Promise.all([
        getLiveCategoriesList(),
        fetchGames(1, true)
      ]);
      setLiveCategories(categoriesList);
    }
    setRefreshing(false);
  }, [isRecentContext, fetchGames]);

  // Search & Selected Category
  const [selectedCategory, setSelectedCategory] = useState(routeCategory);
  const [searchQuery, setSearchQuery] = useState('');

  // Smart Filter Modal Active State
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState(routeCategory || 'All');
  const [filterPopularity, setFilterPopularity] = useState('All');
  const [filterRating, setFilterRating] = useState(0);
  const [filterSessionLength, setFilterSessionLength] = useState('All');

  // Temporary Filter Modal State (Committed ONLY when user hits Apply)
  const [tempCategory, setTempCategory] = useState(routeCategory || 'All');
  const [tempPopularity, setTempPopularity] = useState('All');
  const [tempRating, setTempRating] = useState(0);
  const [tempSessionLength, setTempSessionLength] = useState('All');

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [userRatingsMap, setUserRatingsMap] = useState({});
  const [liveCategories, setLiveCategories] = useState([]);
  const [recentGames, setRecentGames] = useState([]);

  const handleOpenFilterModal = () => {
    setTempCategory(isCategoryContext && selectedCategory ? selectedCategory : filterCategory);
    setTempPopularity(filterPopularity);
    setTempRating(filterRating);
    setTempSessionLength(filterSessionLength);
    setCategoryDropdownVisible(false);
    setFilterModalVisible(true);
  };

  const handleApplyFilters = () => {
    setFilterCategory(tempCategory);
    setFilterPopularity(tempPopularity);
    setFilterRating(tempRating);
    setFilterSessionLength(tempSessionLength);
    setPage(1);
    setFilterModalVisible(false);
    
    // Trigger immediate fetch with new filters
    fetchGames(1, true, {
      category: tempCategory,
      sort: tempPopularity,
      rating: tempRating,
      search: searchQuery
    });
  };

  const handleResetFiltersInModal = () => {
    setTempCategory('All');
    setTempPopularity('All');
    setTempRating(0);
    setTempSessionLength('All');
  };

  // Sync category route param in real-time & load recent games or reset on tab tap
  useFocusEffect(
    useCallback(() => {
      const catParam = route?.params?.category || route?.params?.selectedCategory;
      const resetParam = route?.params?.reset;
      if (catParam) {
        setSelectedCategory(catParam);
        setFilterCategory(catParam);
        setTempCategory(catParam);
      } else if (!isRecentContext || resetParam) {
        setSelectedCategory(null);
        setFilterCategory('All');
        setTempCategory('All');
        setFilterPopularity('All');
        setTempPopularity('All');
        setFilterRating(0);
        setTempRating(0);
        setFilterSessionLength('All');
        setTempSessionLength('All');
        setSearchQuery('');
        setPage(1);
        if (!isRecentContext) fetchGames(1, true, { category: 'All', sort: 'All', rating: 0, search: '' });
      } else if (catParam) {
        setPage(1);
        fetchGames(1, true, { category: catParam });
      }
      // Defer AsyncStorage reads until after transition animation
      const task = InteractionManager.runAfterInteractions(() => {
        getFavoriteGames().then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))));
        getUserRatings().then(setUserRatingsMap);
        if (isRecentContext) {
          getRecentGames().then(setRecentGames);
        }
      });
      return () => task.cancel();
    }, [route?.params?.category, route?.params?.selectedCategory, route?.params?.reset, isRecentContext])
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (isRecentContext) {
        const recent = await getRecentGames();
        setRecentGames(recent);
      } else {
        await Promise.all([
          getLiveCategoriesList().then(setLiveCategories),
          fetchGames(1, true)
        ]);
      }
      setLoading(false);
    })();
  }, [isRecentContext]); // Intentionally leaving fetchGames out to avoid loops

  // Removed local filtering logic for availableCategories to save CPU, just use liveCategories
  const availableCategories = liveCategories;

  // Master Filtered Games is now completely server-side.
  const filteredGames = paginatedGames;

  // Filtered Recent Games list
  const filteredRecentGames = useMemo(() => {
    let list = [...recentGames];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (g) =>
          (g.title && g.title.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q))
      );
    }
    return list;
  }, [recentGames, searchQuery]);

  // Removed paginatedGames slicing, it's just filteredGames now

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchGames(nextPage, false);
  }, [hasMore, loadingMore, page, fetchGames]);

  const handleScroll = useCallback(
    (event) => {
      // Manual pagination check removed; handled by FlatList onEndReached
    },
    []
  );

  const handleToggleFav = useCallback(async (game) => {
    const updated = await toggleFavoriteGame(game);
    setFavoriteIds(new Set(updated.map((f) => f.id)));
  }, []);

  const handlePlayGame = useCallback((game) => {
    handlePlayGameWithAd(navigation, game);
  }, [navigation]);

  const handleSurprise = useCallback(() => {
    const pool = paginatedGames;
    if (pool.length === 0) return;
    const randomGame = pool[Math.floor(Math.random() * pool.length)];
    navigation.navigate('Game', { game: randomGame });
  }, [paginatedGames, navigation]);

  const renderGameItem = useCallback(
    ({ item }) => {
      const isFav = favoriteIds.has(item.id);
      const userRating = userRatingsMap[item.id]?.rating;
      const ratingScore = userRating ? `${userRating}.0` : item.rating || '4.6';
      return (
        <View key={item.id} style={{ width: '48%', marginBottom: 14 }}>
          <GameGridCard
            game={item}
            isFavorite={isFav}
            ratingScore={ratingScore}
            onPress={() => handlePlayGame(item)}
            onFavToggle={handleToggleFav}
          />
        </View>
      );
    },
    [favoriteIds, userRatingsMap, handlePlayGame, handleToggleFav]
  );

  const renderRecentItem = useCallback(
    ({ item }) => {
      const userRating = userRatingsMap[item.id]?.rating;
      const ratingScore = userRating ? `${userRating}.0` : item.rating || '4.6';
      const timeStampText = `${formatDuration(item.durationMs)} played • ${formatTimeAgo(item.timestamp)}`;
      return (
        <GameListCard
          key={item.id}
          game={item}
          subText={`${item.category || 'Arcade'} • ★ ${ratingScore}`}
          timeStampText={timeStampText}
          rightActionType="play"
          onPress={() => handlePlayGame(item)}
        />
      );
    },
    [userRatingsMap, handlePlayGame]
  );

  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory) return null;
    return liveCategories.find(
      (c) => c.title.toLowerCase() === selectedCategory.toLowerCase() || c.id.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [liveCategories, selectedCategory]);

  const headerTitle = isRecentContext
    ? routeTitle || t('continue_playing') || 'Continue Playing'
    : isCategoryContext && selectedCategory
      ? selectedCategory
      : t('tab_browse') || 'Browse Games';

  const handleBackHeader = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (isCategoryContext) {
      navigation.navigate('Categories');
    } else {
      navigation.navigate('Home');
    }
  };

  const [isSearchMode, setIsSearchMode] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const activeHeroTitle = isCategoryContext && selectedCategory
    ? selectedCategory
    : (headerTitle || 'Browse Games');

  const activeHeroSubtitle = isCategoryContext && selectedCategory
    ? `${filteredGames.length} titles ready to play`
    : 'Discover & play top titles';

  let activeHeroGradient = null;
  if (isCategoryContext && selectedCategory) {
    const themeColor = activeCategoryObj?.themeColor || '#6366F1';
    activeHeroGradient = [
      themeColor,
      darken(themeColor, 0.75),
      darken(themeColor, 0.45)
    ];
  }

  return (
    <AppLayout
      heroTitle={activeHeroTitle}
      heroSubtitle={activeHeroSubtitle}
      heroGradient={activeHeroGradient}
      heroTag={isCategoryContext && selectedCategory ? 'CATEGORY' : null}
      scrollY={scrollY}
      showBack={isCategoryContext || isRecentContext}
      onBack={handleBackHeader}
      showSearchBtn={true}
      isHeaderSearching={isSearchMode}
      searchQuery={searchQuery}
      onSearchChange={(q) => {
        setSearchQuery(q);
        if (window.searchTimeout) clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
          setPage(1);
          fetchGames(1, true, { search: q });
        }, 500);
      }}
      onSearchSubmit={(q) => {
        if (window.searchTimeout) clearTimeout(window.searchTimeout);
        setSearchQuery(q);
        setPage(1);
        fetchGames(1, true, { search: q });
      }}
      onOpenSearch={() => setIsSearchMode(true)}
      onCloseSearch={() => {
        setIsSearchMode(false);
        setSearchQuery('');
        setPage(1);
        fetchGames(1, true, { search: '' });
      }}
      rightAction={
        !isRecentContext && (
          <TouchableOpacity
            style={
              activeHeroGradient
                ? [
                  styles.circleIconBtn,
                  { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                ]
                : styles.headerIconBtn
            }
            onPress={handleOpenFilterModal}
            activeOpacity={0.7}
          >
            <SafeIcon name="options-outline" size={activeHeroGradient ? 20 : 22} color={theme.text} />
          </TouchableOpacity>
        )
      }
      currentTab={isCategoryContext || isRecentContext ? null : "Browse"}
      navigation={navigation}
      scrollable={true}
      onScroll={handleScroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
      flatListProps={{
        key: isRecentContext ? 'list' : 'grid',
        data: loading ? [] : (isRecentContext ? filteredRecentGames : paginatedGames),
        keyExtractor: (item) => item.id,
        numColumns: isRecentContext ? 1 : 2,
        columnWrapperStyle: isRecentContext ? undefined : styles.gridColumnWrapper,
        contentContainerStyle: [styles.container, { backgroundColor: theme.bg }],
        renderItem: isRecentContext ? renderRecentItem : renderGameItem,
        onEndReached: hasMore && !loadingMore && !isRecentContext ? handleLoadMore : null,
        onEndReachedThreshold: 0.5,
        removeClippedSubviews: true,
        initialNumToRender: 10,
        maxToRenderPerBatch: 10,
        windowSize: 5,
        ListHeaderComponent: (
          <>
            {!isRecentContext && !loading && paginatedGames.length > 0 && (
              <SurpriseMeCard
                category={selectedCategory}
                onPress={handleSurprise}
                style={{ width: '100%', marginHorizontal: 0, marginBottom: 16 }}
              />
            )}
          </>
        ),
        ListEmptyComponent: (
          <>
            {loading ? (
              isRecentContext ? <GameListSkeletonList count={6} /> : <GameGridSkeletonList count={8} />
            ) : isRecentContext && filteredRecentGames.length === 0 ? (
              <View style={[styles.emptySubmitCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.emptyIconCircle}>
                  <SafeIcon name="time-outline" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.emptySubmitTitle, { color: theme.text }]}>{t('no_recently_played_games')}</Text>
                <Text style={[styles.emptySubmitSub, { color: theme.subText }]}>
                  Play some games from the Home or Browse tab to see your history here!
                </Text>
              </View>
            ) : !isRecentContext && paginatedGames.length === 0 ? (
              <View style={[styles.emptySubmitCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.emptyIconCircle}>
                  <SafeIcon name="add-circle" size={32} color={theme.primary} />
                </View>
                <Text style={[styles.emptySubmitTitle, { color: theme.text }]}>{t('no_games_found')}</Text>
                <Text style={[styles.emptySubmitSub, { color: theme.subText }]}>{t('have_game_suggestion')}</Text>
                <TouchableOpacity
                  style={[styles.submitGenreBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation.navigate('SubmitGame', { initialCategory: selectedCategory })}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.submitGenreBtnText, { color: theme.onPrimary }]}>{t('submit_game_btn')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        ),
        ListFooterComponent: (
          <>
            {!isRecentContext && loadingMore && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8, marginBottom: 14 }}>
                <GameGridCardSkeleton />
                <GameGridCardSkeleton />
              </View>
            )}
            {!isRecentContext && !loading && !hasMore && paginatedGames.length > 0 && (
              <AnimatedTouch
                style={[styles.bottomSuggestCard, { backgroundColor: theme.cardBg, borderColor: theme.border, width: '100%' }]}
                onPress={() => navigation.navigate('SubmitGame', { initialCategory: selectedCategory })}
              >
                <View style={styles.suggestIconBadge}>
                  <SafeIcon name="rocket" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.suggestCardTitle, { color: theme.text }]}>{t('dont_see_favorite_game')}</Text>
                  <Text style={[styles.suggestCardSub, { color: theme.subText }]}>{t('submit_title_feature')}</Text>
                </View>
                <SafeIcon name="chevron-forward" size={18} color={theme.subText} />
              </AnimatedTouch>
            )}
            <SafeBannerAd />
          </>
        )
      }}
    >

      {/* Smart Contextual Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.sheetContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                {/* Modal Header */}
                <View style={styles.sheetHeaderRow}>
                  <Text style={[styles.sheetTitleText, { color: theme.text }]}>{t('sort_and_filter_title')}</Text>
                  <AnimatedTouch onPress={() => setFilterModalVisible(false)} style={{ padding: 4 }}>
                    <SafeIcon name="close" size={22} color={theme.subText} />
                  </AnimatedTouch>
                </View>

                <ScrollView showsVerticalScrollIndicator={true} indicatorStyle="white" style={{ maxHeight: 420 }}>
                  {/* 1. Categories Dropdown (ONLY SHOWN WHEN NOT IN A SPECIFIC CATEGORY CONTEXT) */}
                  {!isCategoryContext && (
                    <View style={styles.filterSection}>
                      <Text style={styles.sheetSectionLabel}>{t('category_upper')}</Text>
                      <AnimatedTouch
                        style={[styles.dropdownBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                        onPress={() => setCategoryDropdownVisible(!categoryDropdownVisible)}
                      >
                        <Text style={[styles.dropdownBtnText, { color: theme.text }]}>{tempCategory}</Text>
                        <SafeIcon
                          name={categoryDropdownVisible ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={theme.text}
                        />
                      </AnimatedTouch>

                      {categoryDropdownVisible && (
                        <View style={[styles.dropdownMenuBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                          <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                            <AnimatedTouch
                              style={[
                                styles.dropdownMenuItem,
                                tempCategory === 'All' && styles.dropdownMenuItemActive,
                              ]}
                              onPress={() => {
                                setTempCategory('All');
                                setCategoryDropdownVisible(false);
                              }}
                            >
                              <Text style={[styles.dropdownMenuItemText, { color: theme.text }]}>{t('all_categories')}</Text>
                            </AnimatedTouch>
                            {availableCategories.map((catObj) => (
                              <AnimatedTouch
                                key={catObj.id}
                                style={[
                                  styles.dropdownMenuItem,
                                  tempCategory === catObj.title && styles.dropdownMenuItemActive,
                                ]}
                                onPress={() => {
                                  setTempCategory(catObj.title);
                                  setCategoryDropdownVisible(false);
                                }}
                              >
                                <Text style={[styles.dropdownMenuItemText, { color: theme.text }]}>{catObj.title}</Text>
                              </AnimatedTouch>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}

                  {/* 2. Popularity Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.sheetSectionLabel}>{t('popularity_and_sort')}</Text>
                    <View style={styles.chipOptionRow}>
                      {POPULARITY_OPTIONS.map((popOpt) => {
                        const isSelected = tempPopularity === popOpt;
                        return (
                          <AnimatedTouch
                            key={popOpt}
                            style={[
                              styles.filterChipOption,
                              isSelected && styles.filterChipOptionSelected,
                              isSelected && { borderColor: theme.primary }
                            ]}
                            onPress={() => setTempPopularity(popOpt)}
                          >
                            <Text
                              style={[
                                styles.filterChipOptionText,
                                isSelected && styles.filterChipOptionTextSelected,
                                isSelected && { color: theme.primary }
                              ]}
                            >
                              {(() => {
                                switch (popOpt) {
                                  case 'All': return t('all') || 'All';
                                  case 'Most Popular': return t('most_popular') || 'Most Popular';
                                  case 'Trending': return t('trending') || 'Trending';
                                  case 'Newest': return t('newest') || 'Newest';
                                  default: return popOpt;
                                }
                              })()}
                            </Text>
                          </AnimatedTouch>
                        );
                      })}
                    </View>
                  </View>

                  {/* 3. Rating Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.sheetSectionLabel}>{t('minimum_rating_upper')}</Text>
                    <View style={styles.chipOptionRow}>
                      {RATING_OPTIONS.map((ratOpt) => {
                        const isSelected = tempRating === ratOpt.value;
                        return (
                          <AnimatedTouch
                            key={ratOpt.label}
                            style={[
                              styles.filterChipOption,
                              isSelected && styles.filterChipOptionSelected,
                              isSelected && { borderColor: theme.primary }
                            ]}
                            onPress={() => setTempRating(ratOpt.value)}
                          >
                            <Text
                              style={[
                                styles.filterChipOptionText,
                                isSelected && styles.filterChipOptionTextSelected,
                                isSelected && { color: theme.primary }
                              ]}
                            >
                              {(() => {
                                switch (ratOpt.value) {
                                  case 0: return t('all_ratings') || 'All Ratings';
                                  case 4.5: return t('rating_4_5') || '4.5+ ★';
                                  case 4.0: return t('rating_4_0') || '4.0+ ★';
                                  case 3.5: return t('rating_3_5') || '3.5+ ★';
                                  default: return ratOpt.label;
                                }
                              })()}
                            </Text>
                          </AnimatedTouch>
                        );
                      })}
                    </View>
                  </View>

                  {/* 4. Session Length Radio Buttons Group */}
                  <View style={styles.filterSection}>
                    <Text style={styles.sheetSectionLabel}>{t('session_length_upper')}</Text>
                    <View style={styles.chipOptionRow}>
                      {SESSION_LENGTH_OPTIONS.map((sessOpt) => {
                        const isSelected = tempSessionLength === sessOpt.value;
                        return (
                          <AnimatedTouch
                            key={sessOpt.value}
                            style={[
                              styles.filterChipOption,
                              isSelected && styles.filterChipOptionSelected,
                              { flexDirection: 'row', alignItems: 'center' },
                              isSelected && { borderColor: theme.primary }
                            ]}
                            onPress={() => setTempSessionLength(sessOpt.value)}
                          >
                            <Text
                              style={[
                                styles.filterChipOptionText,
                                isSelected && styles.filterChipOptionTextSelected,
                                isSelected && { color: theme.primary }
                              ]}
                            >
                              {(() => {
                                switch (sessOpt.value) {
                                  case 'All': return t('all_lengths') || 'All Lengths';
                                  case 'Quick': return t('session_quick') || 'Quick (< 3m)';
                                  case 'Medium': return t('session_medium') || 'Medium (3-10m)';
                                  case 'Long': return t('session_long') || 'Long (10m+)';
                                  default: return sessOpt.label;
                                }
                              })()}
                            </Text>
                          </AnimatedTouch>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>

                {/* Bottom Footer Buttons */}
                <View style={styles.sheetFooterRow}>
                  <AnimatedTouch
                    onPress={handleResetFiltersInModal}
                    style={styles.clearAllBtn}
                  >
                    <Text style={styles.clearAllBtnText}>{t('clear_all')}</Text>
                  </AnimatedTouch>

                  <AnimatedTouch
                    style={[styles.applyBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
                    onPress={handleApplyFilters}
                  >
                    <Text style={[styles.applyBtnText, { color: theme.onPrimary }]}>{t('apply_changes_check')}</Text>
                  </AnimatedTouch>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AppLayout>
  );
}
