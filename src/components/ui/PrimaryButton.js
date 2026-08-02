import React from 'react';
import { Text, StyleSheet, ActivityIndicator } from 'react-native';
import AnimatedTouch from '../AnimatedTouch';
import SafeIcon from '../SafeIcon';
import { useTheme } from '../../theme/ThemeContext';

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  iconName,
  backgroundColor,
  textColor = '#ffffff',
  height = 50,
  borderRadius = 25,
  style,
  textStyle,
}) {
  const { theme } = useTheme();

  const effectiveBgColor = backgroundColor || theme.primary;

  return (
    <AnimatedTouch
      onPress={onPress}
      disabled={disabled || loading}
      activeScale={0.96}
      style={[
        styles.button,
        {
          height,
          borderRadius,
          backgroundColor: effectiveBgColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          <Text style={[styles.titleText, { color: textColor }, textStyle]}>{title}</Text>
          {iconName ? (
            <SafeIcon name={iconName} size={18} color={textColor} style={styles.icon} />
          ) : null}
        </>
      )}
    </AnimatedTouch>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  icon: {
    marginLeft: 8,
  },
});
