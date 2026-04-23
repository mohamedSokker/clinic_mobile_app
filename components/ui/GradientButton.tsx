import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, FONT_SIZE, SHADOWS, FONT_FAMILY } from '@/lib/theme';

interface GradientButtonProps {
  onPress: () => void;
  label: string;
  colors?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger' | 'emergency' | 'ghost' | 'warning';
  icon?: React.ReactNode;
}

const SIZE_STYLES = {
  sm: { paddingVertical: 10, paddingHorizontal: 20, fontSize: FONT_SIZE.sm },
  md: { paddingVertical: 14, paddingHorizontal: 28, fontSize: FONT_SIZE.base },
  lg: { paddingVertical: 18, paddingHorizontal: 36, fontSize: FONT_SIZE.md },
};

const VARIANT_COLORS: Record<string, [string, string, ...string[]]> = {
  primary: [COLORS.primary, COLORS.primaryContainer],
  secondary: [COLORS.secondary, COLORS.secondaryContainer],
  danger: [COLORS.error, COLORS.errorContainer],
  emergency: [COLORS.emergency, COLORS.error],
  ghost: [COLORS.glassWhite, 'rgba(255,255,255,0.02)'],
  warning: [COLORS.warning, 'rgba(245, 158, 11, 0.6)'],
};

export function GradientButton({
  onPress,
  label,
  colors,
  style,
  textStyle,
  loading = false,
  disabled = false,
  size = 'md',
  variant = 'primary',
  icon,
}: GradientButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const sizeStyle = SIZE_STYLES[size];
  const gradColors = colors ?? VARIANT_COLORS[variant];
  const isGhost = variant === 'ghost';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[styles.wrapper, style]}
      >
        <LinearGradient
          colors={gradColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            { paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal },
            !isGhost && SHADOWS.primary,
            (disabled || loading) && { opacity: 0.5 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={isGhost ? COLORS.primary : '#fff'} size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.label, { fontSize: sizeStyle.fontSize }, isGhost && { color: COLORS.primary }, textStyle]}>
                {label}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.full,
  },
  label: {
    color: '#fff',
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 0.3,
  },
});
