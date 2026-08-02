import { collection, doc, setDoc } from '@firebase/firestore';
import { db } from '../config/firebase';
import categoriesDataset from '../data/categories_master_dataset.json';

/**
 * Seed all categories into Firebase Firestore in one shot
 */
export async function seedCategoriesToFirestore() {
  if (!db) {
    console.warn('Firestore instance not ready for category seeding.');
    return false;
  }

  try {
    const categoriesCollection = collection(db, 'game_categories');
    let insertedCount = 0;

    for (const cat of categoriesDataset.categories) {
      const docRef = doc(categoriesCollection, cat.id);
      await setDoc(docRef, {
        ...cat,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      insertedCount++;
    }

    console.log(`Successfully seeded ${insertedCount} categories to Firestore!`);
    return true;
  } catch (error) {
    console.error('Error seeding categories to Firestore:', error);
    return false;
  }
}
