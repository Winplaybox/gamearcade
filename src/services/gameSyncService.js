import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, doc, getDoc, setDoc } from '../config/firebase';

// 1. Content safety blocklist (exported for easy extension)
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

// 2. Extensible list of RSS Feed Providers
export const FEED_SOURCES = [
  {
    name: 'GameMonetize',
    sourceKey: 'gamemonetize',
    idPrefix: 'gm_',
    baseUrl: 'https://gamemonetize.com/rssfeed.php?format=json&type=html5',
    categories: ['All', 'Puzzle', 'Racing', 'Action', 'Arcade', 'Sports', 'Shooting', 'Strategy', 'Adventure'],
    amountPerCategory: 100,
  },
  // Future providers (e.g., HTML5Games, GameDistribution) can be appended here seamlessly!
];

const LAST_SYNC_STORAGE_KEY = 'gamearcade_last_rss_sync_ts';
const SYNC_THROTTLE_MS = 6 * 60 * 60 * 1000; // 6 hours throttle interval

/**
 * Strip HTML tags and unescape common HTML entities
 */
function cleanText(str) {
  if (!str) return '';
  let text = String(str).replace(/<[^>]*>?/gm, '');
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
  return text.trim();
}

/**
 * Map raw feed category to app's taxonomy
 */
function mapCategory(rawCat) {
  if (!rawCat) return 'Arcade';
  const cat = String(rawCat).toLowerCase().trim();

  if (cat.includes('racing') || cat.includes('car') || cat.includes('bike')) return 'Racing';
  if (cat.includes('puzzle') || cat.includes('logic') || cat.includes('match') || cat.includes('board')) return 'Puzzle';
  if (cat.includes('sport') || cat.includes('football') || cat.includes('soccer') || cat.includes('basketball')) return 'Sports';
  if (cat.includes('action') || cat.includes('fight') || cat.includes('war')) return 'Action';
  if (cat.includes('strategy') || cat.includes('defense') || cat.includes('tower')) return 'Strategy';
  if (cat.includes('shoot') || cat.includes('fps') || cat.includes('gun')) return 'Shooting';
  if (cat.includes('adventure') || cat.includes('quest') || cat.includes('rpg')) return 'Adventure';
  if (cat.includes('casual') || cat.includes('hyper') || cat.includes('clicker')) return 'Casual';

  return 'Arcade';
}

/**
 * Derive orientation based on width and height
 */
function deriveOrientation(w, h) {
  const width = parseInt(w, 10) || 0;
  const height = parseInt(h, 10) || 0;

  if (width > 0 && height > 0) {
    if (width > height) return 'landscape';
    if (height > width) return 'portrait';
  }
  return 'auto';
}

/**
 * Check if a game passes safety inspection
 */
function isGameSafe(gameItem) {
  const textToCheck = `${gameItem.title || ''} ${gameItem.category || ''} ${gameItem.description || ''} ${gameItem.tags || ''}`.toLowerCase();
  return !CONTENT_BLOCKLIST.some((blockedTerm) => textToCheck.includes(blockedTerm.toLowerCase()));
}

/**
 * Select the highest resolution thumbnail image available
 */
function getBestThumbnail(gameItem) {
  return gameItem.thumb2 || gameItem.thumb || gameItem.image || gameItem.icon || '';
}

/**
 * Sync games from a single RSS feed endpoint to Firestore
 */
async function syncFeedEndpoint(url, sourceConfig) {
  try {
    const response = await fetch(url);
    if (!response.ok) return 0;

    const data = await response.json();
    if (!Array.isArray(data)) return 0;

    let addedCount = 0;

    for (const item of data) {
      if (!item.id || !item.title || !item.url) continue;

      // 1. Content Safety Check
      if (!isGameSafe(item)) continue;

      const docId = `${sourceConfig.idPrefix}${item.id}`;

      try {
        // 2. Check if game already exists in Firestore — SKIP if present!
        const docRef = doc(db, 'games', docId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          continue; // Skip without overwriting existing doc
        }

        // 3. Map to Firestore "games" schema
        const tagsArray = item.tags
          ? String(item.tags).split(',').map((t) => t.trim()).filter(Boolean)
          : [];

        const gameSchema = {
          id: docId,
          title: cleanText(item.title),
          description: cleanText(item.description),
          iconUrl: getBestThumbnail(item),
          thumbnail: getBestThumbnail(item),
          url: item.url,
          gameUrl: item.url,
          category: mapCategory(item.category),
          orientation: deriveOrientation(item.width, item.height),
          width: parseInt(item.width, 10) || 800,
          height: parseInt(item.height, 10) || 600,
          tags: tagsArray,
          source: sourceConfig.sourceKey,
          status: 'approved',
          isActive: true,
          isFeatured: false,
          isPopular: false,
          rating: '4.6',
          instructions: cleanText(item.instructions || item.controls || ''),
          syncedAt: new Date().toISOString(),
        };

        // 4. Save to Firestore
        await setDoc(docRef, gameSchema);
        addedCount++;
      } catch (err) {
        console.warn(`Error writing synced game ${docId}:`, err);
      }
    }

    return addedCount;
  } catch (e) {
    console.warn(`Fetch RSS feed error for ${url}:`, e);
    return 0;
  }
}

/**
 * Main Background Game Sync Service Manager
 * Call on cold start — throttled to run once every 6 hours
 */
export async function initBackgroundGameSync({ force = false } = {}) {
  try {
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_STORAGE_KEY);
    const lastSyncTs = parseInt(lastSyncStr || '0', 10);
    const now = Date.now();

    if (!force && now - lastSyncTs < SYNC_THROTTLE_MS) {
      console.log('🎮 Background Game Sync: Throttled (last sync < 6 hrs ago).');
      return;
    }

    console.log('🎮 Background Game Sync: Starting RSS feed sync...');
    let totalAdded = 0;

    for (const source of FEED_SOURCES) {
      for (const cat of source.categories) {
        const feedUrl = `${source.baseUrl}&category=${cat}&popularity=newest&company=All&amount=${source.amountPerCategory}`;
        const count = await syncFeedEndpoint(feedUrl, source);
        totalAdded += count;
      }
    }

    await AsyncStorage.setItem(LAST_SYNC_STORAGE_KEY, String(now));
    console.log(`🎮 Background Game Sync Completed! ${totalAdded} new games synced to Firestore.`);
  } catch (globalErr) {
    console.warn('🎮 Background Game Sync Failed:', globalErr);
  }
}
