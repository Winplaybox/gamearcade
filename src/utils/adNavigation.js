import { showBackNavInterstitial } from '../ads/AdManager';

/**
 * Intercepts a game play request to attempt showing an interstitial ad before navigating.
 * The AdManager has a built-in frequency cap (e.g. 60 seconds) so this won't spam the user.
 * 
 * @param {object} navigation - The React Navigation object
 * @param {object} game - The game object to play
 */
export const handlePlayGameWithAd = (navigation, game, screen = 'List', activity = 'Play Game') => {
  // If the ad shows, the callback fires when closed. 
  // If the ad fails to load or is on cooldown, the callback fires immediately.
  showBackNavInterstitial(() => {
    navigation.navigate('Game', { game });
  }, screen, activity);
};
