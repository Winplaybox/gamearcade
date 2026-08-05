import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Animated Shimmer Skeleton Base Component
 * High-visibility contrast on dark and light backgrounds
 */
export function SkeletonItem({ width, height, borderRadius = 14, style }) {
  const { theme } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1.0,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.25)',
          borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.15)',
          borderWidth: 1,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * Game Grid Card Skeleton Placeholder
 */
export function GameGridCardSkeleton({ width }) {
  const cardW = width || (SCREEN_WIDTH - 48) / 2;
  return (
    <View style={[styles.cardContainer, { width: cardW }]}>
      {/* Thumbnail Image Skeleton */}
      <SkeletonItem width="100%" height={115} borderRadius={16} />
      {/* Title Line Skeleton */}
      <SkeletonItem width="80%" height={14} borderRadius={6} style={{ marginTop: 10 }} />
      {/* Meta Subtitle Skeleton */}
      <View style={styles.metaRow}>
        <SkeletonItem width="45%" height={12} borderRadius={4} />
        <SkeletonItem width="25%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

/**
 * Game List Card Skeleton Placeholder
 */
export function GameListCardSkeleton() {
  return (
    <View style={styles.listCardContainer}>
      <SkeletonItem width={72} height={72} borderRadius={16} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <SkeletonItem width="75%" height={15} borderRadius={6} />
        <SkeletonItem width="50%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonItem width="35%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

/**
 * Category Grid Card Skeleton Placeholder
 */
export function CategoryCardSkeleton() {
  const cardW = (SCREEN_WIDTH - 52) / 2;
  return (
    <View style={[styles.categoryCard, { width: cardW }]}>
      <SkeletonItem width="100%" height={175} borderRadius={16} />
    </View>
  );
}

/**
 * Full 2-Column Grid Layout Wrapper for Game Cards
 */
export function GameGridSkeletonList({ count = 8 }) {
  return (
    <View style={styles.gridWrapper}>
      {Array.from({ length: count }).map((_, idx) => (
        <GameGridCardSkeleton key={idx} />
      ))}
    </View>
  );
}

/**
 * Full 1-Column Vertical List Layout Wrapper for Game Cards
 */
export function GameListSkeletonList({ count = 6 }) {
  return (
    <View style={styles.verticalListWrapper}>
      {Array.from({ length: count }).map((_, idx) => (
        <GameListCardSkeleton key={idx} />
      ))}
    </View>
  );
}

/**
 * Full Layout Skeleton for HomeScreen
 */
export function HomeScreenSkeleton() {
  return (
    <View style={{ width: '100%' }}>
      {/* Category Chips Carousel Skeleton */}
      <View style={{ flexDirection: 'row', marginBottom: 18, marginTop: 4 }}>
        {[80, 95, 75, 110, 85].map((w, idx) => (
          <SkeletonItem key={idx} width={w} height={34} borderRadius={18} style={{ marginRight: 10 }} />
        ))}
      </View>

      {/* Surprise Me Banner Skeleton */}
      <SkeletonItem width="100%" height={48} borderRadius={16} style={{ marginBottom: 20 }} />

      {/* Featured Section Header Skeleton */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SkeletonItem width={140} height={20} borderRadius={8} />
        <SkeletonItem width={60} height={14} borderRadius={6} />
      </View>

      {/* Featured Horizontal Cards Skeleton */}
      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        <SkeletonItem width={220} height={130} borderRadius={18} style={{ marginRight: 14 }} />
        <SkeletonItem width={220} height={130} borderRadius={18} />
      </View>

      {/* All Games Section Header Skeleton */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SkeletonItem width={120} height={20} borderRadius={8} />
      </View>

      {/* Game Grid Skeleton */}
      <GameGridSkeletonList count={4} />
    </View>
  );
}

/**
 * Full 2-Column Grid Layout Wrapper for Category Cards
 */
export function CategoryGridSkeletonList({ count = 6 }) {
  return (
    <View style={styles.gridWrapper}>
      {Array.from({ length: count }).map((_, idx) => (
        <CategoryCardSkeleton key={idx} />
      ))}
    </View>
  );
}

import styles from '../styles/SkeletonLoader.styles.js';
