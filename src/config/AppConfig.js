import { db, doc, getDoc } from './firebase';

const TEST_AD_UNITS = {
  appOpen: 'ca-app-pub-3940256099942544/9257395921',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  rewardedInterstitial: 'ca-app-pub-3940256099942544/5354046379',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  native: 'ca-app-pub-3940256099942544/2247696110',
};

const PRODUCTION_AD_UNITS = {
  appOpen: 'ca-app-pub-2699537002342677/3223713061',
  banner: 'ca-app-pub-2699537002342677/2173521125',
  interstitial: 'ca-app-pub-2699537002342677/4564980827',
  rewarded: 'ca-app-pub-2699537002342677/7187274739',
  rewardedInterstitial: 'ca-app-pub-2699537002342677/3251899156',
  native: 'ca-app-pub-2699537002342677/1938817489',
};

class Configuration {
  constructor() {
    this.USE_REAL_ADS = true;
    this.ads = this.USE_REAL_ADS ? PRODUCTION_AD_UNITS : TEST_AD_UNITS;
    
    this.playStoreUrl = 'https://play.google.com/store/apps/details?id=com.winplaybox.gamearcade';
    this.crossAppApiUrl = 'https://winplaybox.in/mvb-admin/apps_directory.php';
    
    this.supportEmail = 'support@winplaybox.com';
    this.appUpdateCollection = 'app_updates';
    this.PAGE_SIZE = 24;
  }

  async fetchRemoteConfig() {
    try {
      const docRef = doc(db, 'app_config', 'global');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const remoteData = snapshot.data();
        
        if (remoteData.USE_REAL_ADS !== undefined) {
          this.USE_REAL_ADS = remoteData.USE_REAL_ADS;
          this.ads = this.USE_REAL_ADS ? PRODUCTION_AD_UNITS : TEST_AD_UNITS;
        }
        
        if (remoteData.ads) {
          this.ads = { ...this.ads, ...remoteData.ads };
        }

        if (remoteData.playStoreUrl) this.playStoreUrl = remoteData.playStoreUrl;
        if (remoteData.crossAppApiUrl) this.crossAppApiUrl = remoteData.crossAppApiUrl;
        if (remoteData.supportEmail) this.supportEmail = remoteData.supportEmail;
        if (remoteData.PAGE_SIZE) this.PAGE_SIZE = remoteData.PAGE_SIZE;
        
        console.log('Remote config fetched and merged successfully.');
      }
    } catch (error) {
      console.warn('Failed to fetch remote config:', error);
    }
  }
}

const AppConfig = new Configuration();
export default AppConfig;
