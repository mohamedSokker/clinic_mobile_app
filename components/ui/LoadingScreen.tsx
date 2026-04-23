import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_SIZE, GRADIENTS, FONT_FAMILY } from '@/lib/theme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.background as any} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🏥</Text>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(64, 206, 243, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(64, 206, 243, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 36,
  },
  message: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT_SIZE.base,
    fontFamily: FONT_FAMILY.bodyMedium,
    marginTop: 16,
  },
});
