import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const RATINGS_KEY = 'gamearcade_user_ratings_v1';

export async function getUserRatings() {
  try {
    const raw = await AsyncStorage.getItem(RATINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export async function saveGameRating(game, ratingValue, reviewText = '') {
  if (!game?.id || !ratingValue) return;

  const currentRatings = await getUserRatings();
  currentRatings[game.id] = {
    rating: ratingValue,
    reviewText: reviewText.trim(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(currentRatings));
  } catch (e) {}

  // Sync rating submission to Firebase Firestore if online
  try {
    if (db) {
      await addDoc(collection(db, 'game_ratings'), {
        gameId: game.id,
        gameTitle: game.title || 'Unknown',
        rating: ratingValue,
        reviewText: reviewText.trim(),
        createdAt: serverTimestamp(),
        platform: 'android',
      });
    }
  } catch (err) {
    console.warn('Firestore rating save fallback:', err);
  }

  return currentRatings;
}
