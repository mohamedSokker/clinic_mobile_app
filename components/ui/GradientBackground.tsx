import React from 'react';
import { ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '@/lib/theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export function GradientBackground({
  children,
  style,
  colors = GRADIENTS.background,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={colors as any}
      start={start}
      end={end}
      style={[StyleSheet.absoluteFill, style]}
    >
      {children}
    </LinearGradient>
  );
}
