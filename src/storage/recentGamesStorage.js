import { auth, PHP_API_BASE_URL } from '../config/firebase';

export async function getRecentGames() {
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const response = await fetch(`${PHP_API_BASE_URL}?type=get_recents&userId=${uid}`);
      if (response.ok) {
        return await response.json();
      }
    }
  } catch (e) {
    console.warn('Fetch recents error:', e);
  }
  return [];
}

export async function addRecentGame(game) {
  if (!game || !game.id) return [];
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await fetch(PHP_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'add_recent',
          userId: uid,
          gameId: game.id,
          durationMs: 0
        })
      });
    }
  } catch (e) {
    console.warn('Add recent error:', e);
  }
  return getRecentGames();
}

export async function updateRecentGameSession(gameId, durationMs) {
  if (!gameId) return [];
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await fetch(PHP_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'add_recent',
          userId: uid,
          gameId: gameId,
          durationMs: durationMs
        })
      });
    }
  } catch (e) {
    console.warn('Update recent error:', e);
  }
  return getRecentGames();
}

export async function removeRecentGame(gameId) {
  if (!gameId) return [];
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await fetch(PHP_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'remove_recent',
          userId: uid,
          gameId: gameId
        })
      });
    }
  } catch (e) {
    console.warn('Remove recent error:', e);
  }
  return getRecentGames();
}

export async function removeMultipleRecentGames(gameIds) {
  // Not heavily used, but we could add an endpoint if needed.
  // For now, loop through and remove one by one or ignore.
  if (!gameIds || gameIds.length === 0) return [];
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      for (const gameId of gameIds) {
        await fetch(PHP_API_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'remove_recent',
            userId: uid,
            gameId: gameId
          })
        });
      }
    }
  } catch (e) {
    console.warn('Remove multiple recents error:', e);
  }
  return getRecentGames();
}

export async function clearAllRecentGames() {
  // Clearing recents happens from the PHP backend via reset_profile
  return [];
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - timestamp;
  const minsAgo = Math.floor(diffMs / 60000);
  if (minsAgo < 1) return 'Just now';
  if (minsAgo < 60) return `${minsAgo} min${minsAgo > 1 ? 's' : ''} ago`;
  const hoursAgo = Math.floor(minsAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo} hr${hoursAgo > 1 ? 's' : ''} ago`;
  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
}

export function formatDuration(durationMs) {
  if (!durationMs || durationMs < 1000) return 'Less than 1 min';
  const totalMins = Math.round(durationMs / 60000);
  if (totalMins < 1) return 'Less than 1 min';
  if (totalMins < 60) return `${totalMins} min${totalMins > 1 ? 's' : ''}`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
