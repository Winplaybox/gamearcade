import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/i18n';

export default function SplashScreen({ isAppReady, hasNetworkError, onFinish }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const splashContainerOpacity = useRef(new Animated.Value(1)).current;
  const splashContainerScale = useRef(new Animated.Value(1)).current;

  // Continuous Breathing & Sweep Animations
  const glowPulseAnim = useRef(new Animated.Value(0)).current;
  const sweepAnim = useRef(new Animated.Value(-30)).current;

  const timeMounted = useRef(Date.now());
  const isExiting = useRef(false);
  const exitTimeout = useRef(null);

  useEffect(() => {
    // 1. Start Infinite Continuous Breathing Pulse (1 -> 1.03 -> 1, 2000ms loop)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulseAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Parallel Logo & Text Entrance Animation
    Animated.spring(logoScale, {
      toValue: 1,
      stiffness: 200,
      damping: 20,
      useNativeDriver: true,
    }).start();

    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start(() => {
      // Progress sweep starts once icon settles, loops continuously
      if (!hasNetworkError) {
        Animated.loop(
          Animated.timing(sweepAnim, {
            toValue: 120, // Sweep past track width
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ).start();
      }
    });

    // Wordmark entrance
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Tagline entrance
    Animated.sequence([
      Animated.delay(280), // 100 + 180
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      })
    ]).start();

    // Maximum on-screen time: 2500ms fallback
    exitTimeout.current = setTimeout(() => {
      triggerExit();
    }, 2500);

    return () => {
      if (exitTimeout.current) clearTimeout(exitTimeout.current);
    };
  }, [hasNetworkError]);

  useEffect(() => {
    if (isAppReady && !isExiting.current) {
      const elapsed = Date.now() - timeMounted.current;
      const remainingWait = Math.max(0, 800 - elapsed); // minimum 800ms
      setTimeout(() => {
        triggerExit();
      }, remainingWait);
    }
  }, [isAppReady]);

  const triggerExit = () => {
    if (isExiting.current) return;
    isExiting.current = true;
    if (exitTimeout.current) clearTimeout(exitTimeout.current);

    Animated.parallel([
      Animated.timing(splashContainerOpacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(splashContainerScale, {
        toValue: 0.98,
        duration: 260,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onFinish) onFinish();
    });
  };

  const breathingScale = glowPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  return (
    <Animated.View style={[styles.splashOverlay, { backgroundColor: theme.bg, opacity: splashContainerOpacity, transform: [{ scale: splashContainerScale }] }]}>
      
      <ImageBackground
        source={require('../../../assets/splash.png')}
        style={styles.fullBgImage}
        resizeMode="cover"
      >
        {!hasNetworkError && (
          <View style={styles.bottomZone}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressSegment, { backgroundColor: theme.primary, transform: [{ translateX: sweepAnim }] }]} />
            </View>
          </View>
        )}
      </ImageBackground>

    </Animated.View>
  );
}

import styles from '../../styles/SplashScreen.styles.js';
