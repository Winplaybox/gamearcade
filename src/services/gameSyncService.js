import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, doc, getDoc, setDoc, getFeedSourcesFromFirestore } from '../config/firebase';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_SYNC_TASK = 'background-game-sync';

// Content safety blocklist
export const CONTENT_BLOCKLIST = [
  'adult',
  'gore',
  'casino',
  'gambling',
  'erotic',
  'nsfw',
  'sexy',
  '18+',
  'nude',
  'sex',
  'poker',
  'slots',
  'betting',
  'casino games',
];

const LAST_SYNC_STORAGE_KEY = 'gamearcade_last_rss_sync_ts';

function cleanText(str) {
  if (!str) return '';
  let text = String(str).replace(/<[^>]*>?/gm, '');
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

function mapCategory(rawCat) {
  if (!rawCat) return 'Arcade';
  const cat = String(rawCat).trim();
  if (!cat) return 'Arcade';

  const formatted = cat
    .split(/[-_ ]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return formatted || 'Arcade';
}

function isGameSafe(gameItem) {
  const textToCheck = `${gameItem.title || gameItem.Title || ''} ${gameItem.category || gameItem.Category || ''} ${gameItem.description || gameItem.Description || ''} ${gameItem.tags || gameItem.Tags || ''}`.toLowerCase();
  return !CONTENT_BLOCKLIST.some((blockedTerm) => textToCheck.includes(blockedTerm.toLowerCase()));
}

/**
 * Universal game schema parser respecting dynamic Firestore feed source schema (name, sourceKey, idPrefix, baseUrl)
 */
function parseGameItem(item, sourceConfig) {
  const rawId = item.id || item.Id || item.Asset || item.gid;
  const title = cleanText(item.title || item.Title || item.name || '');
  const url = item.url || item.Url || item.gameUrl || item.link;

  if (!rawId || !title || !url) return null;
  if (!isGameSafe(item)) return null;

  const thumb =
    item.thumb2 ||
    item.thumb ||
    item.image ||
    item.Image ||
    item.thumbnail ||
    item.icon ||
    item.ThumbnailUrl ||
    '';

  const categoryRaw = item.category || item.Category || item.genre || item.Genre || 'Arcade';

  let tagsArray = [];
  if (Array.isArray(item.tags || item.Tags)) {
    tagsArray = (item.tags || item.Tags).map(String);
  } else if (typeof (item.tags || item.Tags) === 'string') {
    tagsArray = String(item.tags || item.Tags)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const width = parseInt(item.width || item.Width || item.w, 10) || 800;
  const height = parseInt(item.height || item.Height || item.h, 10) || 600;
  const docId = `${sourceConfig.idPrefix || 'g_'}${rawId}`;

  return {
    id: docId,
    title,
    description: cleanText(item.description || item.Description || item.instructions || ''),
    iconUrl: thumb,
    thumbnail: thumb,
    url,
    gameUrl: url,
    category: mapCategory(categoryRaw),
    orientation: width > height ? 'landscape' : 'portrait',
    width,
    height,
    tags: tagsArray,
    sourceKey: sourceConfig.sourceKey || 'rss',
    sourceName: sourceConfig.name || 'RSS Provider',
    baseUrl: sourceConfig.baseUrl || '',
    status: 'approved',
    isActive: true,
    isFeatured: false,
    isPopular: false,
    rating: '4.6',
    instructions: cleanText(item.instructions || item.Instructions || item.controls || ''),
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Sync games from a single Firestore-configured RSS feed source
 */
async function syncFeedSource(sourceConfig) {
  try {
    const response = await fetch(sourceConfig.baseUrl);
    if (!response.ok) return 0;

    const data = await response.json();
    let itemsList = [];
    if (Array.isArray(data)) itemsList = data;
    else if (data && Array.isArray(data.items)) itemsList = data.items;
    else if (data && Array.isArray(data.data)) itemsList = data.data;

    let addedCount = 0;

    for (const item of itemsList) {
      const gameSchema = parseGameItem(item, sourceConfig);
      if (!gameSchema) continue;

      try {
        const docRef = doc(db, 'games', gameSchema.id);
        const snap = await getDoc(docRef);
        if (snap.exists()) continue; // Skip existing game

        await setDoc(docRef, gameSchema);
        addedCount++;
      } catch (err) {
        console.warn(`Error writing synced game ${gameSchema.id}:`, err);
      }
    }

    return addedCount;
  } catch (e) {
    console.warn(`Fetch RSS feed error for ${sourceConfig.baseUrl}:`, e);
    return 0;
  }
}

/**
 * Smart Background Game Sync Service Manager
 * Reads dynamic feed sources strictly from Firestore "feed_sources" collection
 */
export async function initBackgroundGameSync({ force = true } = {}) {
  try {
    console.log('🎮 Background Game Sync: Reading dynamic feed sources strictly from Firestore...');
    const firestoreSources = await getFeedSourcesFromFirestore();

    if (!Array.isArray(firestoreSources) || firestoreSources.length === 0) {
      console.log('🎮 Background Game Sync: No feed_sources configured in Firestore.');
      return;
    }

    let totalAdded = 0;
    for (const source of firestoreSources) {
      if (!source.baseUrl) continue;
      const count = await syncFeedSource(source);
      totalAdded += count;
    }

    await AsyncStorage.setItem(LAST_SYNC_STORAGE_KEY, String(Date.now()));
    console.log(`🎮 Background Game Sync Completed! ${totalAdded} new games written to Firestore.`);
    
    // Return whether new data was added so the OS can optimize battery/schedule
    return totalAdded > 0 
      ? BackgroundTask.BackgroundTaskResult.NewData 
      : BackgroundTask.BackgroundTaskResult.NoData;
  } catch (globalErr) {
    console.warn('🎮 Background Game Sync Failed:', globalErr);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
}

// 1. Define the task in the global scope so it can run while the app is closed
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  return await initBackgroundGameSync({ force: true });
});

// 2. Function to actually register the schedule with the OS (called on app mount)
export async function registerBackgroundSync() {
  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 60 * 60 * 6, // 6 hours
      stopOnTerminate: false, // android only
      startOnBoot: true, // android only
    });
    console.log('✅ Background sync task registered successfully');
  } catch (err) {
    console.warn('❌ Failed to register background sync task:', err);
  }
}
