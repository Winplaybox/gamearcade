import React, { createContext, useContext } from 'react';

export const DARK_THEME = {
  bg: '#0B0D12',
  cardBg: '#141720',
  subBg: '#1A1E29',
  inputBg: '#1A1E29',
  text: '#F7F7F8',
  subText: '#9298A5',
  border: 'rgba(255, 255, 255, 0.07)',
  primary: '#E94560',
  accent: '#E94560',
  accentLight: 'rgba(233, 69, 96, 0.15)',
};

const ThemeContext = createContext({
  theme: DARK_THEME,
  mode: 'dark',
  setMode: () => {},
  isDark: true,
});

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ theme: DARK_THEME, mode: 'dark', setMode: () => {}, isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
