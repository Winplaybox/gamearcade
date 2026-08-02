import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import SafeIcon from './SafeIcon';
import AnimatedTouch from './AnimatedTouch';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GameGridCard({
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
}) {
  const { theme } = useTheme();

  const defaultWidth = (SCREEN_WIDTH - 48) / 2;
  const targetWidth = cardWidth || defaultWidth;

  return (
    <AnimatedTouch
      style={[
        styles.cardContainer,
        { width: targetWidth },
        marginRight ? { marginRight } : null,
        isSelected && { opacity: 0.85 },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeScale={0.95}
    >
      {/* Rounded Thumbnail Image Container */}
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
        <Image source={{ uri: game.iconUrl }} style={styles.image} />

        {/* Center Play Overlay Icon (for Continue Playing horizontal scroll) */}
        {showPlayOverlay && (
          <View style={styles.playOverlayIcon}>
            <SafeIcon name="play" size={18} color="#ffffff" style={{ marginLeft: 2 }} />
          </View>
        )}

        {/* Floating Right Top Action (Heart Favorite or Selection Checkmark) */}
        {selectionMode ? (
          <TouchableOpacity style={styles.floatingBtn} activeOpacity={0.7}>
            <SafeIcon
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={isSelected ? theme.primary : '#ffffff'}
            />
          </TouchableOpacity>
        ) : (
          onFavToggle && (
            <TouchableOpacity
              style={styles.floatingBtn}
              onPress={(e) => {
                e.stopPropagation();
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

      {/* Title Below Image */}
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {game.title}
      </Text>

      {/* Line 2: Category (Left) and Rating (Right) */}
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
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 18,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
  },
  floatingBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 6,
    borderRadius: 14,
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
