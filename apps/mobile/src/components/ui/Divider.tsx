import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';

export function Divider() {
  const { palette } = useTheme();
  return <View style={{ height: 1, backgroundColor: palette.divider }} />;
}
