import React from 'react';
import {
  View,
  ViewStyle,
  StyleProp,
  StyleSheet,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '@/lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'strong' | 'subtle' | 'primary' | 'secondary' | 'emergency';
  radius?: number;
  shadow?: boolean;
}

const VARIANT_STYLES: Record<string, ViewStyle> = {
  default: {
    backgroundColor: COLORS.glassFill,
    borderColor: COLORS.glassBorder,
  },
  strong: {
    backgroundColor: 'rgba(7, 14, 26, 0.8)',
    borderColor: 'rgba(111, 117, 133, 0.4)',
  },
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  primary: {
    backgroundColor: 'rgba(64, 206, 243, 0.08)',
    borderColor: 'rgba(64, 206, 243, 0.25)',
  },
  secondary: {
    backgroundColor: 'rgba(197, 126, 255, 0.08)',
    borderColor: 'rgba(197, 126, 255, 0.25)',
  },
  emergency: {
    backgroundColor: 'rgba(255, 107, 53, 0.10)',
    borderColor: 'rgba(255, 107, 53, 0.35)',
  },
};

export function GlassCard({ children, style, variant = 'default', radius = RADIUS.xl, shadow = true }: GlassCardProps) {
  return (
    <View
      style={[
        styles.card,
        VARIANT_STYLES[variant],
        { borderRadius: radius },
        shadow && SHADOWS.glass,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
