import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, Clock, Play, FileText, MoreVertical } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { COLORS, FONT_SIZE, SPACING, RADIUS, FONT_FAMILY } from '@/lib/theme';
import type { Reservation } from '@/types/reservation';

interface ReservationCardProps {
  reservation: Reservation;
  position: number;
  onPress?: () => void;
  showActions?: boolean;
}

export function ReservationCard({ reservation, position, onPress, showActions = true }: ReservationCardProps) {
  const time = reservation.dateTime instanceof Date
    ? reservation.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : typeof reservation.dateTime === 'string' 
      ? new Date(reservation.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : '--:--';

  const isEmergency = reservation.isEmergency;
  const isInside = reservation.status === 'inside';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.wrapper}>
      <GlassCard
        style={[styles.card, isEmergency && styles.cardEmergency]}
        variant="subtle"
        radius={RADIUS.xl}
        shadow={false}
      >
        {/* Time & Position */}
        <View style={styles.timeColumn}>
          <Text style={[styles.timeText, isEmergency && { color: COLORS.error }]}>{time}</Text>
          <Text style={styles.positionText}>A-{position.toString().padStart(2, '0')}</Text>
        </View>

        {/* Info */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.patientName}>{reservation.patientName}</Text>
            {isEmergency ? (
              <View style={styles.emergencyBadge}>
                <Text style={styles.emergencyBadgeText}>EMERGENCY</Text>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{reservation.status === 'confirmed' ? 'FOLLOW-UP' : 'INITIAL'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.notes} numberOfLines={2}>
            {reservation.symptoms || "Standard clinical evaluation and diagnostic assessment."}
          </Text>
        </View>

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn}>
              <FileText size={18} color={COLORS.primary} />
            </TouchableOpacity>
            {reservation.status !== 'done' && (
              <TouchableOpacity style={[styles.actionBtn, styles.primaryActionBtn]}>
                {isInside ? (
                  <MoreVertical size={18} color="rgba(255,255,255,0.4)" />
                ) : (
                  <Play size={18} color={COLORS.onPrimary} fill={COLORS.onPrimary} />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 20,
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(64, 206, 243, 0.3)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardEmergency: {
    borderLeftColor: COLORS.error,
    backgroundColor: 'rgba(255, 113, 108, 0.05)',
  },
  timeColumn: { alignItems: 'center', minWidth: 60, gap: 2 },
  timeText: { color: COLORS.onSurface, fontSize: 18, fontFamily: FONT_FAMILY.display },
  positionText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: FONT_FAMILY.label, letterSpacing: 1 },
  
  content: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  patientName: { color: COLORS.onSurface, fontSize: 18, fontFamily: FONT_FAMILY.display, letterSpacing: -0.5 },
  emergencyBadge: { backgroundColor: 'rgba(255, 113, 108, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  emergencyBadgeText: { color: COLORS.error, fontSize: 8, fontFamily: FONT_FAMILY.label, letterSpacing: 0.5 },
  statusBadge: { backgroundColor: 'rgba(64, 206, 243, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { color: COLORS.primary, fontSize: 8, fontFamily: FONT_FAMILY.label, letterSpacing: 0.5 },
  notes: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: FONT_FAMILY.body, lineHeight: 18 },

  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  primaryActionBtn: { backgroundColor: COLORS.primary },
});
