import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { submitIssueReportToFirestore } from '../config/firebase';

const REPORT_ISSUE_TYPES = [
  { id: 'doesnt_load', labelKey: 'game_not_loading', fallback: "Doesn't Load", icon: 'time-outline' },
  { id: 'inappropriate', labelKey: 'inappropriate_content', fallback: 'Inappropriate Content', icon: 'shield-outline' },
  { id: 'broken_controls', labelKey: 'broken_controls', fallback: 'Broken Controls', icon: 'game-controller-outline' },
  { id: 'other', labelKey: 'other_issue', fallback: 'Other', icon: 'chatbubble-ellipses-outline' },
];

export default function ReportIssueScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const game = route?.params?.game || null;

  const [selectedIssueId, setSelectedIssueId] = useState(REPORT_ISSUE_TYPES[0].id);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const selectedObj = REPORT_ISSUE_TYPES.find((i) => i.id === selectedIssueId);
    const issueLabel = t(selectedObj?.labelKey) || selectedObj?.fallback;

    const res = await submitIssueReportToFirestore({
      gameId: game?.id || null,
      gameTitle: game?.title || 'General Arcade App Issue',
      issueType: issueLabel,
      details: details.trim(),
    });

    setSubmitting(false);

    if (res.success) {
      Alert.alert(
        t('report_submitted_title') || 'Report Submitted! 🚨',
        t('report_submitted_msg') || 'Thank you! Your report has been submitted to our team for verification.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('Settings');
            },
          },
        ]
      );
    } else {
      Alert.alert(t('error') || 'Error', t('could_not_submit') || 'Could not submit your report. Please try again later.');
    }
  };

  return (
    <AppLayout showHeader={false} navigation={navigation} scrollable>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Header Hero Card matching Reference Image 2 */}
        <View style={[styles.headerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.headerIconCircle}>
            <SafeIcon name="warning-outline" size={28} color="#E94560" />
          </View>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>{t('feedback_portal') || 'FEEDBACK PORTAL'}</Text>
          </View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{t('report_issue_menu')}</Text>
          <Text style={[styles.cardSubTitle, { color: theme.subText }]}>
            {game?.title
              ? `${t('report_issue_with')} "${game.title}"`
              : t('report_issue_sub')}
          </Text>
        </View>

        {/* Issue Type Selection Card matching Reference Image 2 */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>WHAT'S THE ISSUE?</Text>

        {REPORT_ISSUE_TYPES.map((item) => {
          const isSelected = selectedIssueId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.radioRowCard,
                {
                  backgroundColor: isSelected ? 'rgba(233,69,96,0.12)' : theme.cardBg,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSelectedIssueId(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBoxCircle, { backgroundColor: isSelected ? 'rgba(233,69,96,0.2)' : theme.subBg }]}>
                <SafeIcon
                  name={item.icon}
                  size={18}
                  color={isSelected ? theme.primary : theme.subText}
                />
              </View>

              <Text style={[styles.radioRowLabel, { color: isSelected ? theme.text : theme.subText }]}>
                {t(item.labelKey) || item.fallback}
              </Text>

              <View style={[styles.radioCircle, { borderColor: isSelected ? theme.primary : theme.border }]}>
                {isSelected && <View style={[styles.radioInnerDot, { backgroundColor: theme.primary }]} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Details Multiline Input matching Reference Image 2 */}
        <View style={styles.detailsHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.subText }]}>{t('additional_details_label')}</Text>
          <Text style={[styles.optionalTagText, { color: theme.subText }]}>{t('optional') || 'Optional'}</Text>
        </View>

        <TextInput
          style={[
            styles.detailsTextArea,
            { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Tell us more about what happened..."
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
          iconName="caret-forward"
        />

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Settings');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelBtnText, { color: theme.subText }]}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(233,69,96,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    backgroundColor: 'rgba(233, 69, 96, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E94560',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubTitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  radioRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  iconBoxCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioRowLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  optionalTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsTextArea: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
