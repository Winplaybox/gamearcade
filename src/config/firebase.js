import { initializeApp, getApps } from '@firebase/app';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  doc,
  addDoc,
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
export { doc, getDoc, setDoc, collection, serverTimestamp };

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

/**
 * Fetch All Categories & Sub-Categories directly from Firestore "game_categories" collection
 */
export async function getFirestoreCategories() {
  try {
    const q = query(collection(db, 'game_categories'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return list.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
    }
  } catch (e) {
    console.warn('Fetch Firestore categories error:', e);
  }
  return [];
}

/**
 * Submit Game Suggestion to Firestore "game_submissions" collection
 */
export async function submitGameToFirestore(submissionData) {
  try {
    const docRef = await addDoc(collection(db, 'game_submissions'), {
      title: submissionData.title || '',
      ownerName: submissionData.ownerName || '',
      ownerEmail: submissionData.ownerEmail || '',
      gameUrl: submissionData.gameUrl || '',
      category: submissionData.category || 'Arcade',
      subCategory: submissionData.subCategory || '',
      description: submissionData.description || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (e) {
    console.warn('Submit game error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Submit Issue Report to Firestore "issue_reports" collection
 */
export async function submitIssueReportToFirestore(reportData) {
  try {
    const docRef = await addDoc(collection(db, 'issue_reports'), {
      gameId: reportData.gameId || null,
      gameTitle: reportData.gameTitle || 'General Arcade App Issue',
      issueType: reportData.issueType || 'Other',
      details: reportData.details || '',
      status: 'open',
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (e) {
    console.warn('Submit issue report error:', e);
    return { success: false, error: e.message };
  }
}
