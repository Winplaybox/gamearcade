import { auth, PHP_API_BASE_URL } from '../config/firebase';

export async function getUserRatings() {
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const response = await fetch(`${PHP_API_BASE_URL}?type=get_ratings&userId=${uid}`);
      if (response.ok) {
        return await response.json();
      }
    }
  } catch (e) {
    console.warn('Fetch ratings error:', e);
  }
  return {};
}

export async function saveGameRating(game, ratingValue, reviewText = '') {
  if (!game?.id || !ratingValue) return;

  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await fetch(PHP_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'save_rating',
          userId: uid,
          gameId: game.id,
          rating: ratingValue,
          reviewText: reviewText.trim()
        })
      });
    }
  } catch (e) {
    console.warn('Save rating error:', e);
  }

  return getUserRatings();
}
