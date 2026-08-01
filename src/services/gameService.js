import { getApprovedGames as fetchFirestoreGames } from '../config/firebase';

/**
 * Dynamically fetches live approved games directly from Firebase Firestore database.
 */
export async function getLiveGamesList() {
  try {
    const liveGames = await fetchFirestoreGames();
    if (liveGames && Array.isArray(liveGames)) {
      return liveGames;
    }
  } catch (e) {
    console.warn('Failed to fetch live Firebase games:', e);
  }
  return [];
}

/**
 * Dynamically extracts unique categories from the live games list fetched from Firestore.
 */
export function getCategoriesFromGames(gamesList = []) {
  const categories = new Set();
  if (Array.isArray(gamesList)) {
    gamesList.forEach((game) => {
      if (game && game.category && typeof game.category === 'string') {
        const trimmed = game.category.trim();
        if (trimmed) {
          categories.add(trimmed);
        }
      }
    });
  }
  return ['All', ...Array.from(categories)];
}
