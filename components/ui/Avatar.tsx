import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT_FAMILY } from '@/lib/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  borderColor?: string;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function getAvatarColor(name?: string): string {
  const colors = [
    '#40CEF3', // MediFlow Primary
    '#C57EFF', // Secondary
    '#FF716C', // Error/Accent
    '#FFD166', // Warning
    '#06D6A0', // Success
    '#118AB2', // Blue
    '#073B4C', // Dark
    '#EE6C4D', // Orange
    '#98C1D9', // Light Blue
    '#3D5A80', // Royal
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ uri, name, size = 48, borderColor }: AvatarProps) {
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size * 0.4, // Squircle-like
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: borderColor ?? 'rgba(255,255,255,0.1)',
    borderWidth: 1,
  };

  if (uri) {
    return (
      <View style={[styles.wrapper, containerStyle]}>
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[styles.fallback, containerStyle, { backgroundColor: color + '15', borderColor: color + '30' }]}>
      <Text style={[styles.initials, { fontSize: size * 0.35, color: color, fontFamily: FONT_FAMILY.label }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  initials: {
    letterSpacing: 0.5,
  },
});
