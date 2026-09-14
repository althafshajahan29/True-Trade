import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { darkPalette, lightPalette, Palette } from './palettes';

export function useTheme(): { palette: Palette; isDark: boolean } {
  const themePreference = useSettingsStore((s) => s.settings.theme);
  const systemScheme = useColorScheme();

  const isDark = themePreference === 'system' ? systemScheme !== 'light' : themePreference !== 'light';
  return { palette: isDark ? darkPalette : lightPalette, isDark };
}
