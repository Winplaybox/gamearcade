import * as Updates from 'expo-updates';

/**
 * Checks for Over-The-Air (OTA) JavaScript updates from the configured updates.url.
 * If an update is found, it downloads it and optionally reloads the app.
 */
export async function checkForOtaUpdate() {
  try {
    if (__DEV__) {
      return false; // expo-updates don't run in development mode
    }
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      console.log('OTA Update found! Downloading...');
      await Updates.fetchUpdateAsync();
      
      // For seamless silent updates, reload automatically.
      console.log('OTA Update downloaded. Reloading app...');
      await Updates.reloadAsync();
      return true;
    }
  } catch (error) {
    console.warn('OTA Update Check Failed:', error);
  }
  return false;
}
