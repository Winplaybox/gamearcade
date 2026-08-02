import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { getLiveCategoriesList } from '../services/gameService';
import { submitGameToFirestore } from '../config/firebase';

export default function SubmitGameScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [title, setTitle] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await getLiveCategoriesList();
      setCategories(list);
      if (list.length > 0) setCategory(list[0].title);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t('error') || 'Error', t('please_enter_title') || 'Please enter a game title.');
      return;
    }
    if (!ownerName.trim()) {
      Alert.alert(t('error') || 'Error', t('please_enter_name') || 'Please enter your name.');
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      Alert.alert(t('error') || 'Error', t('please_enter_valid_email') || 'Please enter a valid email address.');
      return;
    }
    if (!gameUrl.trim() || !gameUrl.startsWith('http')) {
      Alert.alert(t('error') || 'Error', t('please_enter_valid_url') || 'Please enter a valid playable game URL starting with http:// or https://');
      return;
    }

    setSubmitting(true);
    const res = await submitGameToFirestore({
      title: title.trim(),
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      gameUrl: gameUrl.trim(),
      category: category || 'Arcade',
      description: description.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      Alert.alert(
        t('submission_received_title') || 'Submission Received! 🎉',
        t('submission_received_msg') || 'Thank you! Your game submission has been sent for approval. Our team will review it shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('Home');
            },
          },
        ]
      );
    } else {
      Alert.alert(t('error') || 'Error', t('could_not_submit') || 'Could not submit your game. Please try again later.');
    }
  };

  return (
    <AppLayout showHeader={false} navigation={navigation} scrollable>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Top Header Banner matching Reference Image 1 */}
        <View style={styles.heroBox}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>{t('submit_game_title')}</Text>
          <Text style={[styles.heroSubTitle, { color: theme.subText }]}>
            {t('submit_game_sub')}
          </Text>
        </View>

        {/* Form Card Wrapper matching Reference Image 1 */}
        <View style={[styles.formCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Game Title Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>{t('game_title_label')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder={t('game_title_placeholder')}
              placeholderTextColor={theme.subText}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Owner Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>{t('your_name_label')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder={t('your_name_placeholder')}
              placeholderTextColor={theme.subText}
              value={ownerName}
              onChangeText={setOwnerName}
            />
          </View>

          {/* Owner Email Field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>{t('your_email_label')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder={t('your_email_placeholder')}
              placeholderTextColor={theme.subText}
              keyboardType="email-address"
              autoCapitalize="none"
              value={ownerEmail}
              onChangeText={setOwnerEmail}
            />
          </View>

          {/* Playable URL Field with link icon */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>{t('playable_url_label')}</Text>
            <View style={[styles.urlInputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <SafeIcon name="link-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.urlInput, { color: theme.text }]}
                placeholder={t('playable_url_placeholder')}
                placeholderTextColor={theme.subText}
                keyboardType="url"
                autoCapitalize="none"
                value={gameUrl}
                onChangeText={setGameUrl}
              />
            </View>
          </View>

          {/* Category Dropdown Selector */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.subText }]}>{t('category_label')}</Text>
            <TouchableOpacity
              style={[styles.dropdownBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
              onPress={() => setCategoryModalVisible(true)}
              activeOpacity={0.8}
            >
              <SafeIcon name="game-controller-outline" size={18} color={theme.subText} style={{ marginRight: 10 }} />
              <Text style={[styles.dropdownText, { color: theme.text }]}>
                {category || t('select_category')}
              </Text>
              <SafeIcon name="chevron-down" size={18} color={theme.subText} />
            </TouchableOpacity>
          </View>

          {/* Short Description Field with 0/100 counter */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelCounterRow}>
              <Text style={[styles.fieldLabel, { color: theme.subText }]}>{t('short_desc_label')}</Text>
              <Text style={[styles.counterText, { color: theme.subText }]}>
                {description.length}/100
              </Text>
            </View>
            <TextInput
              style={[
                styles.textAreaInput,
                { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
              ]}
              placeholder={t('short_desc_placeholder') || "What makes this game special?"}
              placeholderTextColor={theme.subText}
              multiline
              maxLength={100}
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Notice Box matching Reference Image 1 */}
        <View style={[styles.noticeBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.noticeDot} />
          <Text style={[styles.noticeText, { color: theme.subText }]}>
            {t('submission_notice')}
          </Text>
        </View>

        {/* Modular Primary CTA Submit Button matching Reference Image 1 */}
        <PrimaryButton
          title={t('send_approval')}
          onPress={handleSubmit}
          loading={submitting}
          height={52}
          borderRadius={26}
          iconName="caret-forward"
        />

        {/* Bottom Back to Settings Link */}
        <TouchableOpacity
          style={styles.backLinkBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Settings');
          }}
          activeOpacity={0.7}
        >
          <SafeIcon name="arrow-back" size={16} color={theme.subText} style={{ marginRight: 6 }} />
          <Text style={[styles.backLinkText, { color: theme.subText }]}>{t('back_to_settings') || 'Back to Settings'}</Text>
        </TouchableOpacity>

        {/* Category Selection Modal Dropdown */}
        <Modal
          visible={categoryModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('select_category') || 'Select Category'}</Text>
                <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                  <SafeIcon name="close" size={22} color={theme.subText} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 350 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalCategoryRow, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      setCategory(item.title);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <SafeIcon name={item.icon || 'game-controller-outline'} size={18} color={theme.primary} style={{ marginRight: 10 }} />
                    <Text style={[styles.modalCategoryText, { color: theme.text }]}>{item.title}</Text>
                    {category === item.title && <SafeIcon name="checkmark-circle" size={18} color={theme.primary} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  heroBox: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  labelCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  urlInput: {
    flex: 1,
    fontSize: 14,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  textAreaInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E94560',
    marginTop: 5,
    marginRight: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  backLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCategoryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
