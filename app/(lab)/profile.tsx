import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useAuthStore } from '@/stores/authStore';
import { COLORS, FONT_SIZE, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from '@/lib/theme';

export default function LabProfile() {
  const { profile, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.background as any} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.scroll}>
          <View style={styles.hero}>
            <Avatar name={profile?.name} size={84} borderColor="rgba(245,158,11,0.4)" />
            <Text style={styles.name}>{profile?.name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🔬 Laboratory</Text>
            </View>
          </View>
          <GlassCard style={styles.infoCard} variant="strong" radius={RADIUS.xl}>
            {[
              { label: 'Email', value: profile?.email ?? '—' },
              { label: 'Mobile', value: profile?.mobile ?? '—' },
            ].map((p, i, arr) => (
              <View key={i} style={[styles.infoRow, i < arr.length - 1 && styles.border]}>
                <Text style={styles.infoLabel}>{p.label}</Text>
                <Text style={styles.infoValue}>{p.value}</Text>
              </View>
            ))}
          </GlassCard>
          <GradientButton
            onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: logout },
            ])}
            label="Sign Out"
            variant="danger"
            size="lg"
            icon={<LogOut size={18} color="#fff" />}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, padding: SPACING.xl, gap: SPACING.md },
  hero: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  name: { color: COLORS.onSurface, fontSize: FONT_SIZE['2xl'], fontFamily: FONT_FAMILY.display },
  badge: { 
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: RADIUS.full, 
    backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' 
  },
  badgeText: { color: COLORS.warning, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.title },
  infoCard: { padding: SPACING.md },
  infoRow: { paddingVertical: SPACING.sm },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  infoLabel: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.xs, fontFamily: FONT_FAMILY.label, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { color: COLORS.onSurface, fontSize: FONT_SIZE.base, fontFamily: FONT_FAMILY.title, marginTop: 2 },
});
