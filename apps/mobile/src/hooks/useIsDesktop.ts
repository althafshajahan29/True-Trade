import { Platform, useWindowDimensions } from 'react-native';

/** Browser windows at or above this width get the desktop/website layout (sidebar nav, wider content). Below it — including every native phone/tablet — gets the app layout (bottom tabs). */
export const DESKTOP_BREAKPOINT = 900;

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;
}
