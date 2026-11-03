import React, { createContext, useContext } from 'react';
import { LIGHT_PALETTE, ThemeMode, ThemePalette } from './tokens';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemePalette;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: LIGHT_PALETTE,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ mode: 'light', colors: LIGHT_PALETTE }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
