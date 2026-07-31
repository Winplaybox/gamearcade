import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'gamearcade_theme_mode_v1';

export const DARK_THEME = {
  bg: '#0f172a',
  cardBg: '#1e293b',
  subBg: '#334155',
  inputBg: '#1e293b',
  text: '#f8fafc',
  subText: '#94a3b8',
  border: '#334155',
  primary: '#e94560',
  accent: '#ff2e63',
  accentLight: 'rgba(233, 69, 96, 0.15)',
};

export const LIGHT_THEME = {
  bg: '#f8fafc',
  cardBg: '#ffffff',
  subBg: '#f1f5f9',
  inputBg: '#ffffff',
  text: '#0f172a',
  subText: '#64748b',
  border: '#e2e8f0',
  primary: '#e94560',
  accent: '#ff2e63',
  accentLight: 'rgba(233, 69, 96, 0.1)',
};

const ThemeContext = createContext({
  theme: DARK_THEME,
  mode: 'dark',
  setMode: () => {},
  isDark: true,
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState('dark');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved) setModeState(saved);
      } catch (e) {}
    })();
  }, []);

  const setMode = async (newMode) => {
    try {
      setModeState(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (e) {}
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
