import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  fullBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  logoContainer: {
    marginBottom: 32, // space/xl gap to wordmark
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 260,
    height: 260,
  },
  radialGlowCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(233, 69, 96, 0.12)',
    // Fake blur with large shadows
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 80,
    elevation: 20,
  },
  logoFrame: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  textContainer: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  titleTextAccent: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subTitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(247, 220, 221, 0.75)',
    letterSpacing: 1.5,
    marginTop: 8, // space/xs gap
  },
  bottomZone: {
    position: 'absolute',
    bottom: 48, // safe-area-bottom + space/2xl approx
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    width: 120,
    height: 3,
    borderRadius: 1.5, // radius/pill
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressSegment: {
    width: 30, // short coral segment
    height: '100%',
    borderRadius: 1.5,
  },
});
