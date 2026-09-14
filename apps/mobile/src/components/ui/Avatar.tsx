import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
}

export function Avatar({ name, color, size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="bodyMedium" tone="onAccent" style={{ fontSize: size * 0.4 }}>
        {initials}
      </Text>
    </View>
  );
}
