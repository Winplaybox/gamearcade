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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { getLiveGamesList, getCategoriesFromGames } from '../services/gameService';
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

const { width } = Dimensions.get('window');

export default function BrowseScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const routeCategory = route?.params?.category || 'All';
  const routeFilter = route?.params?.filter || null;
  const routeTitle = route?.params?.title || null;

  const [games, setGames] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(routeCategory);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [userRatingsMap, setUserRatingsMap] = useState({});

  // Multi-selection state for Continue Playing screen
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    if (routeCategory) {
      setSelectedCategory(routeCategory);
    }
  }, [routeCategory]);

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

  // Refresh favorite state, recent games, and user ratings whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      getFavoriteGames().then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))));
      getRecentGames().then(setRecentGames);
      getUserRatings().then(setUserRatingsMap);
    }, [])
  );

  const handleToggleFav = async (game) => {
    const updated = await toggleFavoriteGame(game);
    setFavoriteIds(new Set(updated.map((f) => f.id)));
  };

  const handleRemoveRecent = (game) => {
    Alert.alert(
      'Remove from History',
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
      'Delete Selected Games',
      `Are you sure you want to remove ${selectedIds.size} game(s) from your history?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Delete',
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
      'Clear All History',
      'Are you sure you want to remove all games from your continue playing list?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Clear All',
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

  const isRecentScreen = routeFilter === 'recent';

  const filteredGames = useMemo(() => {
    let result = games;

    // Filter by routeFilter (recent or featured)
    if (isRecentScreen) {
      return recentGames;
    } else if (routeFilter === 'featured') {
      result = result.filter((g) => g.isFeatured || g.status === 'approved');
    }

    // Filter by selected category pill
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter((g) => g.category && g.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          (g.title && g.title.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q))
      );
    }
    return result;
  }, [games, recentGames, isRecentScreen, routeFilter, selectedCategory, searchQuery]);

  // Screen Title Calculation
  const pageTitle = isRecentScreen
    ? selectionMode
      ? `Selected (${selectedIds.size})`
      : routeTitle || t('continue_playing')
    : routeTitle || (selectedCategory !== 'All' ? selectedCategory : t('tab_browse'));

  // Header Right Action Buttons (Clear All / Double Tick Select All / Delete Selected)
  const headerRightAction = isRecentScreen ? (
    selectionMode ? (
      <View style={styles.headerActionRow}>
        {/* Double Tick Rounded Icon for Select All / Deselect All */}
        <TouchableOpacity onPress={handleSelectAllToggle} style={styles.headerIconBtn} activeOpacity={0.7}>
          <Ionicons
            name={selectedIds.size === recentGames.length ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'}
            size={24}
            color={theme.primary}
          />
        </TouchableOpacity>

        {/* Delete Selected Trash Icon */}
        <TouchableOpacity
          onPress={handleDeleteSelected}
          style={[styles.headerIconBtn, { marginLeft: 8 }]}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={22} color="#E94560" />
        </TouchableOpacity>

        {/* Cancel Selection Icon */}
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
    ) : recentGames.length > 0 ? (
      /* Clear All Button in Main Header */
      <TouchableOpacity onPress={handleClearAllHistory} style={styles.headerClearAllBtn} activeOpacity={0.7}>
        <Ionicons name="trash-outline" size={16} color="#E94560" style={{ marginRight: 4 }} />
        <Text style={[styles.headerClearAllText, { color: '#E94560' }]}>Clear All</Text>
      </TouchableOpacity>
    ) : null
  ) : null;

  return (
    <AppLayout
      title={pageTitle}
      showBack={!!routeTitle || routeCategory !== 'All'}
      rightAction={headerRightAction}
      currentTab="Browse"
      navigation={navigation}
      scrollable={false}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Search Bar (Hidden in Continue Playing Screen) */}
        {!isRecentScreen && (
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
        )}

        {/* Dynamic Category Filter Pills (Hidden in Recent / Custom Filter Screens) */}
        {!routeFilter && (
          <View style={{ height: 44, marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catPill,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.cardBg,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.catPillText, { color: isSelected ? '#ffffff' : theme.text }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Count Badge Header (Hidden in Continue Playing Screen) */}
        {!isRecentScreen && (
          <View style={styles.countHeader}>
            <Text style={[styles.countText, { color: theme.subText }]}>
              {filteredGames.length} {t('games_found')}
            </Text>
          </View>
        )}

        {/* Content View: Vertical List View for Continue Playing vs Grid View for Browse */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : isRecentScreen ? (
          /* Continue Playing Vertical List View with Played Duration & Card Highlight Selection */
          <FlatList
            data={filteredGames}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={54} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.text }]}>No recently played games yet.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.id);
              const userRating = userRatingsMap[item.id]?.rating;
              const ratingScore = userRating ? `${userRating}.0` : (item.rating || '4.6');

              const timeAgoStr = formatTimeAgo(item.timestamp);
              const durationStr = formatDuration(item.durationMs);

              return (
                <TouchableOpacity
                  style={[
                    styles.recentListItem,
                    {
                      backgroundColor: isSelected ? 'rgba(233,69,96,0.16)' : theme.cardBg,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => handlePlayGame(item)}
                  onLongPress={() => {
                    setSelectionMode(true);
                    handleToggleSelect(item.id);
                  }}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: item.iconUrl }} style={styles.recentItemImage} />

                  <View style={styles.recentItemMeta}>
                    <Text style={[styles.recentItemTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.recentItemCategory, { color: theme.subText }]}>
                      {item.category || 'Arcade'} • ★ {ratingScore}
                    </Text>
                    <Text style={[styles.recentTimeStamp, { color: theme.primary }]}>
                      🕒 {timeAgoStr} • Played for {durationStr}
                    </Text>
                  </View>

                  {/* Right side indicator: Selection tick when in selection mode, trash icon when normal */}
                  {selectionMode ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleToggleSelect(item.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={isSelected ? theme.primary : theme.subText}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleRemoveRecent(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={20} color="#E94560" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          /* 2-Column Games Grid */
          <FlatList
            data={filteredGames}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="game-controller-outline" size={48} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_games')}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isFav = favoriteIds.has(item.id);
              const userRating = userRatingsMap[item.id]?.rating;
              const ratingScore = userRating ? `${userRating}.0` : (item.rating || '4.6');
              return (
                <TouchableOpacity
                  style={[styles.gameGridCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                  onPress={() => handlePlayGame(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: item.iconUrl }} style={styles.gameCardImage} />
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
                        {ratingScore}
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
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  catPillText: {
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
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  gridContent: {
    paddingBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justify.content: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  recentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  recentItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  recentItemMeta: {
    flex: 1,
    marginLeft: 12,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recentItemCategory: {
    fontSize: 11,
    marginTop: 2,
  },
  recentTimeStamp: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  actionBtn: {
    padding: 8,
  },
  gameGridCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 110,
    position: 'relative',
  },
  gameCardImage: {
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
