import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Share, Animated } from 'react-native';
import SafeIcon from './SafeIcon';
import AnimatedTouch from './AnimatedTouch';
import { useTheme } from '../theme/ThemeContext';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Haptics from 'expo-haptics';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let BlurView = View;
if (!isExpoGo) {
  BlurView = require('expo-blur').BlurView;
}


const { width: SCREEN_WIDTH } = Dimensions.get('window');

function GameGridCard({
  game,
  onPress,
  onFavToggle,
  onLongPress,
  isFavorite = false,
  ratingScore = '4.6',
  cardWidth,
  marginRight,
  imageHeight = 115,
  showPlayOverlay = false,
  selectionMode = false,
  isSelected = false,
  variant = 'standard', // 'standard' | 'continuePlaying'
  progressPercent = 65,
}) {
  const { theme } = useTheme();

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

  const defaultWidth = (SCREEN_WIDTH - 48) / 2;
  const targetWidth = cardWidth || defaultWidth;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (onPress) onPress();
  };

  const handleLongPress = () => {
    Haptics.selectionAsync();
    if (onLongPress) onLongPress();
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `I'm playing ${game.title} on Game Arcade! Can you beat my high score?\n\nhttps://play.winplaybox.in/game/${game.id}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // Render Continue Playing Variant (As per UI design spec: No external title/category/rating/play/heart)
  if (variant === 'continuePlaying') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
        <AnimatedTouch
        style={[
          styles.cardContainer,
          { width: targetWidth },
          marginRight ? { marginRight } : null,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeScale={0.95}
      >
        <View style={[styles.imageWrapper, { height: imageHeight }]}>
          {/* Background App Logo Placeholder while image loads */}
          <View style={[styles.imagePlaceholderBg, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoBgIcon}
              resizeMode="contain"
            />
          </View>

          {/* Live Network Game Thumbnail Image */}
          <Image source={{ uri: game.iconUrl }} style={styles.image} />

          {/* Bottom Overlay with Game Title & Progress Bar */}
          {isExpoGo ? (
            <View style={[styles.continueOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={styles.continueTitleText} numberOfLines={1}>
                {game.title}
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%`, backgroundColor: theme.primary },
                  ]}
                />
              </View>
            </View>
          ) : (
            <BlurView tint="dark" intensity={70} style={styles.continueOverlay}>
              <Text style={styles.continueTitleText} numberOfLines={1}>
                {game.title}
              </Text>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%`, backgroundColor: theme.primary },
                  ]}
                />
              </View>
            </BlurView>
          )}
        </View>
      </AnimatedTouch>
      </Animated.View>
    );
  }

  // Standard Game Grid Card Variant
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
      <AnimatedTouch
      style={[
        styles.cardContainer,
        { width: targetWidth },
        marginRight ? { marginRight } : null,
        isSelected && { opacity: 0.85 },
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeScale={0.95}
    >
      {/* Standard Rounded Thumbnail Image Container */}
      <View
        style={[
          styles.imageWrapper,
          { height: imageHeight },
          isSelected && {
            borderWidth: 2,
            borderColor: theme.primary,
          },
        ]}
      >
        {/* Background App Logo Placeholder while image loads */}
        <View style={[styles.imagePlaceholderBg, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoBgIcon}
            resizeMode="contain"
          />
        </View>

        {/* Live Network Game Thumbnail Image */}
        <Image source={{ uri: game.iconUrl }} style={styles.image} />

        {/* Center Play Overlay Icon */}
        {showPlayOverlay && (
          <View style={styles.playOverlayIcon}>
            <SafeIcon name="play" size={18} color="#ffffff" style={{ marginLeft: 2 }} />
          </View>
        )}

        {/* Floating Actions */}
        <View style={styles.floatingActionBar}>
          <TouchableOpacity style={styles.floatingBtn} onPress={handleShare} activeOpacity={0.7}>
            <SafeIcon name="share-social-outline" size={16} color="#ffffff" />
          </TouchableOpacity>
          {selectionMode ? (
            <TouchableOpacity style={styles.floatingBtn} activeOpacity={0.7}>
              <SafeIcon
                name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={isSelected ? theme.primary : '#ffffff'}
              />
            </TouchableOpacity>
          ) : (
            onFavToggle && (
              <TouchableOpacity
                style={styles.floatingBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  onFavToggle(game);
                }}
                activeOpacity={0.7}
              >
                <SafeIcon
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={16}
                  color={isFavorite ? '#E94560' : '#ffffff'}
                />
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* Title Below Image */}
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {game.title}
      </Text>

      {/* Category & Rating Row */}
      <View style={styles.metaRow}>
        <Text style={[styles.categoryText, { color: theme.subText }]} numberOfLines={1}>
          {game.category || 'Arcade'}
        </Text>

        <View style={styles.ratingBadge}>
          <SafeIcon name="star" size={12} color="#E94560" style={{ marginRight: 3 }} />
          <Text style={[styles.ratingText, { color: theme.text }]}>{ratingScore}</Text>
        </View>
      </View>
    </AnimatedTouch>
    </Animated.View>
  );
}

export default React.memo(GameGridCard);

import styles from '../styles/GameGridCard.styles.js';
