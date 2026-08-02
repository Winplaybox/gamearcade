import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableWithoutFeedback,
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
  getAvailableSubCategoriesForGames,
} from '../services/gameService';
import { getFavoriteGames, toggleFavoriteGame } from '../storage/favoritesStorage';
import {
  getRecentGames,
  removeRecentGame,
  removeMultipleRecentGames,
  clearAllRecentGames,
  formatTimeAgo,
  formatDuration,
} from '../storage/recentGamesStorage';
import { getUserRatings } from '../storage/ratingsStorage';

const SORT_OPTIONS = [
  { id: 'popularity', labelKey: 'popularity', fallback: 'Popularity' },
  { id: 'rating', labelKey: 'top_rated', fallback: 'Top Rated' },
  { id: 'newest', labelKey: 'newest', fallback: 'Newest' },
  { id: 'last_played', labelKey: 'last_played', fallback: 'Last Played' },
];

const SESSION_PRESETS = [
  { id: 'all', labelKey: 'all_categories', readout: 'All session lengths' },
  { id: 'quick', labelKey: 'quick_hit', readout: 'Short sessions · 5m to 15m' },
  { id: 'medium', labelKey: 'medium_session', readout: 'Medium sessions · 15m to 45m' },
  { id: 'deep', labelKey: 'deep_dive', readout: 'Long sessions · 45m to 2+ hours' },
];

export default function BrowseScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const routeCategory = route?.params?.category || 'All';
  const routeFilter = route?.params?.filter || null;
  const routeTitle = route?.params?.title || null;

  const [games, setGames] = useState([]);
  const [liveCategories, setLiveCategories] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderSearching, setIsHeaderSearching] = useState(false);

  // Filter Drawer State
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedMultiCategories, setSelectedMultiCategories] = useState(new Set());
  const [sessionLengthPreset, setSessionLengthPreset] = useState('all');

  const [selectedCategory, setSelectedCategory] = useState(routeCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [userRatingsMap, setUserRatingsMap] = useState({});

  // Multi-selection state for Continue Playing screen
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const isRecentScreen = routeFilter === 'recent';

  useEffect(() => {
    if (routeCategory) {
      setSelectedCategory(routeCategory);
      setSelectedSubCategory('All');
    }
  }, [routeCategory]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [liveList, categoriesList] = await Promise.all([
        getLiveGamesList(),
        getLiveCategoriesList(),
      ]);
      setGames(liveList);
      setLiveCategories(categoriesList);
      setLoading(false);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getFavoriteGames().then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))));
      getRecentGames().then(setRecentGames);
      getUserRatings().then(setUserRatingsMap);
    }, [])
  );

  useEffect(() => {
    if (isRecentScreen && !loading && recentGames.length === 0) {
      const timer = setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Home');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isRecentScreen, loading, recentGames, navigation]);

  const availableCategories = useMemo(() => {
    return getAvailableCategoriesForGames(games, liveCategories);
  }, [games, liveCategories]);

  const displayCategoryPills = useMemo(() => {
    const list = [{ id: 'all', title: t('all_categories') || 'All', icon: 'apps-outline', themeColor: theme.primary }];
    availableCategories.forEach((c) => {
      list.push({
        id: c.id,
        title: c.title,
        icon: c.icon || 'game-controller-outline',
        themeColor: c.themeColor || theme.primary,
        subCategories: c.subCategories || [],
      });
    });
    return list;
  }, [availableCategories, theme, t]);

  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') return null;
    return liveCategories.find(
      (c) => c.title.toLowerCase() === selectedCategory.toLowerCase() || c.id.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [liveCategories, selectedCategory]);

  const activeSubCategories = useMemo(() => {
    if (!activeCategoryObj || !activeCategoryObj.subCategories) return [];
    const availableSubs = getAvailableSubCategoriesForGames(games, activeCategoryObj.subCategories);
    if (availableSubs.length === 0) return [];
    return [{ id: 'all', title: t('all_categories') || 'All' }, ...availableSubs];
  }, [activeCategoryObj, games, t]);

  const handleToggleFav = async (game) => {
    const updated = await toggleFavoriteGame(game);
    setFavoriteIds(new Set(updated.map((f) => f.id)));
  };

  const handleRemoveRecent = (game) => {
    Alert.alert(
      t('remove_favorite_title') || 'Remove from History',
      `Remove "${game.title}" from your continue playing list?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            const updated = await removeRecentGame(game.id);
            setRecentGames(updated);
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
    if (selectedIds.size === recentGames.length) {
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else {
      setSelectedIds(new Set(recentGames.map((g) => g.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      t('clear_all_favorites_title') || 'Delete Selected Games',
      `Are you sure you want to remove ${selectedIds.size} game(s) from your history?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = await removeMultipleRecentGames(Array.from(selectedIds));
            setRecentGames(updated);
            setSelectedIds(new Set());
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const handleClearAllHistory = () => {
    Alert.alert(
      t('clear_all_favorites_title') || 'Clear All History',
      t('clear_all_favorites_msg') || 'Are you sure you want to remove all games from your continue playing list?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear_all') || 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const updated = await clearAllRecentGames();
            setRecentGames(updated);
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

  const handleToggleMultiCategory = (catTitle) => {
    setSelectedMultiCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catTitle)) next.delete(catTitle);
      else next.add(catTitle);
      return next;
    });
  };

  const handleClearAllFilters = () => {
    setSortBy('popularity');
    setSelectedMultiCategories(new Set());
    setSessionLengthPreset('all');
    setSelectedCategory('All');
    setSelectedSubCategory('All');
  };

  const filteredGames = useMemo(() => {
    let result = games;

    if (isRecentScreen) {
      return recentGames;
    } else if (routeFilter === 'featured') {
      result = result.filter((g) => g.isFeatured || g.status === 'approved');
    }

    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter((g) => g.category && g.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (selectedMultiCategories.size > 0) {
      result = result.filter((g) => g.category && selectedMultiCategories.has(g.category));
    }

    if (selectedSubCategory && selectedSubCategory !== 'All') {
      result = result.filter(
        (g) =>
          (g.subCategory && g.subCategory.toLowerCase() === selectedSubCategory.toLowerCase()) ||
          (g.tags && Array.isArray(g.tags) && g.tags.includes(selectedSubCategory)) ||
          (g.title && g.title.toLowerCase().includes(selectedSubCategory.toLowerCase()))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          (g.title && g.title.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q)) ||
          (g.subCategory && g.subCategory.toLowerCase().includes(q))
      );
    }

    // Sort options
    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => parseFloat(b.rating || 4.5) - parseFloat(a.rating || 4.5));
    } else if (sortBy === 'newest') {
      result = [...result].reverse();
    }

    return result;
  }, [games, recentGames, isRecentScreen, routeFilter, selectedCategory, selectedMultiCategories, selectedSubCategory, searchQuery, sortBy]);

  const pageTitle = isRecentScreen
    ? selectionMode
      ? `Selected (${selectedIds.size})`
      : routeTitle || t('continue_playing')
    : routeTitle || (selectedCategory !== 'All' ? selectedCategory : t('tab_browse'));

  const isFilterActive = selectedMultiCategories.size > 0 || sortBy !== 'popularity' || sessionLengthPreset !== 'all';

  const headerRightAction = isRecentScreen ? (
    selectionMode ? (
      <View style={styles.headerActionRow}>
        <TouchableOpacity onPress={handleSelectAllToggle} style={styles.headerIconBtn} activeOpacity={0.7}>
          <SafeIcon
            name={selectedIds.size === recentGames.length ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
            size={24}
            color={theme.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteSelected}
          style={[styles.headerIconBtn, { marginLeft: 8 }]}
          activeOpacity={0.7}
        >
          <SafeIcon name="trash-outline" size={22} color="#E94560" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSelectionMode(false);
            setSelectedIds(new Set());
          }}
          style={[styles.headerIconBtn, { marginLeft: 8 }]}
          activeOpacity={0.7}
        >
          <SafeIcon name="close" size={22} color={theme.subText} />
        </TouchableOpacity>
      </View>
    ) : recentGames.length > 0 ? (
      <TouchableOpacity onPress={handleClearAllHistory} style={styles.headerClearAllBtn} activeOpacity={0.7}>
        <SafeIcon name="trash-outline" size={16} color="#E94560" style={{ marginRight: 4 }} />
        <Text style={[styles.headerClearAllText, { color: '#E94560' }]}>{t('clear_all')}</Text>
      </TouchableOpacity>
    ) : null
  ) : (
    <TouchableOpacity
      style={styles.headerIconBtn}
      onPress={() => setFilterDrawerVisible(true)}
      activeOpacity={0.7}
    >
      <SafeIcon name="options-outline" size={22} color={isFilterActive ? theme.primary : theme.text} />
      {isFilterActive && <View style={styles.activeFilterDot} />}
    </TouchableOpacity>
  );

  return (
    <AppLayout
      title={pageTitle}
      showBack={!!routeTitle || routeCategory !== 'All'}
      rightAction={headerRightAction}
      showSearchBtn={!isRecentScreen}
      isHeaderSearching={isHeaderSearching}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onOpenSearch={() => setIsHeaderSearching(true)}
      onCloseSearch={() => {
        setIsHeaderSearching(false);
        setSearchQuery('');
      }}
      currentTab="Browse"
      navigation={navigation}
      scrollable={false}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {!routeFilter && (
          <View style={{ marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 42 }}>
              {displayCategoryPills.map((cat) => {
                const isSelected = selectedCategory === cat.title;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catPill,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.cardBg,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat.title);
                      setSelectedSubCategory('All');
                    }}
                    activeOpacity={0.8}
                  >
                    <SafeIcon
                      name={cat.icon}
                      size={14}
                      color={isSelected ? '#ffffff' : cat.themeColor}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.catPillText, { color: isSelected ? '#ffffff' : theme.text }]}>
                      {cat.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {activeSubCategories.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 34 }}>
                  {activeSubCategories.map((sub) => {
                    const isSubSelected = selectedSubCategory === sub.title;
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        style={[
                          styles.subCatPill,
                          {
                            backgroundColor: isSubSelected ? 'rgba(233,69,96,0.2)' : theme.subBg,
                            borderColor: isSubSelected ? theme.primary : theme.border,
                          },
                        ]}
                        onPress={() => setSelectedSubCategory(sub.title)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.subCatPillText,
                            { color: isSubSelected ? theme.primary : theme.subText, fontWeight: isSubSelected ? '700' : '500' },
                          ]}
                        >
                          {sub.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : isRecentScreen ? (
          <FlatList
            data={filteredGames}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <SafeIcon name="time-outline" size={54} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_recently_played')}</Text>
                <Text style={[styles.emptySubText, { color: theme.subText }]}>{t('redirecting_home')}</Text>
                <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 14 }} />
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);
              const userRating = userRatingsMap[item.id]?.rating;
              const ratingScore = userRating ? `${userRating}.0` : (item.rating || '4.6');

              const timeAgoStr = formatTimeAgo(item.timestamp);
              const durationStr = formatDuration(item.durationMs);

              return (
                <GameListCard
                  key={item.id}
                  game={item}
                  ratingScore={ratingScore}
                  subText={`${item.category || 'Arcade'} • ★ ${ratingScore}`}
                  timeStampText={`${timeAgoStr} • Played for ${durationStr}`}
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
                    else handleRemoveRecent(item);
                  }}
                />
              );
            }}
          />
        ) : (
          <FlatList
            data={filteredGames}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <SafeIcon name="game-controller-outline" size={48} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_games')}</Text>
              </View>
            }
            ListFooterComponent={
              filteredGames.length > 0 ? (
                <View style={styles.moreComingContainer}>
                  <View style={[styles.sparkleIconBox, { backgroundColor: 'rgba(233,69,96,0.12)' }]}>
                    <SafeIcon name="sparkles" size={24} color="#E94560" />
                  </View>
                  <Text style={[styles.moreComingTitle, { color: theme.text }]}>{t('more_coming_soon')}</Text>
                  <Text style={[styles.moreComingSub, { color: theme.subText }]}>
                    {t('more_coming_sub')}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const isFav = favoriteIds.has(item.id);
              const userRating = userRatingsMap[item.id]?.rating;
              const ratingScore = userRating ? `${userRating}.0` : (item.rating || '4.6');
              return (
                <GameGridCard
                  key={item.id}
                  game={item}
                  isFavorite={isFav}
                  ratingScore={ratingScore}
                  onPress={() => handlePlayGame(item)}
                  onFavToggle={handleToggleFav}
                />
              );
            }}
          />
        )}
      </View>

      {/* Refine Games Filter BottomSheet Drawer Modal matching reference image */}
      <Modal
        visible={filterDrawerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterDrawerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterDrawerVisible(false)}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.sheetContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                {/* Top Handle Bar */}
                <View style={styles.sheetHandleBar} />

                {/* Header Row */}
                <View style={styles.sheetHeaderRow}>
                  <Text style={[styles.sheetTitleText, { color: theme.text }]}>{t('refine_games')}</Text>
                  <TouchableOpacity onPress={() => setFilterDrawerVisible(false)} style={{ padding: 4 }}>
                    <SafeIcon name="close" size={22} color={theme.subText} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                  {/* Sort By Section (2x2 Grid of Chips) */}
                  <Text style={[styles.drawerSectionLabel, { color: theme.subText }]}>{t('sort_by')}</Text>
                  <View style={styles.sortGridRow}>
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.sortChip,
                            {
                              backgroundColor: isSelected ? 'rgba(233,69,96,0.18)' : theme.subBg,
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                          onPress={() => setSortBy(opt.id)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.sortChipText,
                              { color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? '700' : '500' },
                            ]}
                          >
                            {t(opt.labelKey) || opt.fallback} {isSelected ? '✓' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Categories Multi-Select Wrap Section */}
                  <Text style={[styles.drawerSectionLabel, { color: theme.subText, marginTop: 18 }]}>
                    {t('categories')}
                  </Text>
                  <View style={styles.categoriesWrapRow}>
                    {availableCategories.map((c) => {
                      const isSelected = selectedMultiCategories.has(c.title);
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.categoryFilterChip,
                            {
                              backgroundColor: isSelected ? theme.primary : theme.subBg,
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                          onPress={() => handleToggleMultiCategory(c.title)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.categoryFilterChipText,
                              { color: isSelected ? '#ffffff' : theme.text, fontWeight: isSelected ? '700' : '500' },
                            ]}
                          >
                            {c.title} {isSelected ? '✓' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Session Length Range Section */}
                  <View style={styles.sessionHeaderRow}>
                    <Text style={[styles.drawerSectionLabel, { color: theme.subText }]}>{t('session_length')}</Text>
                    {sessionLengthPreset !== 'all' && (
                      <View style={[styles.activePillTag, { backgroundColor: 'rgba(233,69,96,0.15)' }]}>
                        <Text style={[styles.activePillText, { color: theme.primary }]}>{t('active')}</Text>
                      </View>
                    )}
                  </View>

                  {/* Glass Card Container for Session Length Slider presets */}
                  <View style={[styles.sessionGlassCard, { backgroundColor: theme.subBg, borderColor: theme.border }]}>
                    <View style={styles.sliderReadoutRow}>
                      <Text style={[styles.sliderEndpointText, { color: theme.text }]}>{t('quick_hit')}</Text>
                      <Text style={[styles.sliderEndpointText, { color: theme.text }]}>{t('deep_dive')}</Text>
                    </View>

                    <View style={styles.sliderTrackLineContainer}>
                      <View style={[styles.sliderTrackLine, { backgroundColor: theme.border }]} />
                      <View style={[styles.sliderTrackFill, { backgroundColor: theme.primary }]} />
                      <View style={[styles.sliderThumbCircle, { left: '25%', backgroundColor: theme.primary }]} />
                      <View style={[styles.sliderThumbCircle, { left: '75%', backgroundColor: theme.primary }]} />
                    </View>

                    {/* Presets Selection */}
                    <View style={styles.presetPillsRow}>
                      {SESSION_PRESETS.map((preset) => {
                        const isSelected = sessionLengthPreset === preset.id;
                        return (
                          <TouchableOpacity
                            key={preset.id}
                            style={[
                              styles.sessionPresetBtn,
                              {
                                backgroundColor: isSelected ? theme.primary : 'transparent',
                                borderColor: isSelected ? theme.primary : theme.border,
                              },
                            ]}
                            onPress={() => setSessionLengthPreset(preset.id)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.sessionPresetText,
                                { color: isSelected ? '#ffffff' : theme.subText, fontWeight: isSelected ? '700' : '500' },
                              ]}
                            >
                              {t(preset.labelKey) || preset.id}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={[styles.sessionReadoutSubText, { color: theme.primary }]}>
                      {SESSION_PRESETS.find((p) => p.id === sessionLengthPreset)?.readout || '15 min - 2+ hours'}
                    </Text>
                  </View>
                </ScrollView>

                {/* Sticky Footer Bar */}
                <View style={[styles.sheetFooterRow, { borderTopColor: theme.border }]}>
                  <TouchableOpacity onPress={handleClearAllFilters} style={styles.clearAllBtn} activeOpacity={0.7}>
                    <Text style={[styles.clearAllBtnText, { color: theme.subText }]}>{t('clear_all')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                    onPress={() => setFilterDrawerVisible(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.applyBtnText}>{t('apply_changes')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    height: 36,
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subCatPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
    height: 30,
    justifyContent: 'center',
  },
  subCatPillText: {
    fontSize: 12,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 6,
    position: 'relative',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E94560',
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
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  gridContent: {
    paddingBottom: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubText: {
    fontSize: 12,
    marginTop: 4,
  },
  moreComingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  sparkleIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  moreComingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  moreComingSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sheetHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitleText: {
    fontSize: 20,
    fontWeight: '800',
  },
  drawerSectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  sortGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sortChip: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  sortChipText: {
    fontSize: 13,
  },
  categoriesWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryFilterChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryFilterChipText: {
    fontSize: 12,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  activePillTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  sessionGlassCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  sliderReadoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sliderEndpointText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sliderTrackLineContainer: {
    height: 24,
    justifyContent: 'center',
    marginVertical: 4,
    position: 'relative',
  },
  sliderTrackLine: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  sliderTrackFill: {
    position: 'absolute',
    left: '25%',
    width: '50%',
    height: 4,
    borderRadius: 2,
  },
  sliderThumbCircle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    marginTop: -7,
  },
  presetPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  sessionPresetBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
  },
  sessionPresetText: {
    fontSize: 11,
  },
  sessionReadoutSubText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  sheetFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 12,
  },
  clearAllBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  clearAllBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
