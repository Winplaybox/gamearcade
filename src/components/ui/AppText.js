import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../theme/tokens';

export default function AppText({
  children,
  variant = 'body', // 'hero' | 'titleLarge' | 'titleMedium' | 'headline' | 'body' | 'caption' | 'label'
  color,
  style,
  numberOfLines,
  align = 'left',
}) {
  const baseTypography = Typography[variant] || Typography.body;
  const textColor = color || Colors.text;

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        baseTypography,
        { color: textColor, textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
