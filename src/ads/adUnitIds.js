export const USE_REAL_ADS = true;

// 1. Official Google AdMob Test Ad Unit IDs (Android)
const TEST_AD_UNITS = {
  appOpen: 'ca-app-pub-3940256099942544/9257395921',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  rewardedInterstitial: 'ca-app-pub-3940256099942544/5354046379',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  native: 'ca-app-pub-3940256099942544/2247696110',
};

// 2. Production AdMob Ad Unit IDs for Game Arcade (com.winplaybox.gamearcade)
const PRODUCTION_AD_UNITS = {
  appOpen: 'ca-app-pub-2699537002342677/3223713061',
  banner: 'ca-app-pub-2699537002342677/2173521125',
  interstitial: 'ca-app-pub-2699537002342677/4564980827',
  rewarded: 'ca-app-pub-2699537002342677/7187274739',
  rewardedInterstitial: 'ca-app-pub-2699537002342677/3251899156',
  native: 'ca-app-pub-2699537002342677/1938817489',
};

export const AdUnitIds = USE_REAL_ADS ? PRODUCTION_AD_UNITS : TEST_AD_UNITS;
