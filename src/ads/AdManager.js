import { Alert } from 'react-native';
import AppConfig from '../config/AppConfig';
import { logAdImpression } from '../services/adMetricsService';

let mobileAdsInstance = null;
let RewardedAd = null;
let RewardedAdEventType = null;
let InterstitialAd = null;
let AdEventType = null;
let AppOpenAd = null;

try {
  const mobileAdsModule = require('react-native-google-mobile-ads');
  mobileAdsInstance = mobileAdsModule.default;
  RewardedAd = mobileAdsModule.RewardedAd;
  RewardedAdEventType = mobileAdsModule.RewardedAdEventType;
  InterstitialAd = mobileAdsModule.InterstitialAd;
  AdEventType = mobileAdsModule.AdEventType;
  AppOpenAd = mobileAdsModule.AppOpenAd;
} catch (e) {
  // Graceful fallback for Expo Go / Dev client without native linkage
}

export async function initializeAds() {
  if (mobileAdsInstance && typeof mobileAdsInstance === 'function') {
    try {
      await mobileAdsInstance().initialize();
    } catch (e) {
      // ignore
    }
  }
}

// Frequency Capping Timestamps
let lastAppOpenTime = 0;
let lastInterstitialTime = 0;
const APP_OPEN_COOLDOWN_MS = 120000;
const INTERSTITIAL_COOLDOWN_MS = 60000;

export function maybeShowAppOpenAd(onClose = () => {}, screen = 'App Initialization', activity = 'App Start') {
  if (!AppOpenAd || !AppConfig.ads.appOpen) {
    onClose();
    return;
  }

  const now = Date.now();
  if (now - lastAppOpenTime < APP_OPEN_COOLDOWN_MS) {
    onClose();
    return;
  }

  try {
    const appOpenAd = AppOpenAd.createForAdRequest(AppConfig.ads.appOpen, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      lastAppOpenTime = Date.now();
      appOpenAd.show();
      logAdImpression('appOpen', screen, activity);
    });

    const unsubscribeClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      onClose();
    });

    appOpenAd.load();
  } catch (e) {
    onClose();
  }
}

export function showBackNavInterstitial(onClose = () => {}, screen = 'Unknown', activity = 'Back Navigation') {
  if (!InterstitialAd || !AppConfig.ads.interstitial) {
    onClose();
    return;
  }

  const now = Date.now();
  if (now - lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) {
    onClose();
    return;
  }

  try {
    const interstitial = InterstitialAd.createForAdRequest(AppConfig.ads.interstitial, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      lastInterstitialTime = Date.now();
      interstitial.show();
      logAdImpression('interstitial', screen, activity);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      onClose();
    });

    interstitial.load();
  } catch (e) {
    onClose();
  }
}

export function showRewardedAd(onSuccess, onCancel = () => {}, screen = 'Unknown', activity = 'Watch Ad') {
  const targetAdUnit = AppConfig.ads.rewarded || AppConfig.ads.rewardedInterstitial;
  if (!RewardedAd || !RewardedAdEventType || !targetAdUnit) {
    onSuccess();
    return;
  }

  try {
    const rewarded = RewardedAd.createForAdRequest(targetAdUnit, {
      requestNonPersonalizedAdsOnly: false,
    });

    let rewardEarned = false;

    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewarded.show();
      logAdImpression('rewarded', screen, activity);
    });

    const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardEarned = true;
    });

    const unsubscribeClosed = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();

      if (rewardEarned) {
        onSuccess();
      } else {
        onCancel();
      }
    });

    rewarded.load();
  } catch (e) {
    onSuccess();
  }
}

export const BannerAdUnitId = AppConfig.ads.banner;
