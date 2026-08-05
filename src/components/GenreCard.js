import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedTouch from './AnimatedTouch';
import SafeIcon from './SafeIcon';

/**
 * Parse hex color to RGB components
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Darken a hex color by a factor (0–1)
 */
function darken(hex, factor = 0.55) {
  if (!hex || !hex.startsWith('#')) return hex;
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
  } catch (e) {
    return hex;
  }
}

/**
 * Make a semi-transparent rgba from hex
 */
function rgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return hex;
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return hex;
  }
}

/**
 * Genre Card — horizontal layout:
 *   [Left] Bold title text
 *   [Right] Rounded icon container with large Ionicon
 * Background is a vivid diagonal LinearGradient from themeColor to a darker shade.
 */
function GenreCardComponent({ item, onPress, cardWidth, style, variant = 'standard' }) {
  const iconName = item.icon || 'game-controller-outline';
  const themeColor = item.themeColor || '#6366F1';
  const isSmall = variant === 'small';

  const scaleAnim = React.useRef(new Animated.Value(0.5)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const gradStart = themeColor;
  const gradMid = darken(themeColor, 0.75);
  const gradEnd = darken(themeColor, 0.45);
  const iconBg = rgba(themeColor, 0.22);
  const iconBorder = rgba(themeColor, 0.35);
  const watermarkColor = rgba(themeColor, 0.15);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
      <AnimatedTouch
        style={[
          styles.genreCardContainer,
          isSmall && { height: 50, borderRadius: 12 },
          cardWidth ? { width: cardWidth } : {},
          style,
        ]}
        onPress={() => onPress(item)}
      >
      <LinearGradient
        colors={[gradStart, gradMid, gradEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientCard, isSmall && { paddingVertical: 0, borderRadius: 12 }]}
      >
        {/* Watermark large icon background */}
        <View style={styles.watermarkWrap} pointerEvents="none">
          <SafeIcon
            name={iconName}
            size={isSmall ? 70 : 110}
            color={watermarkColor}
          />
        </View>

        {/* Left: Title */}
        <View style={styles.leftContent}>
          <Text style={[styles.genreTitle, isSmall && { fontSize: 13, lineHeight: 18 }]} numberOfLines={isSmall ? 1 : 2}>
            {item.title}
          </Text>
        </View>

        {/* Right: Rounded icon badge - hide on small variant */}
        {!isSmall && (
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: iconBg,
                borderColor: iconBorder,
              },
            ]}
          >
            <SafeIcon name={iconName} size={28} color="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
      </AnimatedTouch>
    </Animated.View>
  );
}

export default React.memo(GenreCardComponent);

const styles = StyleSheet.create({
  genreCardContainer: {
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    overflow: 'hidden',
  },
  watermarkWrap: {
    position: 'absolute',
    right: -18,
    bottom: -22,
  },
  leftContent: {
    flex: 1,
    paddingRight: 10,
    justifyContent: 'center',
  },
  genreTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
