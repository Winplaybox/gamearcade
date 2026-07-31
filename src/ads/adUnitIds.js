export const USE_REAL_ADS = true;

const TEST_AD_UNITS = {
  appOpen: 'ca-app-pub-3940256099942544/9257395921',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  rewardedInterstitial: 'ca-app-pub-3940256099942544/5354046379',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  native: 'ca-app-pub-3940256099942544/2247696110',
};

const PRODUCTION_AD_UNITS = {
  appOpen: 'ca-app-pub-2699537002342677/5032081771',
  banner: 'ca-app-pub-2699537002342677/8668074457',
  interstitial: 'ca-app-pub-2699537002342677/9981156121',
  rewarded: 'ca-app-pub-2699537002342677/4597233432',
  rewardedInterstitial: 'ca-app-pub-2699537002342677/2164113966',
  native: 'ca-app-pub-2699537002342677/1035131058',
};

export const AdUnitIds = USE_REAL_ADS ? PRODUCTION_AD_UNITS : TEST_AD_UNITS;
