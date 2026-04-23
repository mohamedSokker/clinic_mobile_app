import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, ChevronRight, Syringe, FlaskConical } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { COLORS, FONT_SIZE, SPACING, RADIUS, FONT_FAMILY } from '@/lib/theme';
import type { Diagnosis } from '@/types/diagnosis';

interface HistoryCardProps {
  diagnosis: Diagnosis;
  onPress: () => void;
}

export function HistoryCard({ diagnosis, onPress }: HistoryCardProps) {
  const hasVaccines = diagnosis.vaccines?.length > 0;
  const hasFiles = diagnosis.analysisFiles?.length > 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard style={styles.card} variant="subtle" radius={RADIUS.xl} shadow={true}>
        <LinearGradient
          colors={['rgba(64, 206, 243, 0.08)', 'rgba(0,0,0,0)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateDay}>
              {diagnosis.visitDate instanceof Date ? diagnosis.visitDate.getDate() : '--'}
            </Text>
            <Text style={styles.dateMonth}>
              {diagnosis.visitDate instanceof Date
                ? diagnosis.visitDate.toLocaleDateString('en-US', { month: 'short' })
                : '--'}
            </Text>
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{diagnosis.doctorName.toUpperCase()}</Text>
            <Text style={styles.clinicName}>{diagnosis.clinicName}</Text>
          </View>
          <View style={styles.arrowWrapper}>
            <ChevronRight size={14} color={COLORS.primary} />
          </View>
        </View>

        {/* Notes preview */}
        {diagnosis.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText} numberOfLines={2}>{diagnosis.notes}</Text>
          </View>
        ) : null}

        {/* Badges */}
        {(hasVaccines || hasFiles) && (
          <View style={styles.badges}>
            {hasVaccines && (
              <View style={styles.badge}>
                <Syringe size={10} color={COLORS.primary} />
                <Text style={styles.badgeText}>
                  {diagnosis.vaccines.length} IMMUNIZATION
                </Text>
              </View>
            )}
            {hasFiles && (
              <View style={[styles.badge, styles.badgeAlt]}>
                <FlaskConical size={10} color={COLORS.secondary} />
                <Text style={[styles.badgeText, styles.badgeTextAlt]}>
                  {diagnosis.analysisFiles.length} LAB REPORTS
                </Text>
              </View>
            )}
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: SPACING.lg, gap: SPACING.md, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dateContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(64, 206, 243, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: -2,
  },
  dateDay: { color: COLORS.onSurface, fontSize: FONT_SIZE.lg, fontFamily: FONT_FAMILY.display, lineHeight: 22 },
  dateMonth: { color: COLORS.primary, fontSize: 8, fontFamily: FONT_FAMILY.label, textTransform: 'uppercase', letterSpacing: 1 },
  doctorInfo: { flex: 1 },
  doctorName: { color: COLORS.onSurface, fontSize: 10, fontFamily: FONT_FAMILY.label, letterSpacing: 1, opacity: 0.8 },
  clinicName: { color: COLORS.onSurface, fontSize: FONT_SIZE.base, fontFamily: FONT_FAMILY.title, marginTop: 2 },
  arrowWrapper: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  notesContainer: {
    padding: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
  },
  notesText: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.body, lineHeight: 20, opacity: 0.8 },
  badges: { flexDirection: 'row', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(64, 206, 243, 0.08)',
  },
  badgeAlt: {
    backgroundColor: 'rgba(197, 126, 255, 0.08)',
  },
  badgeText: { fontSize: 8, fontFamily: FONT_FAMILY.label, letterSpacing: 0.5, color: COLORS.primary },
  badgeTextAlt: { color: COLORS.secondary },
});
