import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_GAMES_KEY = 'gamearcade_recent_games_v1';
const MAX_RECENT_GAMES = 10;

export async function getRecentGames() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_GAMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function addRecentGame(game) {
  if (!game || !game.id) return;
  try {
    const existing = await getRecentGames();
    const filtered = existing.filter((g) => g.id !== game.id);
    const updated = [game, ...filtered].slice(0, MAX_RECENT_GAMES);
    await AsyncStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}
