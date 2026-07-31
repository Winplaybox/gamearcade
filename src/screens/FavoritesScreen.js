import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { getFavoriteGames, toggleFavoriteGame } from '../storage/favoritesStorage';

const { width } = Dimensions.get('window');

export default function FavoritesScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [favorites, setFavorites] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getFavoriteGames().then(setFavorites);
    }, [])
  );

  const handleRemoveFav = async (game) => {
    const updated = await toggleFavoriteGame(game);
    setFavorites(updated);
  };

  const handlePlayGame = (game) => {
    navigation.navigate('Game', { game });
  };

  return (
    <AppLayout title={t('tab_favorites')} currentTab="Favorites" navigation={navigation} scrollable={false}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={54} color={theme.subText} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('no_favorites')}</Text>
              <Text style={[styles.emptySub, { color: theme.subText }]}>{t('no_favorites_sub')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.gameGridCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
              onPress={() => handlePlayGame(item)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: item.iconUrl }} style={styles.gameGridImage} />
              <TouchableOpacity
                style={styles.gridFavBtn}
                onPress={() => handleRemoveFav(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="heart" size={16} color="#e94560" />
              </TouchableOpacity>
              <View style={styles.gameGridMeta}>
                <Text style={[styles.gameGridTitle, { color: theme.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.gameGridSub, { color: theme.subText }]}>{item.category} • ★ {item.rating}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  gameGridCard: {
    width: (width - 44) / 2,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    marginRight: 12,
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
