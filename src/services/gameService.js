import { PHP_API_BASE_URL, generateGameIcon, getFirestoreCategories } from '../config/firebase';
import masterCategoriesData from '../data/categories_master_dataset.json';

/**
 * Fetch Games with Server-Side Pagination & Filtering
 */
export async function getLiveGamesList(params = {}) {
  const { page = 1, limit = 50, search = '', category = '', rating = 0, sort = 'newest' } = params;
  
  try {
    let url = `${PHP_API_BASE_URL}?type=games&page=${page}&limit=${limit}&category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}&rating=${rating}&sort=${encodeURIComponent(sort)}`;
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((d) => ({
          ...d,
          iconUrl: d.iconUrl || generateGameIcon(d.title),
        }));
      }
    }
  } catch (e) {
    console.warn('Fetch games error:', e);
  }
  return [];
}

/**
 * Fetch Featured Games (Server-Side)
 */
export async function getFeaturedGames() {
  try {
    const response = await fetch(`${PHP_API_BASE_URL}?type=featured_games`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((d) => ({
          ...d,
          iconUrl: d.iconUrl || generateGameIcon(d.title),
        }));
      }
    }
  } catch (e) {
    console.warn('Fetch featured games error:', e);
  }
  return [];
}

/**
 * Fetch Popular Games (Server-Side)
 */
export async function getPopularGames() {
  try {
    const response = await fetch(`${PHP_API_BASE_URL}?type=popular_games`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((d) => ({
          ...d,
          iconUrl: d.iconUrl || generateGameIcon(d.title),
        }));
      }
    }
  } catch (e) {
    console.warn('Fetch popular games error:', e);
  }
  return [];
}

/**
 * Dynamically fetches all categories from Firebase Firestore,
 * with local fallback to master dataset if network is offline.
 */
export async function getLiveCategoriesList() {
  try {
    const firestoreCategories = await getFirestoreCategories();
    if (firestoreCategories && Array.isArray(firestoreCategories) && firestoreCategories.length > 0) {
      return firestoreCategories;
    }
  } catch (e) {
    console.warn('Failed to fetch live Firestore categories:', e);
  }
  return masterCategoriesData.categories || [];
}

/**
 * Filters the list of categories to only include categories that have matching games in gamesList.
 */
export function getAvailableCategoriesForGames(gamesList = [], allCategories = []) {
  if (!Array.isArray(gamesList) || gamesList.length === 0) {
    return allCategories;
  }

  const activeCategorySet = new Set(
    gamesList.map((g) => (g && g.category ? g.category.trim().toLowerCase() : ''))
  );

  return allCategories.filter((cat) => {
    if (!cat || !cat.title) return false;
    const catTitleLower = cat.title.trim().toLowerCase();
    const catIdLower = cat.id ? cat.id.trim().toLowerCase() : '';
    return activeCategorySet.has(catTitleLower) || activeCategorySet.has(catIdLower);
  });
}
