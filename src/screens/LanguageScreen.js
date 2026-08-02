import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
} from 'react-native';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';

export default function LanguageScreen({ navigation }) {
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');

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
    <AppLayout title={t('select_language')} showBack navigation={navigation}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Rounded Pill Search Bar matching Image 3 */}
        <View style={[styles.pillSearchBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <SafeIcon name="search-outline" size={18} color={theme.subText} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.pillSearchInput, { color: theme.text }]}
            placeholder="Search languages..."
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <SafeIcon name="close-circle" size={18} color={theme.subText} />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={filteredLanguages}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            !searchQuery ? (
              <>
                {/* SUGGESTED SECTION */}
                <Text style={[styles.sectionHeader, { color: theme.subText }]}>SUGGESTED</Text>
                {suggestedLanguages.map((sug) => {
                  const isSelected = sug.code === currentLanguage;
                  return (
                    <TouchableOpacity
                      key={sug.code}
                      style={[
                        styles.langCard,
                        {
                          backgroundColor: theme.cardBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => handleSelectLanguage(sug.code)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.langCardTitle, { color: theme.text }]}>{sug.label}</Text>
                        <Text style={[styles.langCardSub, { color: theme.subText }]}>{sug.nativeLabel}</Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.checkCircleBadge, { backgroundColor: 'rgba(233,69,96,0.18)', borderColor: theme.primary }]}>
                          <SafeIcon name="checkmark" size={14} color={theme.primary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* ALL LANGUAGES SECTION */}
                <Text style={[styles.sectionHeader, { color: theme.subText, marginTop: 18 }]}>ALL LANGUAGES</Text>
              </>
            ) : null
          }
          renderItem={({ item }) => {
            const isSelected = item.code === currentLanguage;
            return (
              <TouchableOpacity
                style={[
                  styles.langCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => handleSelectLanguage(item.code)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langCardTitle, { color: theme.text }]}>{item.mainName}</Text>
                  <Text style={[styles.langCardSub, { color: theme.subText }]}>{item.nativeName}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkCircleBadge, { backgroundColor: 'rgba(233,69,96,0.18)', borderColor: theme.primary }]}>
                    <SafeIcon name="checkmark" size={14} color={theme.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pillSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  pillSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  langCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  langCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  langCardSub: {
    fontSize: 13,
    marginTop: 2,
  },
  checkCircleBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
