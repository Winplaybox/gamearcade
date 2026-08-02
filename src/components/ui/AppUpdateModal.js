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
    openPlayStorePage(info.playStoreUrl || info.directDownloadUrl);
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
                {t('update_required') || 'Update Required'}
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
                  <Text style={styles.updateNowBtnText}>{t('update_now') || 'Update Now'}</Text>
                  <SafeIcon name="download-outline" size={18} color="#210B0E" style={{ marginLeft: 6 }} />
                </View>
              </AnimatedTouch>

              {/* Optional Later Link for flexible updates */}
              {!isForce && (
                <TouchableOpacity
                  style={styles.laterBtn}
                  onPress={onDismiss}
                  activeOpacity={0.7}
                >
                  <Text style={styles.laterBtnText}>{t('cancel') || 'Later'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
    width: '100%',
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginBottom: 28,
  },
  appIconBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: '#261819',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  appIconImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  descriptionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 12,
    fontWeight: '400',
  },
  updateNowBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF6B7A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateNowBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#210B0E',
  },
  laterBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  laterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.45)',
  },
});
