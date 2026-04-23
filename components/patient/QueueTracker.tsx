import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Clock, CheckCircle } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { COLORS, FONT_SIZE, SPACING, RADIUS, FONT_FAMILY } from '@/lib/theme';
import type { Reservation } from '@/types/reservation';

interface QueueTrackerProps {
  reservation: Reservation | null;
  totalInQueue: number;
  myPosition: number;
  estimatedWaitMinutes: number;
  currentPatientName?: string;
}

export function QueueTracker({
  reservation,
  totalInQueue,
  myPosition,
  estimatedWaitMinutes,
  currentPatientName,
}: QueueTrackerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for active status
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (totalInQueue > 0) {
      const progress = Math.max(0, 1 - (myPosition - 1) / totalInQueue);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [myPosition, totalInQueue]);

  const status = reservation?.status ?? 'waiting';

  const getStatusInfo = () => {
    switch (status) {
      case 'inside': return { label: "You're Inside! 🎉", color: COLORS.success, icon: '✅' };
      case 'done': return { label: 'Visit Complete', color: COLORS.onSurfaceVariant, icon: '🏁' };
      case 'waiting':
      case 'confirmed': return { label: 'In Queue', color: COLORS.primary, icon: '⏳' };
      default: return { label: 'Waiting', color: COLORS.warning, icon: '🔔' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      {/* Main position card */}
      <GlassCard style={styles.positionCard} variant="primary" radius={RADIUS.xl} shadow={true}>
        <LinearGradient
          colors={['rgba(64, 206, 243, 0.12)', 'rgba(197, 126, 255, 0.08)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.positionContent}>
          <Text style={styles.statusBadge}>{statusInfo.label.toUpperCase()}</Text>
          
          {status !== 'inside' && status !== 'done' ? (
            <View style={styles.positionNumber}>
              <Animated.Text style={[styles.positionDigit, { transform: [{ scale: pulseAnim }] }]}>
                {myPosition}
              </Animated.Text>
              <Text style={styles.positionSuffix}>YOUR SPOT</Text>
            </View>
          ) : (
            <Text style={styles.statusLargeIcon}>{statusInfo.icon}</Text>
          )}
        </View>

        {/* Progress bar */}
        {status !== 'done' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressOuter}>
              <Animated.View
                style={[
                  styles.progressInner,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['5%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={[COLORS.secondary, COLORS.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelText}>Entry</Text>
              <Text style={styles.progressLabelText}>Consultation</Text>
            </View>
          </View>
        )}
      </GlassCard>

      {/* Stats row */}
      {status !== 'done' && (
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard} variant="subtle" shadow={false}>
            <Text style={styles.statLabel}>TOTAL</Text>
            <Text style={styles.statValue}>{totalInQueue}</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} variant="subtle" shadow={false}>
            <Text style={styles.statLabel}>WAITING</Text>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>
              ~{estimatedWaitMinutes}m
            </Text>
          </GlassCard>
          <GlassCard style={styles.statCard} variant="subtle" shadow={false}>
            <Text style={styles.statLabel}>BEFORE</Text>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {Math.max(0, myPosition - 1)}
            </Text>
          </GlassCard>
        </View>
      )}

      {currentPatientName && status !== 'done' && (
        <View style={styles.currentWrapper}>
          <Text style={styles.currentLabel}>CURRENTLY ASSISTING</Text>
          <GlassCard style={styles.currentCard} variant="secondary" shadow={false}>
            <Text style={styles.currentName}>{currentPatientName.toUpperCase()}</Text>
          </GlassCard>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.md },
  positionCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    overflow: 'hidden',
    gap: SPACING.lg,
  },
  positionContent: { alignItems: 'center', gap: SPACING.md },
  statusBadge: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
    backgroundColor: 'rgba(64, 206, 243, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  statusLargeIcon: { fontSize: 56, marginVertical: SPACING.md },
  positionNumber: { alignItems: 'center' },
  positionDigit: {
    color: COLORS.onSurface,
    fontSize: 96,
    fontFamily: FONT_FAMILY.display,
    lineHeight: 100,
    letterSpacing: -4,
  },
  positionSuffix: { color: COLORS.onSurfaceVariant, fontSize: 10, fontFamily: FONT_FAMILY.label, letterSpacing: 2, opacity: 0.5 },
  progressContainer: { width: '100%', gap: 10 },
  progressOuter: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabelText: { color: COLORS.onSurfaceVariant, fontSize: 9, fontFamily: FONT_FAMILY.label, opacity: 0.4 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statCard: {
    flex: 1,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statValue: { color: COLORS.onSurface, fontSize: FONT_SIZE.xl, fontFamily: FONT_FAMILY.display },
  statLabel: { color: COLORS.onSurfaceVariant, fontSize: 8, fontFamily: FONT_FAMILY.label, opacity: 0.5, letterSpacing: 1 },
  currentWrapper: { gap: SPACING.sm, alignItems: 'center', marginTop: SPACING.sm },
  currentLabel: { color: COLORS.onSurfaceVariant, fontSize: 9, fontFamily: FONT_FAMILY.label, opacity: 0.4, letterSpacing: 1 },
  currentCard: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: 'rgba(197, 126, 255, 0.06)',
  },
  currentName: { color: COLORS.secondary, fontSize: FONT_SIZE.sm, fontFamily: FONT_FAMILY.label, letterSpacing: 1 },
});
