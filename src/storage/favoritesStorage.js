import { auth, PHP_API_BASE_URL } from '../config/firebase';

export async function getFavoriteGames() {
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const response = await fetch(`${PHP_API_BASE_URL}?type=get_favorites&userId=${uid}`);
      if (response.ok) {
        return await response.json();
      }
    }
  } catch (e) {
    console.warn('Fetch favorites error:', e);
  }
  return [];
}

export async function toggleFavoriteGame(game) {
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const response = await fetch(PHP_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'toggle_favorite',
          userId: uid,
          gameId: game.id
        })
      });
      if (response.ok) {
        return await response.json(); // Returns updated favorites list
      }
    }
  } catch (e) {
    console.warn('Toggle favorite error:', e);
  }
  return getFavoriteGames();
}

export async function isGameFavorite(gameId) {
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const response = await fetch(`${PHP_API_BASE_URL}?type=is_favorite&userId=${uid}&gameId=${gameId}`);
      if (response.ok) {
        const data = await response.json();
        return data.isFavorite;
      }
    }
  } catch (e) {
    console.warn('Check favorite error:', e);
  }
  return false;
}

export async function removeMultipleFavoriteGames(gameIds) {
  if (!gameIds || gameIds.length === 0) return await getFavoriteGames();
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await fetch(PHP_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'remove_multiple_favorites',
          userId: uid,
          gameIds: gameIds
        })
      });
    }
  } catch (e) {
    console.warn('Remove multiple favorites error:', e);
  }
  return getFavoriteGames();
}

export async function clearAllFavoriteGames() {
  // Clearing favorites happens from the PHP backend via reset_profile, 
  // but if needed explicitly here, we could add a clear_favorites endpoint.
  // For now, this is handled via Settings reset.
  return [];
}
