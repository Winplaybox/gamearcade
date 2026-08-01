import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_GAMES_KEY = 'gamearcade_recent_games_v1';
const MAX_RECENT_GAMES = 20;

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
    const existingGame = existing.find((g) => g.id === game.id);
    const filtered = existing.filter((g) => g.id !== game.id);

    const now = Date.now();
    const gameWithTime = {
      ...game,
      startTime: now,
      lastPlayedTime: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lastPlayedDate: new Date(now).toLocaleDateString(),
      timestamp: now,
      durationMs: existingGame?.durationMs || 0,
    };
    const updated = [gameWithTime, ...filtered].slice(0, MAX_RECENT_GAMES);
    await AsyncStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export async function updateRecentGameSession(gameId, durationMs) {
  if (!gameId) return;
  try {
    const existing = await getRecentGames();
    const updated = existing.map((g) => {
      if (g.id === gameId) {
        const newDuration = (g.durationMs || 0) + durationMs;
        return { ...g, durationMs: newDuration };
      }
      return g;
    });
    await AsyncStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export async function removeRecentGame(gameId) {
  if (!gameId) return [];
  try {
    const existing = await getRecentGames();
    const updated = existing.filter((g) => g.id !== gameId);
    await AsyncStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export async function removeMultipleRecentGames(gameIds) {
  if (!gameIds || gameIds.length === 0) return [];
  try {
    const existing = await getRecentGames();
    const idsSet = new Set(gameIds);
    const updated = existing.filter((g) => !idsSet.has(g.id));
    await AsyncStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export async function clearAllRecentGames() {
  try {
    await AsyncStorage.removeItem(RECENT_GAMES_KEY);
    return [];
  } catch (e) {
    return [];
  }
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - timestamp;
  const minsAgo = Math.floor(diffMs / 60000);
  if (minsAgo < 1) return 'Just now';
  if (minsAgo < 60) return `${minsAgo} min${minsAgo > 1 ? 's' : ''} ago`;
  const hoursAgo = Math.floor(minsAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo} hr${hoursAgo > 1 ? 's' : ''} ago`;
  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
}

export function formatDuration(durationMs) {
  if (!durationMs || durationMs < 1000) return 'Less than 1 min';
  const totalMins = Math.round(durationMs / 60000);
  if (totalMins < 1) return 'Less than 1 min';
  if (totalMins < 60) return `${totalMins} min${totalMins > 1 ? 's' : ''}`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
