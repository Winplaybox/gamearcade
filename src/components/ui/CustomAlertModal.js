import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/i18n';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let BlurView = View;
if (!isExpoGo) {
  BlurView = require('expo-blur').BlurView;
}

const { width } = Dimensions.get('window');

export default function CustomAlertModal({ visible, title, message, buttons, onClose }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {isExpoGo ? null : (
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />
          )}
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              {title ? (
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              ) : null}
              {message ? (
                <Text style={[styles.message, { color: theme.subText }]}>{message}</Text>
              ) : null}

              <View style={styles.buttonRow}>
                {buttons && buttons.length > 0 ? (
                  buttons.map((btn, index) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';
                    let btnColor = theme.primary;
                    if (isCancel) btnColor = theme.subText;
                    if (isDestructive) btnColor = theme.primary;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.button,
                          buttons.length === 2 && index === 0 && { marginRight: 8 },
                          isCancel ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border } : { backgroundColor: btnColor }
                        ]}
                        onPress={() => {
                          if (btn.onPress) btn.onPress();
                          else onClose();
                        }}
                      >
                        <Text style={[
                          styles.buttonText,
                          isCancel ? { color: theme.text } : { color: theme.onPrimary }
                        ]}>
                          {btn.text || t('ok') || 'OK'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary, flex: 1 }]}
                    onPress={onClose}
                  >
                    <Text style={[styles.buttonText, { color: theme.onPrimary }]}>{t('ok') || 'OK'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
