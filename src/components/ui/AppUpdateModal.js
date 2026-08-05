import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import SafeIcon from '../SafeIcon';
import AnimatedTouch from '../AnimatedTouch';
import { useTranslation } from '../../i18n/i18n';
import { useTheme } from '../../theme/ThemeContext';
import { openPlayStorePage } from '../../services/appUpdateService';
import { showBackNavInterstitial } from '../../ads/AdManager';

export default function AppUpdateModal({
  visible,
  updateInfo,
  onDismiss,
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // If no update info passed, fallback to default display parameters
  const info = updateInfo || {
    updateAvailable: true,
    isForceUpdate: true,
    latestVersion: '1.0.1',
    releaseNotes: 'A newer version of Game Arcade is available with performance improvements and new games.',
  };

  const isForce = info.isForceUpdate !== false;

  const handleUpdatePress = () => {
    showBackNavInterstitial(() => {
      openPlayStorePage(info.playStoreUrl || info.directDownloadUrl);
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!isForce && onDismiss) onDismiss();
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          if (!isForce && onDismiss) onDismiss();
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheetContainer, { backgroundColor: '#181112', borderColor: 'rgba(255,255,255,0.08)' }]}>
              {/* Top Handle Drag Bar */}
              <View style={styles.handleBar} />

              {/* Centered App Icon Badge Frame */}
              <View style={styles.appIconBox}>
                <Image
                  source={require('../../../assets/icon.png')}
                  style={styles.appIconImage}
                  resizeMode="contain"
                />
              </View>

              {/* Main Headline */}
              <Text style={styles.titleText}>
                {t('update_required')}
              </Text>

              {/* Subtitle Description */}
              <Text style={styles.descriptionText}>
                {info.releaseNotes ||
                  t('update_required_desc') ||
                  'A newer version of Game Arcade is available with performance improvements and new games.'}
              </Text>

              {/* Bottom Primary Action Button: "Update Now 📥" */}
              <AnimatedTouch
                style={styles.updateNowBtn}
                onPress={handleUpdatePress}
                activeOpacity={0.88}
              >
                <View style={styles.btnContentRow}>
                  <Text style={styles.updateNowBtnText}>{t('update_now')}</Text>
                  <SafeIcon name="download-outline" size={18} color="#210B0E" style={{ marginLeft: 6 }} />
                </View>
              </AnimatedTouch>

              {/* Optional Later Link for flexible updates */}
              {!isForce && (
                <AnimatedTouch
                  style={styles.laterBtn}
                  onPress={onDismiss}
                >
                  <Text style={styles.laterBtnText}>{t('cancel')}</Text>
                </AnimatedTouch>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

import styles from '../../styles/AppUpdateModal.styles.js';
