import { auth, PHP_API_BASE_URL } from '../config/firebase';

/**
 * Logs an ad impression directly to the PHP/MySQL backend.
 *
 * @param {string} adType - 'appOpen', 'interstitial', 'rewarded', or 'banner'
 * @param {string} screen - The screen where the ad was shown (e.g. 'Home')
 * @param {string} activity - The user action that triggered the ad (e.g. 'Submitted Game')
 */
export async function logAdImpression(adType, screen = '', activity = '') {
  try {
    const user = auth?.currentUser;
    const userId = user?.uid || 'anonymous';

    const response = await fetch(PHP_API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'log_ad',
        userId,
        adType,
        screen,
        activity
      })
    });

    if (!response.ok) {
      console.warn('Ad Metric logging returned non-OK status');
    }
  } catch (err) {
    // Silently ignore to not interrupt UX
    console.warn('Ad Metric logging failed:', err);
  }
}
