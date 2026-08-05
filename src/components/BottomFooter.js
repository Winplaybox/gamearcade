import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import AnimatedTouch from './AnimatedTouch';
import styles from '../styles/BottomFooter.styles.js';

export default function BottomFooter(props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { state, navigation, currentTab: propCurrentTab } = props;

  const TABS = [
    { key: 'Home', label: t('tab_home') || 'Home', icon: 'home' },
    { key: 'Browse', label: t('tab_browse') || 'Browse', icon: 'compass' },
    { key: 'Favorites', label: t('tab_favorites') || 'Favorites', icon: 'heart' },
    { key: 'Settings', label: t('tab_settings') || 'Settings', icon: 'settings' },
  ];

  // Determine active tab key from React Navigation Tab State or direct prop
  let activeTabKey = propCurrentTab;
  if (state && typeof state.index === 'number' && Array.isArray(state.routes)) {
    activeTabKey = state.routes[state.index]?.name;
  }

  const handleTabPress = (tabKey) => {
    if (navigation) {
      if (tabKey === 'Browse') {
        navigation.navigate('Browse', { category: null, selectedCategory: null, filter: null, reset: Date.now() });
      } else {
        navigation.navigate(tabKey);
      }
    }
  };

  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <View
      style={[
        styles.footerContainer,
        {
          backgroundColor: theme.cardBg,
          borderTopColor: theme.border,
          paddingTop: 6,
          paddingBottom: bottomPadding,
          height: 54 + bottomPadding,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = activeTabKey === tab.key;
        const iconName = isActive ? tab.icon : `${tab.icon}-outline`;
        const iconColor = isActive ? theme.primary : theme.subText;

        return (
          <AnimatedTouch
            key={tab.key}
            style={styles.tabBtn}
            onPress={() => handleTabPress(tab.key)}
            activeScale={0.92}
          >
            <Ionicons name={iconName} size={22} color={iconColor} />
            <Text
              style={[
                styles.tabLabel,
                { color: iconColor },
                isActive && { fontWeight: '700' },
              ]}
            >
              {tab.label}
            </Text>
          </AnimatedTouch>
        );
      })}
    </View>
  );
}
