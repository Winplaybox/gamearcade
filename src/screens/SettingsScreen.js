import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AppLayout from '../components/AppLayout';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { getPromotedAppsList, launchAppOrPlayStore } from '../utils/crossAppPromoter';

export default function SettingsScreen({ navigation }) {
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { theme } = useTheme();

  const [langModalVisible, setLangModalVisible] = useState(false);
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const [promotedApps, setPromotedApps] = useState([]);

  useEffect(() => {
    (async () => {
      const apps = await getPromotedAppsList();
      setPromotedApps(apps);
    })();
  }, []);

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildCode = Constants.expoConfig?.android?.versionCode || '1';
  const appPackage = Constants.expoConfig?.android?.package || 'com.winplaybox.gamearcade';

  const activeLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const filteredLanguages = useMemo(() => {
    let list = SUPPORTED_LANGUAGES;
    if (langSearchQuery.trim()) {
      const q = langSearchQuery.toLowerCase().trim();
      list = SUPPORTED_LANGUAGES.filter(
        (l) => l.label.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [langSearchQuery]);

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

  return (
    <AppLayout title={t('tab_settings')} currentTab="Settings" navigation={navigation} scrollable>
      <View style={styles.container}>
        {/* Language Selection */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={() => setLangModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="globe-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('select_language')}</Text>
          <View style={styles.langValueBadge}>
            <Text style={[styles.langValueText, { color: theme.primary }]}>
              {activeLangObj.flag} {activeLangObj.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.subText} style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>

        {/* About App */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleAbout}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={24} color={theme.text} style={styles.menuIcon} />
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
          <Ionicons name="share-social-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('share_app')}</Text>
        </TouchableOpacity>

        {/* Rate App */}
        <TouchableOpacity
          style={[styles.menuRow, { borderBottomColor: theme.border }]}
          onPress={handleRating}
          activeOpacity={0.7}
        >
          <Ionicons name="star-outline" size={24} color={theme.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: theme.text }]}>{t('rate_app')}</Text>
        </TouchableOpacity>

        {/* Dynamic More Apps by Winplaybox Section */}
        {promotedApps.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: theme.subText }]}>
              MORE APPS BY WINPLAYBOX
            </Text>

            {promotedApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={[styles.menuRow, { borderBottomColor: theme.border }]}
                onPress={() => launchAppOrPlayStore(app)}
                activeOpacity={0.7}
              >
                <Ionicons name={app.icon || 'apps-outline'} size={24} color={app.iconColor || theme.primary} style={styles.menuIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>{app.name}</Text>
                  <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>{app.description}</Text>
                </View>
                <Ionicons name="open-outline" size={18} color={theme.subText} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Market / Play Store Style Bottom Version Footer */}
        <View style={styles.versionFooter}>
          <Text style={[styles.versionFooterTitle, { color: theme.text }]}>Game Arcade</Text>
          <Text style={[styles.versionFooterSub, { color: theme.subText }]}>
            Version {appVersion} (Build {buildCode})
          </Text>
          <Text style={[styles.versionFooterCopy, { color: theme.subText }]}>
            © {new Date().getFullYear()} Winplaybox. All rights reserved.
          </Text>
        </View>
      </View>

      {/* Language Selection Modal */}
      <Modal visible={langModalVisible} transparent animationType="fade" onRequestClose={() => setLangModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setLangModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>{t('select_language')}</Text>
                  <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                    <Ionicons name="close" size={22} color={theme.subText} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={filteredLanguages}
                  keyExtractor={(item) => item.code}
                  style={{ maxHeight: 350 }}
                  renderItem={({ item }) => {
                    const isSelected = item.code === currentLanguage;
                    return (
                      <TouchableOpacity
                        style={[styles.langItemRow, { borderBottomColor: theme.border }]}
                        onPress={() => {
                          setLanguage(item.code);
                          setLangModalVisible(false);
                        }}
                      >
                        <Text style={styles.langFlag}>{item.flag}</Text>
                        <Text style={[styles.langLabel, { color: isSelected ? theme.primary : theme.text }]}>
                          {item.label}
                        </Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  versionFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  langItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  langFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  langLabel: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});
