import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Linking,
  Alert,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import AppUpdateModal from '../components/ui/AppUpdateModal';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { getPromotedAppsList, launchAppOrPlayStore } from '../utils/crossAppPromoter';
import { getRecentGames, clearAllRecentGames, formatDuration } from '../storage/recentGamesStorage';
import { checkForAppUpdate } from '../services/appUpdateService';

export default function SettingsScreen({ navigation }) {
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

  useEffect(() => {
    (async () => {
      const apps = await getPromotedAppsList();
      setPromotedApps(apps);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getRecentGames().then((history) => {
        setGamesStartedCount(history.length);
        const sumMs = history.reduce((acc, item) => acc + (item.durationMs || 120000), 0);
        setTotalPlayTimeMs(sumMs);
      });
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
      Alert.alert(
        t('app_up_to_date') || 'App Up to Date',
        `You are running the latest version of Game Arcade (v${appVersion}).`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Play instant HTML5 mini games on Game Arcade without installation!\nhttps://play.google.com/store/apps/details?id=${appPackage}`,
      });
    } catch (e) {}
  };

  const handleRating = () => {
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${appPackage}`;
    Linking.openURL(playStoreUrl).catch(() => {});
  };

  const handleAbout = () => {
    Alert.alert(
      t('about_app'),
      `Game Arcade\nVersion ${appVersion} (Build ${buildCode})\nPackage: ${appPackage}\n\nPlay instant HTML5 mini games online without installation.`,
      [{ text: 'OK' }]
    );
  };

  const handleClearLocalData = () => {
    Alert.alert(
      t('clear_local_cache') || 'Clear Local Data',
      'Are you sure you want to clear your local game history & cache?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear_all') || 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            await clearAllRecentGames();
            setGamesStartedCount(0);
            setTotalPlayTimeMs(0);
            Alert.alert('Success', 'Local data and cache cleared.');
          },
        },
      ]
    );
  };

  const handleResetProfileAndData = () => {
    Alert.alert(
      t('reset_profile') || 'Reset Profile & Anonymous Data',
      t('reset_warning') || 'This action will permanently delete your anonymous session data, history, and favorites. This cannot be undone.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove') || 'Permanently Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setGamesStartedCount(0);
            setTotalPlayTimeMs(0);
            Alert.alert('Profile Reset', 'Your anonymous session data has been completely reset.');
          },
        },
      ]
    );
  };

  return (
    <AppLayout
      title={t('tab_settings')}
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
          <View style={[styles.activeStatusTag, { backgroundColor: 'rgba(103,220,159,0.15)' }]}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.activeStatusText}>{t('active')}</Text>
          </View>
        </View>

        {/* Your Activity Section */}
        <Text style={[styles.sectionHeader, { color: theme.subText }]}>{t('your_activity')}</Text>
        <View style={styles.activityStatsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <SafeIcon name="game-controller" size={22} color={theme.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.statValueText, { color: theme.text }]}>{gamesStartedCount}</Text>
            <Text style={[styles.statLabelText, { color: theme.subText }]}>{t('games_started')}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <SafeIcon name="time" size={22} color="#67DC9F" style={{ marginBottom: 4 }} />
            <Text style={[styles.statValueText, { color: theme.text }]}>
              {formatDuration(totalPlayTimeMs)}
            </Text>
            <Text style={[styles.statLabelText, { color: theme.subText }]}>{t('total_playtime')}</Text>
          </View>
        </View>

        {/* Contribute & Support Section */}
        <Text style={[styles.sectionHeader, { color: theme.subText }]}>{t('contribute_feedback')}</Text>

        {/* Missing a Game? Submit Game Screen link */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate('SubmitGame')}
          activeOpacity={0.7}
        >
          <SafeIcon name="add-circle-outline" size={24} color={theme.primary} style={styles.menuIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>{t('missing_game')}</Text>
            <Text style={{ fontSize: 12, color: theme.subText, marginTop: 1 }}>{t('contribute_sub')}</Text>
          </View>
          <SafeIcon name="chevron-forward" size={18} color={theme.subText} />
        </TouchableOpacity>

        {/* Report an Issue Screen link */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate('ReportIssue')}
          activeOpacity={0.7}
        >
          <SafeIcon name="warning-outline" size={24} color="#E94560" style={styles.menuIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: theme.text }]}>{t('report_issue_menu')}</Text>
            <Text style={{ fontSize: 12, color: theme.subText, marginTop: 1 }}>{t('report_issue_sub_menu')}</Text>
          </View>
          <SafeIcon name="chevron-forward" size={18} color={theme.subText} />
        </TouchableOpacity>

        {/* Account & General Preferences Section */}
        <Text style={[styles.sectionHeader, { color: theme.subText }]}>{t('preferences_about')}</Text>

        {/* Manual Check for App Updates Row */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleManualUpdateCheck}
          disabled={checkingUpdate}
          activeOpacity={0.7}
        >
          <SafeIcon name="rocket-outline" size={24} color={theme.primary} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text, flex: 1 }]}>
            {t('check_for_updates') || 'Check for Updates'}
          </Text>
          {checkingUpdate ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <View style={styles.versionBadge}>
              <Text style={[styles.versionBadgeText, { color: theme.primary }]}>v{appVersion}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Language Selection */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate('Language')}
          activeOpacity={0.7}
        >
          <SafeIcon name="globe-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('select_language')}</Text>
          <View style={styles.langValueBadge}>
            <Text style={[styles.langValueText, { color: theme.primary }]}>
              {activeLangObj.flag} {activeLangObj.label}
            </Text>
            <SafeIcon name="chevron-forward" size={16} color={theme.subText} style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>

        {/* Clear Local Data */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleClearLocalData}
          activeOpacity={0.7}
        >
          <SafeIcon name="trash-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('clear_local_cache')}</Text>
        </TouchableOpacity>

        {/* About App */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleAbout}
          activeOpacity={0.7}
        >
          <SafeIcon name="information-circle-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('about_app')}</Text>
          <View style={styles.versionBadge}>
            <Text style={[styles.versionBadgeText, { color: theme.primary }]}>v{appVersion}</Text>
          </View>
        </TouchableOpacity>

        {/* Share App */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <SafeIcon name="share-social-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('share_app')}</Text>
        </TouchableOpacity>

        {/* Rate App */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleRating}
          activeOpacity={0.7}
        >
          <SafeIcon name="star-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('rate_app')}</Text>
        </TouchableOpacity>

        {/* Dynamic More Apps by Winplaybox Section */}
        {promotedApps.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: theme.subText }]}>
              {t('more_apps_by_winplaybox')}
            </Text>

            {promotedApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={[styles.menuRow, { borderBottomColor: theme.border }]}
                onPress={() => launchAppOrPlayStore(app)}
                activeOpacity={0.7}
              >
                <SafeIcon name={app.icon || 'apps-outline'} size={24} color={app.iconColor || theme.primary} style={styles.menuIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>{app.name}</Text>
                  <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>{app.description}</Text>
                </View>
                <SafeIcon name="open-outline" size={18} color={theme.subText} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Reset Profile & Anonymous Data Danger Button */}
        <TouchableOpacity
          style={[styles.resetDangerBtn, { backgroundColor: 'rgba(233,69,96,0.12)', borderColor: 'rgba(233,69,96,0.3)' }]}
          onPress={handleResetProfileAndData}
          activeOpacity={0.8}
        >
          <SafeIcon name="alert-circle-outline" size={20} color="#E94560" style={{ marginRight: 8 }} />
          <Text style={styles.resetDangerText}>{t('reset_profile')}</Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  guestAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  guestBadgeText: {
    fontSize: 12,
    marginTop: 2,
  },
  activeStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#67DC9F',
    marginRight: 5,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#67DC9F',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  activityStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'flex-start',
  },
  statValueText: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  statLabelText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  langValueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langValueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  versionBadge: {
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  resetDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  resetDangerText: {
    color: '#E94560',
    fontSize: 14,
    fontWeight: '700',
  },
  resetWarningSubText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 30,
    lineHeight: 16,
  },
  versionFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  versionFooterTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  versionFooterSub: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  versionFooterCopy: {
    fontSize: 11,
  },
  langScreenContainer: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  langScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  langBackBtn: {
    padding: 6,
    marginRight: 12,
  },
  langScreenTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  langPillSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
  },
  langPillSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  langListContent: {
    paddingBottom: 32,
  },
  langSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  langCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  langCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  langCardSub: {
    fontSize: 13,
    marginTop: 2,
  },
  checkCircleBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
