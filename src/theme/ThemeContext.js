import React, { createContext, useContext } from 'react';

export const DARK_THEME = {
  bg: '#1D1011',
  cardBg: '#2B1C1D',
  subBg: '#362627',
  inputBg: '#261819',
  text: '#F7DCDD',
  subText: '#E2BEBF',
  border: 'rgba(226, 190, 191, 0.12)',
  primary: '#E94560',
  onPrimary: '#FFFFFF',
  accent: '#E94560',
  accentLight: 'rgba(233, 69, 96, 0.16)',
  secondary: '#C3C6D5',
  tertiary: '#67DC9F',
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
