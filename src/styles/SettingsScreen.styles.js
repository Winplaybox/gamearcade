import { StyleSheet } from 'react-native';

export default StyleSheet.create({
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
    marginRight: 6,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '700',
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
