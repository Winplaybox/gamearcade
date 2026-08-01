import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import hi from './locales/hi.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import id from './locales/id.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import vi from './locales/vi.json';
import th from './locales/th.json';
import tr from './locales/tr.json';
import it from './locales/it.json';
import ko from './locales/ko.json';
import pl from './locales/pl.json';
import uk from './locales/uk.json';
import nl from './locales/nl.json';
import fil from './locales/fil.json';
import ms from './locales/ms.json';
import bn from './locales/bn.json';
import ur from './locales/ur.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';
import kn from './locales/kn.json';
import pa from './locales/pa.json';
import fa from './locales/fa.json';
import sw from './locales/sw.json';
import ro from './locales/ro.json';
import hu from './locales/hu.json';
import cs from './locales/cs.json';
import el from './locales/el.json';
import he from './locales/he.json';
import bg from './locales/bg.json';
import hr from './locales/hr.json';
import sr from './locales/sr.json';
import sk from './locales/sk.json';
import da from './locales/da.json';
import fi from './locales/fi.json';
import no from './locales/no.json';
import sv from './locales/sv.json';
import zh from './locales/zh.json';
import zhHant from './locales/zh-Hant.json';

const LANGUAGE_KEY = 'gamearcade_lang_v1';

const rawTranslations = {
  en, hi, es, pt, id, ar, fr, de, ru, ja,
  vi, th, tr, it, ko, pl, uk, nl, fil, ms,
  bn, ur, ta, te, mr, gu, kn, pa, fa, sw,
  ro, hu, cs, el, he, bg, hr, sr, sk, da,
  fi, no, sv, zh, 'zh-Hant': zhHant,
};

// Fallback Game Arcade Keys
const GAME_ARCADE_FALLBACKS = {
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
  theme_system: 'System Default',
  theme_light: 'Light Mode',
  theme_dark: 'Dark Mode',
};

export const SUPPORTED_LANGUAGES = [
  // Tier 1
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'pt', label: 'Português (Portuguese)', flag: '🇧🇷' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'fr', label: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'ru', label: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  // Tier 2
  { code: 'vi', label: 'Tiếng Việt (Vietnamese)', flag: '🇻🇳' },
  { code: 'th', label: 'ไทย (Thai)', flag: '🇹🇭' },
  { code: 'tr', label: 'Türkçe (Turkish)', flag: '🇹🇷' },
  { code: 'it', label: 'Italiano (Italian)', flag: '🇮🇹' },
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'pl', label: 'Polski (Polish)', flag: '🇵🇱' },
  { code: 'uk', label: 'Українська (Ukrainian)', flag: '🇺🇦' },
  { code: 'nl', label: 'Nederlands (Dutch)', flag: '🇳🇱' },
  { code: 'fil', label: 'Filipino (Tagalog)', flag: '🇵🇭' },
  { code: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
  // Tier 3
  { code: 'bn', label: 'বাংলা (Bengali)', flag: '🇧🇩' },
  { code: 'ur', label: 'اردو (Urdu)', flag: '🇵🇰' },
  { code: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
  { code: 'fa', label: 'فارسی (Persian)', flag: '🇮🇷' },
  { code: 'sw', label: 'Kiswahili (Swahili)', flag: '🇰🇪' },
  // Tier 4
  { code: 'ro', label: 'Română (Romanian)', flag: '🇷🇴' },
  { code: 'hu', label: 'Magyar (Hungarian)', flag: '🇭🇺' },
  { code: 'cs', label: 'Čeština (Czech)', flag: '🇨🇿' },
  { code: 'el', label: 'Ελληνικά (Greek)', flag: '🇬🇷' },
  { code: 'he', label: 'עברית (Hebrew)', flag: '🇮🇱' },
  { code: 'bg', label: 'Български (Bulgarian)', flag: '🇧🇬' },
  { code: 'hr', label: 'Hrvatski (Croatian)', flag: '🇭🇷' },
  { code: 'sr', label: 'Српски (Serbian)', flag: '🇷🇸' },
  { code: 'sk', label: 'Slovenčina (Slovak)', flag: '🇸🇰' },
  { code: 'da', label: 'Dansk (Danish)', flag: '🇩🇰' },
  { code: 'fi', label: 'Suomi (Finnish)', flag: '🇫🇮' },
  { code: 'no', label: 'Norsk (Norwegian)', flag: '🇳🇴' },
  { code: 'sv', label: 'Svenska (Swedish)', flag: '🇸🇪' },
  { code: 'zh', label: '中文 (Simplified)', flag: '🇨🇳' },
  { code: 'zh-Hant', label: '繁體中文 (Traditional)', flag: '🇹🇼' },
];

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
        if (saved && rawTranslations[saved]) {
          setCurrentLanguage(saved);
        }
      } catch (e) {}
    })();
  }, []);

  const setLanguage = async (code) => {
    try {
      if (rawTranslations[code]) {
        setCurrentLanguage(code);
        await AsyncStorage.setItem(LANGUAGE_KEY, code);
      }
    } catch (e) {}
  };

  const t = useCallback(
    (key) => {
      const activeDict = rawTranslations[currentLanguage] || rawTranslations.en;
      return (
        activeDict[key] ||
        rawTranslations.en[key] ||
        GAME_ARCADE_FALLBACKS[key] ||
        key
      );
    },
    [currentLanguage]
  );

  return (
    <I18nContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
