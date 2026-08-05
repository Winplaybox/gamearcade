import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Dimensions,
} from 'react-native';
import AnimatedTouch from '../components/AnimatedTouch';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import SafeBannerAd from '../components/ui/SafeBannerAd';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import {
  getLiveCategoriesList,
  getAvailableCategoriesForGames,
} from '../services/gameService';
import { CategoryGridSkeletonList } from '../components/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import GenreCard from '../components/GenreCard';

export default function CategoriesScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [categories, setCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cats, available] = await Promise.all([
        getLiveCategoriesList(),
        getAvailableCategoriesForGames(),
      ]);
      setCategories(cats);
      setAvailableCategories(available);
      setLoading(false);
    })();
  }, []);

  const filteredCategories = useMemo(() => {
    if (availableCategories.length === 0) return categories;
    return categories.filter((c) => availableCategories.includes(c.title));
  }, [categories, availableCategories]);

  const listData = useMemo(() => {
    return [...filteredCategories, { id: 'more_genres_card', isMoreCard: true }];
  }, [filteredCategories]);

  const subtitleText =
    availableCategories.length > 0
      ? `${availableCategories.length} ${availableCategories.length === 1 ? 'genre' : 'genres'
      } available`
      : t('instant_games_sub');

  const handleCategoryPress = (category) => {
    navigation.navigate('Browse', {
      category: category.title,
      categoryObj: category,
      title: category.title,
    });
  };

  return (
    <AppLayout
      heroTitle={t('browse_genres')}
      heroSubtitle={subtitleText}
      showBack={true}
      navigation={navigation}
      scrollable={true}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {loading ? (
          <CategoryGridSkeletonList count={6} />
        ) : (
          <>
            <View style={styles.gridWrap}>
              {listData.map((item) => {
                if (item.isMoreCard) {
                  return null;
                }

                return (
                  <GenreCard
                    key={item.id}
                    item={item}
                    cardWidth={(SCREEN_WIDTH - 52) / 2}
                    style={{ marginBottom: 16 }}
                    onPress={handleCategoryPress}
                  />
                );
              })}
            </View>
            <AnimatedTouch
              style={[styles.bottomSuggestCard, { backgroundColor: theme.cardBg, borderColor: theme.border, width: '100%' }]}
              onPress={() => navigation.navigate('SubmitGame')}
            >
              <View style={styles.suggestIconBadge}>
                <SafeIcon name="rocket" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.suggestCardTitle, { color: theme.text }]}>{t('dont_see_favorite_genre')}</Text>
                <Text style={[styles.suggestCardSub, { color: theme.subText }]}>{t('submit_genre_feature')}</Text>
              </View>
              <SafeIcon name="chevron-forward" size={18} color={theme.subText} />
            </AnimatedTouch>
          </>
        )}
        <SafeBannerAd />
      </View>
    </AppLayout>
  );
}

import styles from '../styles/CategoriesScreen.styles.js';
