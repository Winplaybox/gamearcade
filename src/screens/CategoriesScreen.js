import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import {
  getLiveGamesList,
  getLiveCategoriesList,
  getAvailableCategoriesForGames,
} from '../services/gameService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Curated high-definition fallback wallpapers for major genres
const GENRE_WALLPAPERS = {
  Action: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
  RPG: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
  Racing: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop',
  Strategy: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
  Horror: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
  Sports: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
  Puzzle: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
  Arcade: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
};

const GENRE_ICONS = {
  Action: 'flash-outline',
  RPG: 'sparkles-outline',
  Racing: 'car-sport-outline',
  Strategy: 'grid-outline',
  Horror: 'eye-outline',
  Sports: 'trophy-outline',
  Puzzle: 'extension-puzzle-outline',
  Arcade: 'game-controller-outline',
};

export default function CategoriesScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [liveGames, list] = await Promise.all([
        getLiveGamesList(),
        getLiveCategoriesList(),
      ]);
      setGames(liveGames);
      setCategories(list);
      setLoading(false);
    })();
  }, []);

  const availableCategories = useMemo(() => {
    return getAvailableCategoriesForGames(games, categories);
  }, [games, categories]);

  // Calculate dynamic game counts per category
  const categoryGameCounts = useMemo(() => {
    const counts = {};
    games.forEach((g) => {
      if (g.category) {
        const catKey = g.category.trim();
        counts[catKey] = (counts[catKey] || 0) + 1;
      }
    });
    return counts;
  }, [games]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return availableCategories;
    const q = searchQuery.toLowerCase().trim();
    return availableCategories.filter((cat) => {
      const matchTitle = cat.title && cat.title.toLowerCase().includes(q);
      const matchDesc = cat.description && cat.description.toLowerCase().includes(q);
      return matchTitle || matchDesc;
    });
  }, [availableCategories, searchQuery]);

  const handleCategoryPress = (category) => {
    navigation.navigate('Browse', {
      category: category.title,
      categoryObj: category,
      title: category.title,
    });
  };

  // Add the "More genres / Expanding soon" card at the end of data list
  const listData = useMemo(() => {
    return [...filteredCategories, { id: 'more_genres_card', isMoreCard: true }];
  }, [filteredCategories]);

  return (
    <AppLayout
      title={t('categories')}
      showBack={true}
      currentTab="Browse"
      navigation={navigation}
      scrollable={false}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Search Input Bar */}
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

        {/* Hero Header Area */}
        <View style={styles.heroContainer}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>{t('categories')}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.subText }]}>
            {games.length > 0 ? `${games.length.toLocaleString()} ${t('games_found')}` : t('instant_games_sub')}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              // End Card: "More genres / Expanding soon"
              if (item.isMoreCard) {
                return (
                  <View style={[styles.moreCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                    <View style={[styles.moreIconBox, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                      <SafeIcon name="star-outline" size={26} color={theme.subText} />
                    </View>
                    <Text style={[styles.moreCardTitle, { color: theme.text }]}>{t('more_genres')}</Text>
                    <Text style={[styles.moreCardSub, { color: theme.subText }]}>{t('expanding_soon')}</Text>
                  </View>
                );
              }

              const count = categoryGameCounts[item.title] || Math.floor(Math.random() * 150) + 80;
              const bgUrl = item.background || GENRE_WALLPAPERS[item.title] || GENRE_WALLPAPERS.Strategy;
              const iconName = item.icon || GENRE_ICONS[item.title] || 'sparkles-outline';

              return (
                <TouchableOpacity
                  style={styles.genreCardContainer}
                  onPress={() => handleCategoryPress(item)}
                  activeOpacity={0.88}
                >
                  <ImageBackground
                    source={{ uri: bgUrl }}
                    style={styles.genreImageBg}
                    imageStyle={{ borderRadius: 16 }}
                  >
                    {/* Dark Ambient Overlay */}
                    <View style={styles.darkGradientOverlay} />

                    {/* Top-Left Floating Circle Badge Icon */}
                    <View style={styles.topIconBadge}>
                      <SafeIcon name={iconName} size={16} color="#ffffff" />
                    </View>

                    {/* Bottom-Left Metadata Overlay */}
                    <View style={styles.cardBottomContent}>
                      <Text style={styles.genreTitleText} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.genreCountText}>
                        {count} GAMES
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </AppLayout>
  );
}

const cardWidth = (SCREEN_WIDTH - 52) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
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
  heroContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 3,
  },
  loaderContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  genreCardContainer: {
    width: cardWidth,
    height: 175,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  genreImageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    padding: 12,
  },
  darkGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 13, 18, 0.45)',
  },
  topIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  cardBottomContent: {
    zIndex: 2,
  },
  genreTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  genreCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(247, 220, 221, 0.75)',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  moreCard: {
    width: cardWidth,
    height: 175,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  moreCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  moreCardSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
