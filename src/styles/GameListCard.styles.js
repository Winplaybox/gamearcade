import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  rankContainer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  rankText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  thumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  logoBgIcon: {
    width: 64,
    height: 64,
    opacity: 0.35,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  metaContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subText: {
    fontSize: 12,
    marginTop: 3,
  },
  timeStampText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  actionBtn: {
    padding: 8,
  },
  playCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPillBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
