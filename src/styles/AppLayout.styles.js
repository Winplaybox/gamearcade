import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circleIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandHeaderIconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandHeaderIcon: {
    width: 36,
    height: 36,
  },
  headerBottomBorderLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSearchBtn: {
    padding: 6,
    marginRight: 4,
  },
  inlineSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  inlineSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
  },
  heroImageCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    height: 140,
  },
  heroImageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  heroTagRow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heroTagText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroImageTitleText: {
    fontSize: 26,
    fontWeight: '800',
  },
  heroImageSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  heroTextContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heroTextTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroTextSub: {
    fontSize: 13,
    marginTop: 4,
  },
});
