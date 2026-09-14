import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Palette } from '../theme';

export function themedStackOptions(palette: Palette): NativeStackNavigationOptions {
  return {
    headerStyle: { backgroundColor: palette.bg },
    headerTintColor: palette.textPrimary,
    headerTitleStyle: { color: palette.textPrimary },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: palette.bg },
  };
}
