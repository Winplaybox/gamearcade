import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
} from 'react-native';
import AnimatedTouch from '../components/AnimatedTouch';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import PrimaryButton from '../components/ui/PrimaryButton';
import SafeBannerAd from '../components/ui/SafeBannerAd';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { auth, submitIssueReportToPHP } from '../config/firebase';
import { showBackNavInterstitial } from '../ads/AdManager';

const REPORT_ISSUE_TYPES = [
  { id: 'doesnt_load', labelKey: 'game_not_loading', fallback: "Doesn't Load", icon: 'time-outline' },
  { id: 'inappropriate', labelKey: 'inappropriate_content', fallback: 'Inappropriate Content', icon: 'shield-outline' },
  { id: 'broken_controls', labelKey: 'broken_controls', fallback: 'Broken Controls', icon: 'game-controller-outline' },
  { id: 'other', labelKey: 'other_issue', fallback: 'Other', icon: 'chatbubble-ellipses-outline' },
];

export default function ReportIssueScreen({ route, navigation }) {
  const { showAlert } = useCustomAlert();
  const { t } = useTranslation();
  const { theme } = useTheme();

  const game = route?.params?.game || null;

  const [selectedIssueId, setSelectedIssueId] = useState(REPORT_ISSUE_TYPES[0].id);
  const [details, setDetails] = useState('');
  const [manualGameTitle, setManualGameTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const selectedObj = REPORT_ISSUE_TYPES.find((i) => i.id === selectedIssueId);
    const issueLabel = t(selectedObj?.labelKey) || selectedObj?.fallback;

    const res = await submitIssueReportToPHP({
      userId: auth.currentUser?.uid || null,
      gameId: game?.id || null,
      gameTitle: game?.title || manualGameTitle.trim() || 'General Arcade App Issue',
      issueType: issueLabel,
      details: details.trim(),
    });

    setSubmitting(false);

    if (res.success) {
      showAlert(
        t('report_submitted_title') || 'Report Submitted! 🚨',
        t('report_submitted_msg') || 'Thank you! Your report has been submitted to our team for verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              showBackNavInterstitial(() => {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.navigate('Settings');
              }, 'ReportIssueScreen', 'Submitted Report');
            },
          },
        ]
      );
    } else {
      showAlert(t('error') || 'Error', t('could_not_submit') || 'Could not submit your report. Please try again later.');
    }
  };

  return (
    <AppLayout showHeader={false} navigation={navigation} scrollable>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Header Hero Card matching Reference Image 2 */}
        <View style={[styles.headerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={[styles.headerIconCircle, { backgroundColor: theme.accentLight }]}>
            <SafeIcon name="warning-outline" size={28} color={theme.primary} />
          </View>
          <View style={[styles.badgeRow, { backgroundColor: theme.accentLight }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>{t('feedback_portal')}</Text>
          </View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{t('report_issue_menu')}</Text>
          <Text style={[styles.cardSubTitle, { color: theme.subText }]}>
            {game?.title
              ? `${t('report_issue_with')} "${game.title}"`
              : t('report_issue_sub')}
          </Text>
        </View>

        {/* Issue Type Selection Card matching Reference Image 2 */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>{t('whats_the_issue')}</Text>

        {REPORT_ISSUE_TYPES.map((item) => {
          const isSelected = selectedIssueId === item.id;
          return (
            <AnimatedTouch
              key={item.id}
              style={[
                styles.radioRowCard,
                {
                  backgroundColor: isSelected ? theme.accentLight : theme.cardBg,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSelectedIssueId(item.id)}
            >
              <View style={[styles.iconBoxCircle, { backgroundColor: isSelected ? theme.accentLight : theme.subBg }]}>
                <SafeIcon
                  name={item.icon}
                  size={18}
                  color={isSelected ? theme.primary : theme.subText}
                />
              </View>

              <Text style={[styles.radioRowLabel, { color: isSelected ? theme.text : theme.subText }]}>
                {t(item.labelKey) || item.fallback}
              </Text>
              <SafeIcon
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={isSelected ? theme.primary : theme.subText}
              />
            </AnimatedTouch>
          );
        })}

        {/* Optional Manual Game Title Input (If accessed from Settings without a game) */}
        {!game && (
          <>
            <View style={[styles.detailsHeaderRow, { marginTop: 16 }]}>
              <Text style={[styles.sectionTitle, { color: theme.subText, marginBottom: 0 }]}>{t('which_game_issue') || 'Which game has the issue?'}</Text>
              <Text style={[styles.optionalTagText, { color: theme.subText }]}>{t('optional')}</Text>
            </View>
            <TextInput
              style={[
                styles.detailsTextArea,
                { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text, minHeight: 48, marginTop: 8 },
              ]}
              placeholder={t('game_name_placeholder') || 'Enter game name...'}
              placeholderTextColor={theme.subText}
              value={manualGameTitle}
              onChangeText={setManualGameTitle}
            />
          </>
        )}

        {/* Details Multiline Input matching Reference Image 2 */}
        <View style={[styles.detailsHeaderRow, { marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: theme.subText, marginBottom: 0 }]}>{t('additional_details_label')}</Text>
          <Text style={[styles.optionalTagText, { color: theme.subText }]}>{t('optional')}</Text>
        </View>

        <TextInput
          style={[
            styles.detailsTextArea,
            { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text },
          ]}
          placeholder={t('describe_issue_placeholder')}
          placeholderTextColor={theme.subText}
          multiline
          numberOfLines={4}
          value={details}
          onChangeText={setDetails}
        />

        {/* Modular Primary Submit Action Button matching Reference Image 2 */}
        <PrimaryButton
          title={t('submit_report')}
          onPress={handleSubmit}
          loading={submitting}
          height={52}
          borderRadius={26}
        />

        {/* Cancel Button */}
        <AnimatedTouch
          style={styles.cancelBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Settings');
          }}
        >
          <Text style={[styles.cancelBtnText, { color: theme.subText }]}>{t('cancel')}</Text>
        </AnimatedTouch>
        <SafeBannerAd />
      </View>
    </AppLayout>
  );
}

import styles from '../styles/ReportIssueScreen.styles.js';
import { useCustomAlert } from '../context/AlertContext';
