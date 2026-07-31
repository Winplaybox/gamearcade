import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';

export default function BottomFooter({ currentTab, navigation }) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const TABS = [
    { key: 'Home', label: t('tab_games'), icon: 'game-controller' },
    { key: 'Favorites', label: t('tab_favorites'), icon: 'heart' },
    { key: 'Settings', label: t('tab_settings'), icon: 'settings' },
  ];

  const handleTabPress = (tabKey) => {
    if (currentTab !== tabKey) {
      navigation.navigate(tabKey);
    }
  };

  return (
    <View style={[styles.footerContainer, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
      {TABS.map((tab) => {
        const isActive = currentTab === tab.key;
        const iconName = isActive ? tab.icon : `${tab.icon}-outline`;
        const iconColor = isActive ? theme.primary : theme.subText;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabBtn}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
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
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
