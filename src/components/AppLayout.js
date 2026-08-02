import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import BottomFooter from './BottomFooter';

export default function AppLayout({
  title,
  heroTitle,
  showBack = false,
  showHeader = true,
  onBack,
  rightAction,
  currentTab,
  navigation,
  children,
  scrollable = false,
  onScroll,
  refreshControl,

  // Inline Header Search props
  isHeaderSearching = false,
  searchQuery = '',
  onSearchChange,
  onOpenSearch,
  onCloseSearch,
  showSearchBtn = false,
}) {
  const { theme, isDark } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const displayTitle = title || heroTitle;

  const shouldRenderHeader =
    showHeader &&
    (isHeaderSearching ||
      showBack ||
      displayTitle ||
      showSearchBtn ||
      rightAction);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

      {/* Sticky Top Header Bar (Only rendered when shouldRenderHeader is true) */}
      {shouldRenderHeader && (
        <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
          {isHeaderSearching ? (
            /* Active Inline Header Search Input */
            <View style={[styles.inlineSearchContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.inlineSearchInput, { color: theme.text }]}
                placeholder="Search games..."
                placeholderTextColor={theme.subText}
                value={searchQuery}
                onChangeText={onSearchChange}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => {
                  if (searchQuery) onSearchChange('');
                  else if (onCloseSearch) onCloseSearch();
                }}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={18} color={theme.subText} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Standard Header Layout */
            <>
              <View style={styles.leftContainer}>
                {showBack && (
                  <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                  </TouchableOpacity>
                )}

                {/* Clean Top Header Title */}
                <View>
                  {typeof displayTitle === 'string' ? (
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
                  <TouchableOpacity
                    style={styles.headerSearchBtn}
                    onPress={onOpenSearch}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="search-outline" size={22} color={theme.text} />
                  </TouchableOpacity>
                )}
                {rightAction}
              </View>
            </>
          )}
        </View>
      )}

      {/* Content Area */}
      <View style={styles.content}>
        {scrollable ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>

      {/* Bottom Navigation Bar */}
      {currentTab && <BottomFooter currentTab={currentTab} navigation={navigation} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSearchBtn: {
    padding: 6,
    marginRight: 4,
  },
  inlineSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  inlineSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
  },
});
