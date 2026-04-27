import React from 'react';
import {
  View,
  ViewStyle,
  StyleProp,
  StyleSheet,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, GRADIENTS } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'strong' | 'subtle' | 'primary' | 'secondary' | 'emergency';
  radius?: number;
  shadow?: boolean;
}

const VARIANT_CONFIG: Record<string, { colors: string[], border: string }> = {
  default: {
    colors: ['rgba(17, 26, 40, 0.4)', 'rgba(28, 38, 55, 0.4)'],
    border: COLORS.glassBorder,
  },
  strong: {
    colors: GRADIENTS.glassStrong,
    border: 'rgba(111, 117, 133, 0.2)',
  },
  subtle: {
    colors: ['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)'],
    border: 'rgba(255, 255, 255, 0.05)',
  },
  primary: {
    colors: ['rgba(64, 206, 243, 0.08)', 'rgba(64, 206, 243, 0.04)'],
    border: 'rgba(64, 206, 243, 0.25)',
  },
  secondary: {
    colors: ['rgba(197, 126, 255, 0.08)', 'rgba(197, 126, 255, 0.04)'],
    border: 'rgba(197, 126, 255, 0.25)',
  },
  emergency: {
    colors: ['rgba(255, 107, 53, 0.10)', 'rgba(255, 107, 53, 0.05)'],
    border: 'rgba(255, 107, 53, 0.35)',
  },
};

export function GlassCard({ children, style, variant = 'default', radius = RADIUS.xl, shadow = true }: GlassCardProps) {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.default;

  return (
    <LinearGradient
      colors={config.colors as [string, string, ...string[]]}
      style={[
        styles.card,
        { borderColor: config.border, borderRadius: radius },
        shadow && SHADOWS.glass,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
