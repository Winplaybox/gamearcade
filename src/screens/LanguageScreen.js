import { useState, useMemo } from 'react';
import {
  View,
  Text,
} from 'react-native';
import AnimatedTouch from '../components/AnimatedTouch';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';

export default function LanguageScreen({ navigation }) {
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  const suggestedLanguages = useMemo(() => {
    return [
      { code: 'en', label: 'English (US)', nativeLabel: 'English', flag: '🇺🇸' },
      { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
    ];
  }, []);

  const filteredLanguages = useMemo(() => {
    let list = SUPPORTED_LANGUAGES.map((l) => {
      const parts = l.label.split('(');
      const mainName = parts[0].trim();
      const nativeName = parts[1] ? parts[1].replace(')', '').trim() : l.label;
      return {
        ...l,
        mainName,
        nativeName,
      };
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.label.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q) ||
          l.mainName.toLowerCase().includes(q) ||
          l.nativeName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery]);

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Settings');
  };

  return (
    <AppLayout
      heroTitle={t('select_language')}
      heroSubtitle="Choose your preferred language"
      showBack
      showSearchBtn={true}
      searchPlaceholder="Search languages..."
      isHeaderSearching={isSearchMode}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onOpenSearch={() => setIsSearchMode(true)}
      onCloseSearch={() => {
        setIsSearchMode(false);
        setSearchQuery('');
      }}
      navigation={navigation}
      scrollable={true}
    >
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {!searchQuery ? (
          <>
            {/* SUGGESTED SECTION */}
            <Text style={[styles.sectionHeader, { color: theme.subText }]}>{t('suggested')}</Text>
            {suggestedLanguages.map((sug) => {
              const isSelected = sug.code === currentLanguage;
              return (
                <AnimatedTouch
                  key={sug.code}
                  style={[
                    styles.langCard,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => handleSelectLanguage(sug.code)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.langCardTitle, { color: theme.text }]}>{sug.nativeLabel}</Text>
                    <Text style={[styles.langCardSub, { color: theme.subText }]}>{sug.label}</Text>
                  </View>

                  <SafeIcon
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={isSelected ? theme.primary : theme.subText}
                  />
                </AnimatedTouch>
              );
            })}

            {/* ALL LANGUAGES SECTION */}
            <Text style={[styles.sectionHeader, { color: theme.subText, marginTop: 18 }]}>{t('all_languages')}</Text>
          </>
        ) : null}

        {filteredLanguages.filter((item) => item.code !== 'en' && item.code !== 'es').map((item) => {
          const isSelected = item.code === currentLanguage;
          return (
            <AnimatedTouch
              key={item.code}
              style={[
                styles.langCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => handleSelectLanguage(item.code)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.langCardTitle, { color: theme.text }]}>{item.mainName}</Text>
                <Text style={[styles.langCardSub, { color: theme.subText }]}>{item.nativeName}</Text>
              </View>

              <SafeIcon
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={isSelected ? theme.primary : theme.subText}
              />
            </AnimatedTouch>
          );
        })}
      </View>
    </AppLayout>
  );
}

import styles from '../styles/LanguageScreen.styles.js';
