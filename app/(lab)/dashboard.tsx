import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GradientButton } from '@/components/ui/GradientButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { COLORS, FONT_SIZE, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from '@/lib/theme';

export default function LabDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient colors={GRADIENTS.background as any} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Lab Dashboard</Text>
            <Text style={styles.subtitle}>Upload analysis results for patients</Text>
          </View>
          <GlassCard style={styles.card} variant="strong" radius={RADIUS.xl}>
            <Text style={styles.emoji}>🔬</Text>
            <Text style={styles.cardTitle}>Ready to upload?</Text>
            <Text style={styles.cardSubtitle}>Search for a patient and attach their analysis results</Text>
            <GradientButton
              onPress={() => router.push('/(lab)/upload')}
              label="Upload Analysis"
              size="lg"
              variant="warning"
              style={{ marginTop: SPACING.md }}
            />
          </GlassCard>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, padding: SPACING.xl, gap: SPACING.md },
  header: { marginBottom: SPACING.md },
  title: { color: COLORS.onSurface, fontSize: FONT_SIZE['2xl'], fontFamily: FONT_FAMILY.display },
  subtitle: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.base, fontFamily: FONT_FAMILY.body, marginTop: 4 },
  card: { padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm },
  emoji: { fontSize: 56 },
  cardTitle: { color: COLORS.onSurface, fontSize: FONT_SIZE.xl, fontFamily: FONT_FAMILY.headline },
  cardSubtitle: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.base, fontFamily: FONT_FAMILY.body, textAlign: 'center' },
});
