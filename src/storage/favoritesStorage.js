import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'gamearcade_favorites_v1';

export async function getFavoriteGames() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function toggleFavoriteGame(game) {
  try {
    const favorites = await getFavoriteGames();
    const existsIndex = favorites.findIndex((f) => f.id === game.id);

    let updated = [];
    if (existsIndex !== -1) {
      updated = favorites.filter((f) => f.id !== game.id);
    } else {
      updated = [game, ...favorites];
    }

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return getFavoriteGames();
  }
}

export async function isGameFavorite(gameId) {
  try {
    const favorites = await getFavoriteGames();
    return favorites.some((f) => f.id === gameId);
  } catch (e) {
    return false;
  }
}
