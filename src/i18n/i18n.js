import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'gamearcade_lang_v1';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const TRANSLATIONS = {
  en: {
    app_name: 'Game Arcade',
    tab_games: 'Arcade',
    tab_favorites: 'Favorites',
    tab_settings: 'Settings',
    search_placeholder: 'Search mini games...',
    all_categories: 'All Games',
    play_now: 'PLAY NOW',
    featured_games: 'FEATURED GAMES',
    favorite_games: 'FAVORITE GAMES',
    no_favorites: 'No favorite games added yet.',
    no_favorites_sub: 'Tap the heart icon on any game card to save it here for instant play!',
    theme_mode: 'App Theme',
    select_language: 'Language',
    share_app: 'Share App',
    rate_app: 'Rate Us',
    about_app: 'About Game Arcade',
  },
  es: {
    app_name: 'Game Arcade',
    tab_games: 'Juegos',
    tab_favorites: 'Favoritos',
    tab_settings: 'Ajustes',
    search_placeholder: 'Buscar juegos...',
    all_categories: 'Todos',
    play_now: 'JUGAR AHORA',
    featured_games: 'JUEGOS DESTACADOS',
    favorite_games: 'JUEGOS FAVORITOS',
    no_favorites: 'Aún no hay juegos favoritos.',
    no_favorites_sub: '¡Toca el corazón en cualquier juego para guardarlo aquí!',
    theme_mode: 'Tema',
    select_language: 'Idioma',
    share_app: 'Compartir App',
    rate_app: 'Calificar',
    about_app: 'Acerca de',
  },
};

const I18nContext = createContext({
  currentLanguage: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (saved) setCurrentLanguage(saved);
      } catch (e) {}
    })();
  }, []);

  const setLanguage = async (code) => {
    try {
      setCurrentLanguage(code);
      await AsyncStorage.setItem(LANGUAGE_KEY, code);
    } catch (e) {}
  };

  const t = (key) => {
    return TRANSLATIONS[currentLanguage]?.[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
