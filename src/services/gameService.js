import { getApprovedGames as fetchFirestoreGames, getFirestoreCategories } from '../config/firebase';
import masterCategoriesData from '../data/categories_master_dataset.json';

/**
 * Dynamically fetches live approved games directly from Firebase Firestore database.
 */
export async function getLiveGamesList() {
  try {
    const liveGames = await fetchFirestoreGames();
    if (liveGames && Array.isArray(liveGames) && liveGames.length > 0) {
      return liveGames;
    }
  } catch (e) {
    console.warn('Failed to fetch live Firebase games:', e);
  }
  return [];
}

/**
 * Dynamically fetches all categories and sub-categories from Firebase Firestore,
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

/**
 * Filters sub-categories of a category to only include sub-categories present in gamesList.
 */
export function getAvailableSubCategoriesForGames(gamesList = [], subCategories = []) {
  if (!Array.isArray(gamesList) || gamesList.length === 0 || !Array.isArray(subCategories)) {
    return subCategories;
  }

  const activeSubSet = new Set();
  gamesList.forEach((g) => {
    if (g.subCategory) activeSubSet.add(g.subCategory.trim().toLowerCase());
    if (g.tags && Array.isArray(g.tags)) {
      g.tags.forEach((t) => activeSubSet.add(t.trim().toLowerCase()));
    }
  });

  return subCategories.filter((sub) => {
    if (!sub || !sub.title) return false;
    const subTitleLower = sub.title.trim().toLowerCase();
    return activeSubSet.has(subTitleLower);
  });
}
