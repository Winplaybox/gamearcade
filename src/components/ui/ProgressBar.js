import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export default function ProgressBar({
  progress = 0,
  height = 6,
  trackColor,
  fillColor,
  borderRadius = 3,
  style,
}) {
  const { theme } = useTheme();
  const animatedWidth = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.min(100, Math.max(0, progress)),
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  const effectiveTrackColor = trackColor || 'rgba(255, 255, 255, 0.08)';
  const effectiveFillColor = fillColor || theme.primary;

  return (
    <View style={[styles.track, { height, borderRadius, backgroundColor: effectiveTrackColor }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height: '100%',
            borderRadius,
            backgroundColor: effectiveFillColor,
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
