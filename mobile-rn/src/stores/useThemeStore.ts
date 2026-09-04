import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from '../theme/colors';
import { ThemeMode } from '../theme/theme';

const STORAGE_KEY = 'sheduos_theme_mode';

interface ThemeState {
  mode: ThemeMode;
  systemScheme: ColorSchemeName | null | undefined;
  isDark: boolean;
  colors: ThemeColors;
  initializeTheme: () => Promise<void>;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const getIsDark = (mode: ThemeMode, systemScheme: ColorSchemeName | null | undefined): boolean => {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return systemScheme !== 'light'; // Default to dark
};

const initialSystemScheme: ColorSchemeName | null | undefined = Appearance.getColorScheme();
const initialIsDark = getIsDark('dark', initialSystemScheme);

export const useThemeStore = create<ThemeState>((set, get) => {
  // Listen to OS appearance changes
  Appearance.addChangeListener(({ colorScheme }) => {
    const currentMode = get().mode;
    const isDark = getIsDark(currentMode, colorScheme);
    set({
      systemScheme: colorScheme,
      isDark,
      colors: isDark ? darkColors : lightColors,
    });
  });

  return {
    mode: 'dark',
    systemScheme: initialSystemScheme,
    isDark: initialIsDark,
    colors: initialIsDark ? darkColors : lightColors,

    initializeTheme: async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
        const mode: ThemeMode = (savedMode as ThemeMode) || 'dark';
        const currentSystem = Appearance.getColorScheme();
        const isDark = getIsDark(mode, currentSystem);
        set({
          mode,
          systemScheme: currentSystem,
          isDark,
          colors: isDark ? darkColors : lightColors,
        });
      } catch {
        // Fallback to dark
      }
    },

    toggleTheme: () => {
      const currentIsDark = get().isDark;
      const nextMode: ThemeMode = currentIsDark ? 'light' : 'dark';
      const isDark = nextMode === 'dark';
      set({
        mode: nextMode,
        isDark,
        colors: isDark ? darkColors : lightColors,
      });
      AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
    },

    setThemeMode: (mode: ThemeMode) => {
      const isDark = getIsDark(mode, get().systemScheme);
      set({
        mode,
        isDark,
        colors: isDark ? darkColors : lightColors,
      });
      AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
    },
  };
});
