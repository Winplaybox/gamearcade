import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  Animated,
  ImageBackground,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedTouch from './AnimatedTouch';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import BottomFooter from './BottomFooter';

export default function AppLayout({
  title,
  heroTitle,
  heroSubtitle,
  heroGradient,
  heroTag,
  showBack = false,
  showHeader = true,
  onBack,
  rightAction,
  currentTab,
  navigation,
  children,
  scrollable = false,
  onScroll,
  scrollY: externalScrollY,
  refreshControl,

  // Inline Header Search props
  isHeaderSearching = false,
  searchQuery = '',
  onSearchChange,
  onOpenSearch,
  onCloseSearch,
  showSearchBtn = false,
  searchPlaceholder,
  edges,
  animatedHeader = true,
  flatListProps,
}) {
  const { theme, isDark } = useTheme();

  const safeAreaEdges = edges || (currentTab ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']);

  const internalScrollY = useRef(new Animated.Value(0)).current;
  const activeScrollY = externalScrollY || internalScrollY;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const displayTitle = title || heroTitle;

  // Header Title Interpolation (0 -> 1 opacity, 14 -> 0 translateY as user scrolls past 30px)
  const headerTitleOpacity = activeScrollY.interpolate({
    inputRange: [25, 75],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTitleTranslateY = activeScrollY.interpolate({
    inputRange: [25, 75],
    outputRange: [14, 0],
    extrapolate: 'clamp',
  });

  // Hero Section Interpolation (Body Title fades and translates up as user scrolls)
  const heroTitleOpacity = activeScrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const heroTitleTranslateY = activeScrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -18],
    extrapolate: 'clamp',
  });

  const heroImageScale = activeScrollY.interpolate({
    inputRange: [-100, 0, 120],
    outputRange: [1.15, 1, 0.94],
    extrapolate: 'clamp',
  });

  const heroImageOpacity = activeScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  // Native Animated 1px Bottom Border Line Opacity (0 -> 1 as title enters top header)
  const headerBorderOpacity = animatedHeader
    ? activeScrollY.interpolate({
      inputRange: [20, 65],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    })
    : 1;

  const shouldRenderHeader =
    showHeader &&
    (isHeaderSearching ||
      showBack ||
      displayTitle ||
      showSearchBtn ||
      rightAction);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: activeScrollY } } }],
    {
      useNativeDriver: true,
      listener: onScroll,
    }
  );

  const isCircleIcon = Boolean(heroGradient);

  const renderHeroHeader = () => {
    if (!heroTitle || !animatedHeader) return null;

    if (heroGradient && Array.isArray(heroGradient) && heroGradient.length > 1) {
      return (
        <Animated.View
          style={[
            styles.heroImageCard,
            {
              opacity: heroImageOpacity,
              transform: [{ scale: heroImageScale }, { translateY: heroTitleTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroImageBg, { borderRadius: 18 }]}
          >
            <View style={styles.heroDarkOverlay} />
            {heroTag ? (
              <View style={[styles.heroTagRow, { backgroundColor: theme.primary }]}>
                <Text style={[styles.heroTagText, { color: theme.bg }]}>{heroTag}</Text>
              </View>
            ) : null}
            <Text style={[styles.heroImageTitleText, { color: '#ffffff' }]}>{heroTitle}</Text>
            {heroSubtitle ? (
              <Text style={[styles.heroImageSubText, { color: 'rgba(255,255,255,0.8)' }]}>{heroSubtitle}</Text>
            ) : null}
          </LinearGradient>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.heroTextContainer,
          {
            opacity: heroTitleOpacity,
            transform: [{ translateY: heroTitleTranslateY }],
          },
        ]}
      >
        <Text style={[styles.heroTextTitle, { color: theme.text }]}>{heroTitle}</Text>
        {heroSubtitle ? (
          <Text style={[styles.heroTextSub, { color: theme.subText }]}>{heroSubtitle}</Text>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={safeAreaEdges}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Sticky Top Header Bar */}
      {shouldRenderHeader && (
        <View style={[styles.header, { backgroundColor: theme.bg }]}>
          {isHeaderSearching ? (
            /* Active Inline Header Search Input */
            <View style={[styles.inlineSearchContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.inlineSearchInput, { color: theme.text }]}
                placeholder={searchPlaceholder || 'Search...'}
                placeholderTextColor={theme.subText}
                value={searchQuery}
                onChangeText={onSearchChange}
                onSubmitEditing={() => onSearchSubmit && onSearchSubmit(searchQuery)}
                returnKeyType="search"
                autoFocus
              />
              <AnimatedTouch
                onPress={() => {
                  if (searchQuery) onSearchChange('');
                  else if (onCloseSearch) onCloseSearch();
                }}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={18} color={theme.subText} />
              </AnimatedTouch>
            </View>
          ) : (
            /* Standard Header Layout with Animated Sliding Header Title */
            <>
              <View style={styles.leftContainer}>
                {showBack && (
                  <AnimatedTouch
                    style={
                      isCircleIcon
                        ? [
                          styles.circleIconBtn,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', marginRight: 10 },
                        ]
                        : styles.backBtn
                    }
                    onPress={handleBack}
                  >
                    <Ionicons name="arrow-back" size={isCircleIcon ? 20 : 24} color={theme.text} />
                  </AnimatedTouch>
                )}

                {/* Sliding Header Bar Title */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  {typeof displayTitle === 'string' && animatedHeader ? (
                    <Animated.Text
                      style={[
                        styles.title,
                        {
                          color: theme.text,
                          opacity: headerTitleOpacity,
                          transform: [{ translateY: headerTitleTranslateY }],
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {displayTitle}
                    </Animated.Text>
                  ) : typeof displayTitle === 'string' ? (
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                      {displayTitle}
                    </Text>
                  ) : (
                    displayTitle
                  )}
                </View>
              </View>

              <View style={styles.rightContainer}>
                {showSearchBtn && onOpenSearch && (
                  <AnimatedTouch
                    style={
                      isCircleIcon
                        ? [
                          styles.circleIconBtn,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                        ]
                        : styles.headerSearchBtn
                    }
                    onPress={onOpenSearch}
                  >
                    <Ionicons name="search-outline" size={isCircleIcon ? 20 : 22} color={theme.text} />
                  </AnimatedTouch>
                )}
                {rightAction}
              </View>
            </>
          )}

          {/* 60 FPS Native Animated 1px Bottom Border Line */}
          <Animated.View
            style={[
              styles.headerBottomBorderLine,
              {
                backgroundColor: theme.border,
                opacity: headerBorderOpacity,
              },
            ]}
          />
        </View>
      )}

      {/* Content Area */}
      <View style={styles.content}>
        {flatListProps ? (
          (() => {
            const { key, ListHeaderComponent, ...restProps } = flatListProps;
            return (
            <>
              <Animated.FlatList
                key={key}
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={refreshControl}
                ListHeaderComponent={() => (
                  <>
                    {renderHeroHeader()}
                    {ListHeaderComponent
                      ? React.isValidElement(ListHeaderComponent)
                        ? ListHeaderComponent
                        : ListHeaderComponent()
                      : null}
                  </>
                )}
                {...restProps}
              />
              {children}
            </>
            );
          })()
        ) : scrollable ? (
          <Animated.ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={refreshControl}
          >
            {renderHeroHeader()}
            {children}
          </Animated.ScrollView>
        ) : (
          children
        )}
      </View>

      {/* Bottom Navigation Bar */}
      {currentTab && <BottomFooter currentTab={currentTab} navigation={navigation} />}
    </SafeAreaView>
  );
}

import styles from '../styles/AppLayout.styles.js';
