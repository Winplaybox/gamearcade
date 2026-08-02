import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function SplashScreen({ onFinish }) {
  const { theme } = useTheme();

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(15)).current;
  const splashContainerOpacity = useRef(new Animated.Value(1)).current;

  // Ambient Glow Pulse Animation Value
  const glowPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Start Infinite Continuous Breathing Pulse directly around Icon Logo (60FPS Native Driver)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulseAnim, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Parallel Logo & Text Entrance Animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Complete Splash & Fade Out after 2.2 seconds (or when onFinish called)
    const timer = setTimeout(() => {
      Animated.timing(splashContainerOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // Interpolate glow scale & opacity for tight icon breathing pulse
  const glowScale = glowPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.28],
  });

  const glowOpacity = glowPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.65],
  });

  return (
    <Animated.View style={[styles.splashOverlay, { opacity: splashContainerOpacity }]}>
      {/* Centered App Icon Logo Container with Tight Pulsing Glow Halo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Tight Pulsing Ambient Glow Circle directly behind Icon */}
        <Animated.View
          style={[
            styles.tightIconGlowCircle,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* Secondary Pulsing Halo Ring around Icon */}
        <Animated.View
          style={[
            styles.tightIconOuterHalo,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* App Logo Frame */}
        <View style={styles.logoFrame}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* Brand Title & Subtitle */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Game</Text>
          <Text style={styles.titleTextAccent}> Arcade</Text>
        </View>
        <Text style={styles.subTitleText}>INSTANT MINI GAMES · NO INSTALLS</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0D12',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 140,
    height: 140,
  },
  tightIconGlowCircle: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 26,
    backgroundColor: '#E94560',
    shadowColor: '#E94560',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 20,
  },
  tightIconOuterHalo: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 32,
    backgroundColor: 'rgba(233, 69, 96, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(233, 69, 96, 0.4)',
  },
  logoFrame: {
    width: 104,
    height: 104,
    borderRadius: 26,
    backgroundColor: '#1E1214',
    borderWidth: 1.5,
    borderColor: 'rgba(233, 69, 96, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E94560',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 2,
  },
  logoImage: {
    width: 78,
    height: 78,
    borderRadius: 16,
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
    color: '#ffffff',
    letterSpacing: -0.8,
  },
  titleTextAccent: {
    fontSize: 32,
    fontWeight: '900',
    color: '#E94560',
    letterSpacing: -0.8,
  },
  subTitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(247, 220, 221, 0.75)',
    letterSpacing: 1.5,
    marginTop: 6,
  },
});
