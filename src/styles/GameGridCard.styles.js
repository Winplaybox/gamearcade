import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  cardContainer: {
    marginBottom: 18,
    borderRadius: 0,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePlaceholderBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  logoBgIcon: {
    width: 72,
    height: 72,
    opacity: 0.35,
  },
  image: {
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  continueOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 3,
  },
  continueTitleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 5,
  },
  progressBarTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  playOverlayIcon: {
    position: 'absolute',
    top: '34%',
    left: '41%',
    backgroundColor: 'rgba(233, 69, 96, 0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  floatingActionBar: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    zIndex: 2,
  },
  floatingBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 6,
    borderRadius: 14,
    marginLeft: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
