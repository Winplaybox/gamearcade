import { Linking } from 'react-native';
import Constants from 'expo-constants';
import { db, doc, getDoc, setDoc } from '../config/firebase';
import AppConfig from '../config/AppConfig';

const APP_PACKAGE = Constants.expoConfig?.android?.package || 'com.winplaybox.gamearcade';
const CURRENT_VERSION = Constants.expoConfig?.version || '1.0.0';
const CURRENT_VERSION_CODE = Constants.expoConfig?.android?.versionCode || 1;

/**
 * Solution A: Checks remote Firestore version info to determine if a Google Play Store update is required
 */
export async function checkForAppUpdate() {
  try {
    const versionRef = doc(db, 'app_config', 'version_info');
    const versionSnap = await getDoc(versionRef);

    let remoteData = null;

    if (versionSnap.exists()) {
      remoteData = versionSnap.data();
    } else {
      // Seed default remote version config in Firestore
      remoteData = {
        latestVersion: CURRENT_VERSION,
        latestVersionCode: CURRENT_VERSION_CODE,
        minRequiredVersionCode: CURRENT_VERSION_CODE,
        releaseNotes: 'A newer version of Game Arcade is available on Google Play with performance improvements and new games.',
        playStoreUrl: AppConfig.playStoreUrl,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(versionRef, remoteData);
    }

    const latestVersionCode = remoteData.latestVersionCode || 1;
    const minRequiredVersionCode = remoteData.minRequiredVersionCode || 1;

    const updateAvailable = latestVersionCode > CURRENT_VERSION_CODE;
    const isForceUpdate = updateAvailable && CURRENT_VERSION_CODE < minRequiredVersionCode;

    return {
      success: true,
      updateAvailable,
      isForceUpdate,
      currentVersion: CURRENT_VERSION,
      currentVersionCode: CURRENT_VERSION_CODE,
      latestVersion: remoteData.latestVersion || CURRENT_VERSION,
      latestVersionCode,
      minRequiredVersionCode,
      releaseNotes: remoteData.releaseNotes || 'A newer version of Game Arcade is available with performance improvements and new games.',
      playStoreUrl: remoteData.playStoreUrl || AppConfig.playStoreUrl,
    };
  } catch (error) {
    console.warn('App update check error:', error);
    return {
      success: false,
      updateAvailable: false,
      isForceUpdate: false,
      currentVersion: CURRENT_VERSION,
      currentVersionCode: CURRENT_VERSION_CODE,
    };
  }
}

/**
 * Launches the official Google Play Store app page directly
 */
export async function openPlayStorePage(customUrl = null) {
  const targetUrl = customUrl || AppConfig.playStoreUrl;
  try {
    const supported = await Linking.canOpenURL(targetUrl);
    if (supported) {
      await Linking.openURL(targetUrl);
    } else {
      await Linking.openURL(`market://details?id=${APP_PACKAGE}`);
    }
  } catch (e) {
    await Linking.openURL(AppConfig.playStoreUrl).catch(() => {});
  }
}
