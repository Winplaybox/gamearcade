import { getApprovedGames as fetchFirestoreGames } from '../config/firebase';

export const DEFAULT_GAMES = [
  {
    id: 'game_1',
    title: 'Cut The Rope Magic',
    category: 'Puzzle',
    iconUrl: 'https://img.cdn.famobi.com/portal/html5games/images/tmp/120/CutTheRopeMagicTeaser.jpg?v=0.2-c2653b23',
    url: 'https://play.famobi.com/cut-the-rope-magic',
    rating: '4.9',
    playCount: 15420,
    isFeatured: true,
  },
  {
    id: 'game_2',
    title: 'Bubble Tower 3D',
    category: 'Arcade',
    iconUrl: 'https://img.cdn.famobi.com/portal/html5games/images/tmp/120/BubbleTower3DTeaser.jpg?v=0.2-c2653b23',
    url: 'https://play.famobi.com/bubble-tower-3d',
    rating: '4.8',
    playCount: 12890,
    isFeatured: true,
  },
  {
    id: 'game_3',
    title: 'Table Tennis World Tour',
    category: 'Sports',
    iconUrl: 'https://img.cdn.famobi.com/portal/html5games/images/tmp/120/TableTennisWorldTourTeaser.jpg?v=0.2-c2653b23',
    url: 'https://play.famobi.com/table-tennis-world-tour',
    rating: '4.7',
    playCount: 9800,
    isFeatured: true,
  },
  {
    id: 'game_4',
    title: 'Moto X3M Pool Party',
    category: 'Racing',
    iconUrl: 'https://img.cdn.famobi.com/portal/html5games/images/tmp/120/MotoX3mPoolPartyTeaser.jpg?v=0.2-c2653b23',
    url: 'https://play.famobi.com/moto-x3m-pool-party',
    rating: '4.9',
    playCount: 22100,
    isFeatured: true,
  },
  {
    id: 'game_5',
    title: 'Cannon Balls 3D',
    category: 'Action',
    iconUrl: 'https://img.cdn.famobi.com/portal/html5games/images/tmp/120/CannonBalls3dTeaser.jpg?v=0.2-c2653b23',
    url: 'https://play.famobi.com/cannon-balls-3d',
    rating: '4.6',
    playCount: 8400,
    isFeatured: false,
  },
  {
    id: 'game_6',
    title: 'Smarty Bubbles',
    category: 'Casual',
    iconUrl: 'https://img.cdn.famobi.com/portal/html5games/images/tmp/120/SmartyBubblesTeaser.jpg?v=0.2-c2653b23',
    url: 'https://play.famobi.com/smarty-bubbles',
    rating: '4.8',
    playCount: 19300,
    isFeatured: false,
  },
];

/**
 * Dynamically fetches live approved games from Firebase Firestore database.
 * Falls back to DEFAULT_GAMES if offline or network failure.
 */
export async function getLiveGamesList() {
  try {
    const liveGames = await fetchFirestoreGames();
    if (liveGames && liveGames.length > 0) {
      return liveGames;
    }
  } catch (e) {
    console.warn('Failed to fetch live Firebase games, falling back to default games:', e);
  }
  return DEFAULT_GAMES;
}

export function getCategoriesList() {
  return ['All', 'Action', 'Arcade', 'Puzzle', 'Sports', 'Racing', 'Casual'];
}
