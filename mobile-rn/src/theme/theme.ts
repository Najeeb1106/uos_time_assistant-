import { darkColors, lightColors, ThemeColors } from './colors';
import { Spacing } from './spacing';
import { Typography } from './typography';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof Spacing;
  typography: typeof Typography;
}

export const darkTheme: Theme = {
  isDark: true,
  colors: darkColors,
  spacing: Spacing,
  typography: Typography,
};

export const lightTheme: Theme = {
  isDark: false,
  colors: lightColors,
  spacing: Spacing,
  typography: Typography,
};
