import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import AppConfig from '../config/AppConfig';

const CACHE_STORAGE_KEY = 'gamearcade_promoted_apps_v1';

async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export function getCurrentPackageName() {
  return Constants.expoConfig?.android?.package || 'com.winplaybox.gamearcade';
}

export async function getPromotedAppsList() {
  const currentPackage = getCurrentPackageName();
  let rawList = [];

  try {
    const response = await fetchWithTimeout(AppConfig.crossAppApiUrl, 5000);
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
