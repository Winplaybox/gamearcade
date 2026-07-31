import { initializeApp, getApps } from '@firebase/app';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
} from '@firebase/firestore';

setLogLevel('error');

const firebaseConfig = {
  apiKey: "AIzaSyBN5s6oWrkUlCfn2UbzL9kaGKshEStXo9A",
  authDomain: "winplaybox-ce209.firebaseapp.com",
  projectId: "winplaybox-ce209",
  storageBucket: "winplaybox-ce209.firebasestorage.app",
  messagingSenderId: "192622831495",
  appId: "1:192622831495:android:5576d6e95420a39cc19522",
  measurementId: "G-G599907162"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalLongPolling: {
      autoDetectLongPolling: true,
    },
  });
} catch (e) {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

export function generateGameIcon(title) {
  if (!title) return 'https://ui-avatars.com/api/?name=Game&background=e94560&color=fff&size=128';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=e94560&color=fff&size=128`;
}

/**
 * Fetch Approved Games from Firestore "games" collection
 */
export async function getApprovedGames() {
  try {
    const q = query(collection(db, 'games'), where('status', '==', 'approved'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        iconUrl: doc.data().iconUrl || generateGameIcon(doc.data().title),
      }));
    }
  } catch (e) {
    console.warn('Fetch Firestore approved games error:', e);
  }
  return [];
}
