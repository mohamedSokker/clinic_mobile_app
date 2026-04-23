import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, X } from 'lucide-react-native';
import { COLORS, FONT_SIZE, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from '@/lib/theme';

interface EmergencyBannerProps {
  visible: boolean;
  message: string;
  newPosition?: number;
  onDismiss: () => void;
}

export function EmergencyBanner({ visible, message, newPosition, onDismiss }: EmergencyBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.emergency as any}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <AlertTriangle size={20} color="#fff" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Emergency Alert</Text>
          <Text style={styles.message}>{message}</Text>
          {newPosition && (
            <Text style={styles.position}>Your new position: #{newPosition}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
          <X size={18} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  textContainer: { flex: 1 },
  title: { color: '#fff', fontFamily: FONT_FAMILY.headline, fontSize: FONT_SIZE.base },
  message: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.body, marginTop: 2 },
  position: { color: '#fff', fontFamily: FONT_FAMILY.title, fontSize: FONT_SIZE.sm, marginTop: 4 },
  dismiss: { padding: 4 },
});
