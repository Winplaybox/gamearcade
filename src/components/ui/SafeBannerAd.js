import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAdUnitId } from '../../ads/AdManager';
import { logAdImpression } from '../../services/adMetricsService';

let BannerAd = null;
let BannerAdSize = null;

try {
  const mobileAdsModule = require('react-native-google-mobile-ads');
  BannerAd = mobileAdsModule.BannerAd;
  BannerAdSize = mobileAdsModule.BannerAdSize;
} catch (e) {
  // Graceful fallback for environments missing the native package
}

export default function SafeBannerAd() {
  const [adFailedToLoad, setAdFailedToLoad] = useState(false);

  // If the module isn't linked, unit ID is missing, or ad previously failed, don't render.
  if (!BannerAd || !BannerAdSize || !BannerAdUnitId || adFailedToLoad) {
    return null;
  }

  return (
    <View style={styles.adContainer}>
      <BannerAd
        unitId={BannerAdUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => logAdImpression('banner')}
        onAdFailedToLoad={(error) => {
          console.warn('Banner Ad failed to load:', error);
          setAdFailedToLoad(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
});
