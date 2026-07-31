import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const CACHE_STORAGE_KEY = 'mvb_promoted_apps_v1';
const HOSTED_API_URL = 'https://winplaybox.in/mvb-admin/apps_directory.php';

export function getCurrentPackageName() {
  return Constants.expoConfig?.android?.package || 'com.winplaybox.gamearcade';
}

export async function getPromotedAppsList() {
  const currentPackage = getCurrentPackageName();
  let rawList = [];

  try {
    const response = await fetch(HOSTED_API_URL, { timeout: 5000 });
    const json = await response.json();
    if (json && json.status === 'success' && Array.isArray(json.data)) {
      rawList = json.data;
      await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(rawList));
    }
  } catch (error) {
    try {
      const cached = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
      if (cached) {
        rawList = JSON.parse(cached);
      }
    } catch (e) {
      rawList = [];
    }
  }

  return rawList.filter(
    (app) => app.isActive !== false && app.packageName !== currentPackage
  );
}

export async function launchAppOrPlayStore(app) {
  if (!app) return;

  if (app.scheme) {
    try {
      const canOpenScheme = await Linking.canOpenURL(app.scheme);
      if (canOpenScheme) {
        await Linking.openURL(app.scheme);
        return;
      }
    } catch (e) {}
  }

  if (app.packageName) {
    try {
      const marketUrl = `market://details?id=${app.packageName}`;
      const canOpenMarket = await Linking.canOpenURL(marketUrl);
      if (canOpenMarket) {
        await Linking.openURL(marketUrl);
        return;
      }
    } catch (e) {}
  }

  if (app.playStoreUrl) {
    Linking.openURL(app.playStoreUrl).catch(() => {});
  }
}
