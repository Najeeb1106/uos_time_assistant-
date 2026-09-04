import { useThemeStore } from '../stores/useThemeStore';

export function useTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  const colors = useThemeStore((s) => s.colors);
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);

  return { isDark, colors, mode, toggleTheme, setThemeMode };
}
