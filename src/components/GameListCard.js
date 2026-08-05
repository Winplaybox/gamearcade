import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import SafeIcon from './SafeIcon';
import AnimatedTouch from './AnimatedTouch';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/i18n';

function GameListCardComponent({
  game,
  onPress,
  onLongPress,
  onRightAction,
  subText,
  timeStampText,
  rightActionType = 'play', // 'play' | 'trash' | 'select' | 'playText'
  selectionMode = false,
  isSelected = false,
  ratingScore = '4.6',
  rankNumber = null,
  useTextPlayBtn = false,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
      <AnimatedTouch
      style={[
        styles.listCard,
        {
          backgroundColor: isSelected ? 'rgba(233,69,96,0.16)' : theme.cardBg,
          borderColor: isSelected ? theme.primary : theme.border,
          borderWidth: isSelected ? 1.5 : 1,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeScale={0.97}
    >
      {/* Rank Index Number (Bigger 26px rank number matching Stitch) */}
      {rankNumber ? (
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: '#E85F6B' }]}>
            {rankNumber}
          </Text>
        </View>
      ) : null}

      {/* 52x52 Thumbnail Container with Background Logo Placeholder */}
      <View style={styles.thumbnailWrapper}>
        <View style={[styles.placeholderBg, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoBgIcon}
            resizeMode="contain"
          />
        </View>
        <Image source={{ uri: game.iconUrl }} style={styles.thumbnail} />
      </View>

      {/* Meta Text Info */}
      <View style={styles.metaContainer}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {game.title}
        </Text>

        <Text style={[styles.subText, { color: theme.subText }]} numberOfLines={1}>
          {subText || `${game.category || 'Arcade'} • ★ ${ratingScore}`}
        </Text>

        {timeStampText ? (
          <Text style={[styles.timeStampText, { color: theme.primary }]} numberOfLines={1}>
            🕒 {timeStampText}
          </Text>
        ) : null}
      </View>

      {/* Right Side Action Button */}
      {rightActionType === 'select' || selectionMode ? (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onRightAction || onPress}
          activeOpacity={0.7}
        >
          <SafeIcon
            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={isSelected ? theme.primary : theme.subText}
          />
        </TouchableOpacity>
      ) : rightActionType === 'trash' ? (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onRightAction}
          activeOpacity={0.7}
        >
          <SafeIcon name="trash-outline" size={20} color="#E94560" />
        </TouchableOpacity>
      ) : rightActionType === 'playText' || useTextPlayBtn ? (
        <TouchableOpacity
          style={[
            styles.playPillBtn,
            {
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
            },
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.playPillText, { color: theme.text }]}>{t('play')}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.playCircleBtn, { backgroundColor: 'rgba(233, 69, 96, 0.15)' }]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <SafeIcon name="play" size={18} color={theme.primary} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      )}
    </AnimatedTouch>
    </Animated.View>
  );
}

export default React.memo(GameListCardComponent);

import styles from '../styles/GameListCard.styles.js';
