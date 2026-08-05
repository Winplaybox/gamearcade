import { initializeApp, getApps } from '@firebase/app';
import { initializeAuth, getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
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
  increment,
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

// Initialize Auth with AsyncStorage persistence to prevent memory-only loss between reloads
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Use plain getFirestore — no experimentalLongPolling which causes massive delays
export const db = getFirestore(app);

export { doc, getDoc, setDoc, collection, serverTimestamp, increment };

export function generateGameIcon(title) {
  if (!title) return 'https://ui-avatars.com/api/?name=Game&background=e94560&color=fff&size=128';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=e94560&color=fff&size=128`;
}

// ─── PHP Caching API ─────────────────────────────────────────────────────────
// We use a PHP API to serve static JSON files, bypassing Firestore's 50K limit.
// Upload the `php_backend` folder to your Hostinger server in a folder called `gamearcade-api`.
export const PHP_API_BASE_URL = 'https://winplaybox.in/mvb-admin/gamearcade-api/api.php';

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
// Prevents redundant Firestore fetches on every tab navigation.
// TTL: 5 minutes — stale data is acceptable for a game listing app.
const CACHE_TTL_MS = 5 * 60 * 1000;

let _gamesCache = null;
let _gamesCacheTime = 0;
let _categoriesCache = null;
let _categoriesCacheTime = 0;

function isCacheValid(time) {
  return time > 0 && Date.now() - time < CACHE_TTL_MS;
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch Approved Games from PHP Caching API
 * Result is cached in memory for 5 minutes.
 */
export async function getApprovedGames() {
  if (isCacheValid(_gamesCacheTime) && _gamesCache) {
    return _gamesCache;
  }
  try {
    const response = await fetch(`${PHP_API_BASE_URL}?type=games`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        _gamesCache = data.map((d) => ({
          ...d,
          iconUrl: d.iconUrl || generateGameIcon(d.title),
        }));
        _gamesCacheTime = Date.now();
        return _gamesCache;
      }
    }
  } catch (e) {
    console.warn('Fetch PHP API games error:', e);
    if (_gamesCache) return _gamesCache; // serve stale cache on error
  }
  return [];
}

/**
 * Fetch All Categories from PHP Caching API
 * Result is cached in memory for 5 minutes.
 */
export async function getFirestoreCategories() {
  if (isCacheValid(_categoriesCacheTime) && _categoriesCache) {
    return _categoriesCache;
  }
  try {
    const response = await fetch(`${PHP_API_BASE_URL}?type=categories`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        _categoriesCache = data;
        _categoriesCacheTime = Date.now();
        return _categoriesCache;
      }
    }
  } catch (e) {
    console.warn('Fetch PHP API categories error:', e);
    if (_categoriesCache) return _categoriesCache;
  }
  return [];
}

/**
 * Submit Game Suggestion to PHP API
 */
export async function submitGameToPHP(submissionData) {
  try {
    const response = await fetch(PHP_API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'submit_game',
        ...submissionData
      })
    });
    if (response.ok) {
      return { success: true };
    }
    return { success: false, error: 'Server returned error' };
  } catch (e) {
    console.warn('Submit game error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Submit Issue Report to PHP API
 */
export async function submitIssueReportToPHP(reportData) {
  try {
    const response = await fetch(PHP_API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'report_issue',
        ...reportData
      })
    });
    if (response.ok) {
      return { success: true };
    }
    return { success: false, error: 'Server returned error' };
  } catch (e) {
    console.warn('Submit issue report error:', e);
    return { success: false, error: e.message };
  }
}

// ─── PHP Profile Management ──────────────────────────────────────────────────

export async function getProfileFromPHP(userId) {
  try {
    const response = await fetch(`${PHP_API_BASE_URL}?type=get_profile&userId=${userId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Get profile error:', e);
  }
  return null;
}

export async function updateProfileOnPHP(userId, data) {
  try {
    const response = await fetch(PHP_API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'update_profile',
        userId,
        ...data
      })
    });
    return response.ok;
  } catch (e) {
    console.warn('Update profile error:', e);
    return false;
  }
}

export async function resetProfileOnPHP(userId) {
  try {
    const response = await fetch(PHP_API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'reset_profile',
        userId
      })
    });
    return response.ok;
  } catch (e) {
    console.warn('Reset profile error:', e);
    return false;
  }
}

/**
 * Fetch Configured Feed Sources from PHP Caching API
 */
export async function getFeedSourcesFromFirestore() {
  try {
    const response = await fetch(`${PHP_API_BASE_URL}?type=feed_sources`);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Fetch PHP API feed_sources error:', e);
  }
  return [];
}
