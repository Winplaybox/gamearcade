import { InterstitialAd, RewardedAd, AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { AdUnitIds } from './adUnitIds';

let interstitial = null;
let isInterstitialLoading = false;

export function preloadInterstitial() {
  if (isInterstitialLoading || interstitial) return;
  try {
    isInterstitialLoading = true;
    interstitial = InterstitialAd.createForAdRequest(AdUnitIds.interstitial);
    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoading = false;
    });
    interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      isInterstitialLoading = false;
      interstitial = null;
    });
    interstitial.load();
  } catch (e) {
    isInterstitialLoading = false;
    interstitial = null;
  }
}

export function showBackNavInterstitial(onClosed) {
  if (interstitial) {
    let closed = false;
    const handleClose = () => {
      if (!closed) {
        closed = true;
        interstitial = null;
        preloadInterstitial();
        if (onClosed) onClosed();
      }
    };

    interstitial.addAdEventListener(AdEventType.CLOSED, handleClose);
    interstitial.addAdEventListener(AdEventType.ERROR, handleClose);

    try {
      interstitial.show();
    } catch (e) {
      handleClose();
    }
  } else {
    preloadInterstitial();
    if (onClosed) onClosed();
  }
}
