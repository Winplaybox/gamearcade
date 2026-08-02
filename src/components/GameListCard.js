import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import SafeIcon from './SafeIcon';
import AnimatedTouch from './AnimatedTouch';
import { useTheme } from '../theme/ThemeContext';

export default function GameListCard({
  game,
  onPress,
  onLongPress,
  onRightAction,
  subText,
  timeStampText,
  rightActionType = 'play', // 'play' | 'trash' | 'select'
  selectionMode = false,
  isSelected = false,
  ratingScore = '4.6',
}) {
  const { theme } = useTheme();

  return (
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
      {/* 54x54 Thumbnail Image */}
      <Image source={{ uri: game.iconUrl }} style={styles.thumbnail} />

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
  );
}

const styles = StyleSheet.create({
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 14,
  },
  metaContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
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
});
