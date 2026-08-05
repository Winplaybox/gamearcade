import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Share,
  Linking,
  ActivityIndicator,
  InteractionManager,
  Image,
  Switch,
} from 'react-native';
import * as StoreReview from 'expo-store-review';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedTouch from '../components/AnimatedTouch';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import AppUpdateModal from '../components/ui/AppUpdateModal';
import SafeBannerAd from '../components/ui/SafeBannerAd';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import AppConfig from '../config/AppConfig';
import { getPromotedAppsList, launchAppOrPlayStore } from '../utils/crossAppPromoter';
import { getRecentGames, clearAllRecentGames, formatDuration } from '../storage/recentGamesStorage';
import { checkForAppUpdate } from '../services/appUpdateService';
import { SYNC_STORAGE_KEY } from '../services/authService';
import { auth, getProfileFromPHP, updateProfileOnPHP, resetProfileOnPHP } from '../config/firebase';

export default function SettingsScreen({ navigation }) {
  const { showAlert } = useCustomAlert();
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { theme } = useTheme();

  const [langModalVisible, setLangModalVisible] = useState(false);
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const [promotedApps, setPromotedApps] = useState([]);

  // In-App Update states
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  // User Activity Stats
  const [gamesStartedCount, setGamesStartedCount] = useState(0);
  const [totalPlayTimeMs, setTotalPlayTimeMs] = useState(0);

  // App Security
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const APP_LOCK_STORAGE_KEY = 'winplaybox_app_lock_enabled';

  useEffect(() => {
    (async () => {
      const apps = await getPromotedAppsList();
      setPromotedApps(apps);
      
      const lockState = await AsyncStorage.getItem(APP_LOCK_STORAGE_KEY);
      if (lockState === 'true') {
        setAppLockEnabled(true);
      }
      
      const uid = auth.currentUser?.uid;
      if (uid) {
        const profile = await getProfileFromPHP(uid);
        if (profile) {
          setAppLockEnabled(profile.appLockEnabled);
          await AsyncStorage.setItem(APP_LOCK_STORAGE_KEY, profile.appLockEnabled ? 'true' : 'false');
        }
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        getRecentGames().then((history) => {
          setGamesStartedCount(history.length);
          const sumMs = history.reduce((acc, item) => acc + (item.durationMs || 0), 0);
          setTotalPlayTimeMs(sumMs);
        });
      });
      return () => task.cancel();
    }, [])
  );

  const appVersion = Constants.expoConfig?.version || '1.0.1';
  const buildCode = Constants.expoConfig?.android?.versionCode || 2;
  const appPackage = Constants.expoConfig?.android?.package || 'com.winplaybox.gamearcade';

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const suggestedLanguages = useMemo(() => {
    return [
      { code: 'en', label: 'English (US)', nativeLabel: 'English', flag: '🇺🇸' },
      { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
    ];
  }, []);

  const filteredLanguages = useMemo(() => {
    let list = SUPPORTED_LANGUAGES.map((l) => {
      const parts = l.label.split('(');
      const mainName = parts[0].trim();
      const nativeName = parts[1] ? parts[1].replace(')', '').trim() : l.label;
      return {
        ...l,
        mainName,
        nativeName,
      };
    });

    if (langSearchQuery.trim()) {
      const q = langSearchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.label.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q) ||
          l.mainName.toLowerCase().includes(q) ||
          l.nativeName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [langSearchQuery]);

  const handleManualUpdateCheck = async () => {
    setCheckingUpdate(true);
    const res = await checkForAppUpdate();
    setCheckingUpdate(false);

    if (res && res.updateAvailable) {
      setUpdateInfo(res);
      setUpdateModalVisible(true);
    } else {
      showAlert(
        t('app_up_to_date') || 'App Up to Date',
        `You are running the latest version of Game Arcade (v${appVersion}).`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Play instant HTML5 mini games on Game Arcade without installation!\n${AppConfig.playStoreUrl}`,
      });
    } catch (e) { }
  };

  const handleRating = async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      } else {
        Linking.openURL(AppConfig.playStoreUrl).catch(() => { });
      }
    } catch (error) {
      Linking.openURL(AppConfig.playStoreUrl).catch(() => { });
    }
  };

  const handleAbout = () => {
    showAlert(
      'Welcome to Game Arcade! 🎮',
      `Dive into a world of instant fun with hundreds of premium HTML5 mini-games. No downloads, no installations, just tap and play! Challenge yourself, discover new favorites, and share the joy with friends.\n\nReady to play your next favorite game?\n\nVersion ${appVersion} (Build ${buildCode})`,
      [{ text: 'OK' }]
    );
  };

  const toggleAppLock = async (value) => {
    setAppLockEnabled(value);
    await AsyncStorage.setItem(APP_LOCK_STORAGE_KEY, value ? 'true' : 'false');
    
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateProfileOnPHP(uid, { appLockEnabled: value });
    }
  };

  const handleResetProfileAndData = () => {
    showAlert(
      t('reset_profile') || 'Reset Profile & Anonymous Data',
      t('reset_warning') || 'This action will permanently delete your anonymous session data, history, and favorites. This cannot be undone.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove') || 'Permanently Reset',
          style: 'destructive',
          onPress: async () => {
            const uid = auth.currentUser?.uid;
            if (uid) {
              await resetProfileOnPHP(uid);
            }
            await clearAllRecentGames();
            setAppLockEnabled(false);
            await AsyncStorage.setItem(APP_LOCK_STORAGE_KEY, 'false');
            setGamesStartedCount(0);
            setTotalPlayTimeMs(0);
            showAlert('Profile Reset', 'Your game history, favorites, and app lock have been reset.');
          },
        },
      ]
    );
  };

  return (
    <AppLayout
      heroTitle={t('tab_settings')}
      heroSubtitle="Customize your arcade experience"
      currentTab="Settings"
      navigation={navigation}
      scrollable
    >
      <View style={styles.container}>
        {/* Guest Explorer Session Card */}
        <View style={[styles.guestCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.guestAvatarCircle}>
            <SafeIcon name="person-circle-outline" size={38} color={theme.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.guestTitle, { color: theme.text }]}>{t('guest_explorer')}</Text>
            <Text style={[styles.guestBadgeText, { color: theme.subText }]}>{t('anonymous_session')}</Text>
          </View>
          <View style={[styles.activeStatusTag, { backgroundColor: theme.tertiary + '26' }]}>
            <View style={[styles.greenPulseDot, { backgroundColor: theme.tertiary }]} />
            <Text style={[styles.activeStatusText, { color: theme.tertiary }]}>
              Online
            </Text>
          </View>
        </View>

        {/* Your Activity Section */}
        <Text style={[styles.sectionHeader, { color: theme.subText }]}>{t('your_activity')}</Text>

        <View style={styles.activityStatsRow}>
          <AnimatedTouch
            style={[styles.statBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => navigation.navigate('ContinuePlaying')}
          >
            <SafeIcon name="game-controller" size={22} color={theme.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.statValueText, { color: theme.text }]}>{gamesStartedCount}</Text>
            <Text style={[styles.statLabelText, { color: theme.subText }]}>{t('games_started')}</Text>
          </AnimatedTouch>

          <AnimatedTouch
            style={[styles.statBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            onPress={() => navigation.navigate('ContinuePlaying')}
          >
            <SafeIcon name="time" size={22} color={theme.tertiary} style={{ marginBottom: 4 }} />
            <Text style={[styles.statValueText, { color: theme.text }]}>
              {formatDuration(totalPlayTimeMs)}
            </Text>
            <Text style={[styles.statLabelText, { color: theme.subText }]}>{t('total_playtime')}</Text>
          </AnimatedTouch>
        </View>

        {/* Contribute & Support Section */}
        <Text style={[styles.sectionHeader, { color: theme.subText }]}>{t('contribute_feedback')}</Text>

        {/* Missing a Game? Submit Game Screen link */}
        <AnimatedTouch
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate('SubmitGame')}
        >
          <SafeIcon name="add-circle-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>{t('missing_game')}</Text>
            <Text style={{ fontSize: 12, color: theme.subText, marginTop: 1 }}>{t('contribute_sub')}</Text>
          </View>
          <SafeIcon name="chevron-forward" size={18} color={theme.subText} />
        </AnimatedTouch>

        {/* Report an Issue Screen link */}
        <AnimatedTouch
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate('ReportIssue')}
        >
          <SafeIcon name="warning-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>{t('report_issue_menu')}</Text>
            <Text style={{ fontSize: 12, color: theme.subText, marginTop: 1 }}>{t('report_issue_sub_menu')}</Text>
          </View>
          <SafeIcon name="chevron-forward" size={18} color={theme.subText} />
        </AnimatedTouch>

        {/* Account & General Preferences Section */}
        <Text style={[styles.sectionHeader, { color: theme.subText }]}>{t('preferences_about')}</Text>

        {/* Biometric App Lock Toggle */}
        <View style={[styles.menuRow, { borderBottomColor: theme.border }]}>
          <SafeIcon name="lock-closed-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>{t('biometric_app_lock') || 'Biometric App Lock'}</Text>
            <Text style={{ fontSize: 12, color: theme.subText, marginTop: 1 }}>{t('biometric_app_lock_sub') || 'Require Fingerprint/FaceID to open app'}</Text>
          </View>
          <Switch
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={theme.onPrimary}
            ios_backgroundColor={theme.border}
            onValueChange={toggleAppLock}
            value={appLockEnabled}
          />
        </View>

        {/* Manual Check for App Updates Row */}
        <AnimatedTouch
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleManualUpdateCheck}
          disabled={checkingUpdate}
        >
          <SafeIcon name="rocket-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text, flex: 1 }]}>
            {t('check_for_updates')}
          </Text>
          {checkingUpdate ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <View style={styles.versionBadge}>
              <Text style={[styles.versionBadgeText, { color: theme.primary }]}>v{appVersion}</Text>
            </View>
          )}
        </AnimatedTouch>

        {/* Language Selection */}
        <AnimatedTouch
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate('Language')}
        >
          <SafeIcon name="globe-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text, flex: 1 }]}>{t('select_language')}</Text>
          <View style={styles.langValueBadge}>
            <Text style={[styles.langValueText, { color: theme.primary }]}>
              {activeLangObj.flag} {activeLangObj.label}
            </Text>
            <SafeIcon name="chevron-forward" size={16} color={theme.subText} style={{ marginLeft: 4 }} />
          </View>
        </AnimatedTouch>

        {/* About App */}
        <AnimatedTouch
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleAbout}
        >
          <SafeIcon name="information-circle-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('about_app')}</Text>
        </AnimatedTouch>

        {/* Share App */}
        <AnimatedTouch
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleShare}
        >
          <SafeIcon name="share-social-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('share_app')}</Text>
        </AnimatedTouch>

        {/* Rate App */}
        <AnimatedTouch
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleRating}
        >
          <SafeIcon name="star-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('rate_app')}</Text>
        </AnimatedTouch>

        {/* Dynamic More Apps by Winplaybox Section */}
        {promotedApps.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: theme.subText }]}>
              {t('more_apps_by_winplaybox')}
            </Text>

            {promotedApps.map((app) => (
              <AnimatedTouch
                key={app.id}
                style={[styles.menuRow, { borderBottomColor: theme.border }]}
                onPress={() => launchAppOrPlayStore(app)}
              >
                <SafeIcon name={app.icon || 'grid-outline'} size={24} color={app.iconColor || theme.primary} style={styles.menuIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>{app.name}</Text>
                  <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>{app.description}</Text>
                </View>
                <SafeIcon name="open-outline" size={18} color={theme.subText} />
              </AnimatedTouch>
            ))}
          </>
        )}

        {/* Reset Profile & Anonymous Data Danger Button */}
        <AnimatedTouch
          style={[styles.resetDangerBtn, { backgroundColor: theme.accentLight, borderColor: theme.primary + '4D' }]}
          onPress={handleResetProfileAndData}
        >
          <SafeIcon name="alert-circle-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.resetDangerText, { color: theme.primary }]}>{t('reset_profile')}</Text>
        </AnimatedTouch>
        <Text style={[styles.resetWarningSubText, { color: theme.subText }]}>
          {t('reset_warning')}
        </Text>

        {/* Bottom Version Footer */}
        <View style={styles.versionFooter}>
          <Text style={[styles.versionFooterTitle, { color: theme.text }]}>{t('app_name')}</Text>
          <Text style={[styles.versionFooterSub, { color: theme.subText }]}>
            Version {appVersion} (Build {buildCode})
          </Text>
          <Text style={[styles.versionFooterCopy, { color: theme.subText }]}>
            © {new Date().getFullYear()} Winplaybox. All rights reserved.
          </Text>
        </View>
        <SafeBannerAd />
      </View>

      {/* Manual In-App Update Modal */}
      <AppUpdateModal
        visible={updateModalVisible}
        updateInfo={updateInfo}
        onDismiss={() => setUpdateModalVisible(false)}
      />
    </AppLayout>
  );
}

import styles from '../styles/SettingsScreen.styles.js';
import { useCustomAlert } from '../context/AlertContext';
