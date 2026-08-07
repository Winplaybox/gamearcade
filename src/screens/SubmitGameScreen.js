import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import AnimatedTouch from '../components/AnimatedTouch';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import PrimaryButton from '../components/ui/PrimaryButton';
import SafeBannerAd from '../components/ui/SafeBannerAd';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { getLiveCategoriesList } from '../services/gameService';
import { auth, submitGameToPHP } from '../config/firebase';
import { showBackNavInterstitial } from '../ads/AdManager';

export default function SubmitGameScreen({ route, navigation }) {
  const { showAlert } = useCustomAlert();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const initialCatParam = route?.params?.initialCategory || route?.params?.category || '';

  const [title, setTitle] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [category, setCategory] = useState(initialCatParam);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await getLiveCategoriesList();
      setCategories(list);
      if (initialCatParam) {
        setCategory(initialCatParam);
      } else if (list.length > 0) {
        setCategory(list[0].title);
      }
    })();
  }, [initialCatParam]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert(t('error') || 'Error', t('please_enter_title') || 'Please enter a game title.');
      return;
    }
    if (!ownerName.trim()) {
      showAlert(t('error') || 'Error', t('please_enter_name') || 'Please enter your name.');
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      showAlert(t('error') || 'Error', t('please_enter_valid_email') || 'Please enter a valid email address.');
      return;
    }
    if (!gameUrl.trim() || !gameUrl.startsWith('http')) {
      showAlert(t('error') || 'Error', t('please_enter_valid_url') || 'Please enter a valid playable game URL starting with http:// or https://');
      return;
    }

    setSubmitting(true);
    const res = await submitGameToPHP({
      userId: auth.currentUser?.uid || null,
      title: title.trim(),
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim(),
      gameUrl: gameUrl.trim(),
      category: category || 'Arcade',
      description: description.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      showAlert(
        t('submission_received_title') || 'Submission Received! 🎉',
        t('submission_received_msg') || 'Thank you! Your game submission has been sent for approval. Our team will review it shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              showBackNavInterstitial(() => {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.navigate('Home');
              }, 'SubmitGameScreen', 'Submitted Game');
            },
          },
        ]
      );
    } else {
      showAlert(t('error') || 'Error', t('could_not_submit') || 'Could not submit your game. Please try again later.');
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
            <AnimatedTouch
              style={[styles.dropdownBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
              onPress={() => setCategoryModalVisible(true)}
            >
              <SafeIcon name="game-controller-outline" size={18} color={theme.subText} style={{ marginRight: 10 }} />
              <Text style={[styles.dropdownText, { color: theme.text }]}>
                {category || t('select_category')}
              </Text>
              <SafeIcon name="chevron-down" size={18} color={theme.subText} />
            </AnimatedTouch>
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
              placeholder={t('short_desc_placeholder')}
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
          <View style={[styles.noticeDot, { backgroundColor: theme.primary }]} />
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
        />

        {/* Bottom Back Link */}
        <AnimatedTouch
          style={styles.backLinkBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Settings');
          }}
        >
          <Text style={[styles.backLinkText, { color: theme.subText }]}>{t('back_to_settings')}</Text>
        </AnimatedTouch>
        <SafeBannerAd />

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
                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('select_category')}</Text>
                <AnimatedTouch onPress={() => setCategoryModalVisible(false)}>
                  <SafeIcon name="close" size={22} color={theme.subText} />
                </AnimatedTouch>
              </View>

              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 350 }}
                renderItem={({ item }) => (
                  <AnimatedTouch
                    style={[styles.modalCategoryRow, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      setCategory(item.title);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <SafeIcon name={item.icon || 'game-controller-outline'} size={18} color={theme.primary} style={{ marginRight: 10 }} />
                    <Text style={[styles.modalCategoryText, { color: theme.text }]}>{item.title}</Text>
                    {category === item.title && <SafeIcon name="checkmark-circle" size={18} color={theme.primary} />}
                  </AnimatedTouch>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    </AppLayout>
  );
}

import styles from '../styles/SubmitGameScreen.styles.js';
import { useCustomAlert } from '../context/AlertContext';
