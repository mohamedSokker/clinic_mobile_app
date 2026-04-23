import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, QrCode, MapPin, Clock, Radio, CheckCircle2, Timer } from 'lucide-react-native';
import { EmergencyBanner } from '@/components/shared/EmergencyBanner';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { subscribeToQueue, cancelReservation } from '@/services/reservationService';
import { useAuthStore } from '@/stores/authStore';
import { COLORS, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from '@/lib/theme';
import { BackgroundDecor } from '@/components/ui/BackgroundDecor';
import type { Reservation } from '@/types/reservation';

export default function QueueScreen() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [queue, setQueue] = useState<Reservation[]>([]);
  const [myReservation, setMyReservation] = useState<Reservation | null>(null);
  const [emergencyAlert, setEmergencyAlert] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!clinicId || !user) return;
    const unsub = subscribeToQueue(clinicId, new Date(), (reservations) => {
      setQueue(reservations);
      const mine = reservations.find(r => r.patientId === user.uid);
      setMyReservation(mine ?? null);
      if (reservations.some(r => r.isEmergency)) setEmergencyAlert(true);
    });
    return unsub;
  }, [clinicId, user]);

  const myPosition = myReservation?.queuePosition ?? 0;
  const estimatedWait = Math.max(0, (myPosition - 1) * 30);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const estTime = new Date(now.getTime() + estimatedWait * 60000)
    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const handleCancel = () => Alert.alert('Cancel Reservation', 'Are you sure?', [
    { text: 'No', style: 'cancel' },
    { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
      if (!myReservation || !user || !profile) return;
      setCancelling(true);
      try { await cancelReservation(myReservation.id, user.uid, profile.name); router.back(); }
      catch {} finally { setCancelling(false); }
    }},
  ]);

  return (
    <View style={s.container}>
      <LinearGradient colors={GRADIENTS.background as any} style={StyleSheet.absoluteFill} />
      <BackgroundDecor />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <ArrowLeft size={20} color={COLORS.onSurfaceVariant} />
            </TouchableOpacity>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={s.badge}><Radio size={10} color={COLORS.primary} /><Text style={s.badgeText}>Active Session</Text></View>
              <Text style={s.title}>Queue Status</Text>
              <Text style={s.deptLabel}>Ophthalmology Dept • Room 402</Text>
            </View>
          </View>

          <EmergencyBanner visible={emergencyAlert} message="An emergency patient was added. Your position shifted." newPosition={myPosition} onDismiss={() => setEmergencyAlert(false)} />

          {/* Metrics */}
          {myReservation && (
            <View style={s.metricsRow}>
              <GlassCard style={s.metricCard} variant="subtle" radius={RADIUS.xl}>
                <Text style={s.metricLabel}>Your Position</Text>
                <Text style={s.metricValue}>{myPosition.toString().padStart(2, '0')}</Text>
              </GlassCard>
              <GlassCard style={s.metricCard} variant="subtle" radius={RADIUS.xl}>
                <Text style={s.metricLabel}>Est. Wait Time</Text>
                <Text style={s.metricValue}>{estimatedWait}<Text style={s.metricUnit}>mins</Text></Text>
              </GlassCard>
            </View>
          )}

          {/* Digital Check-in */}
          {myReservation && myReservation.status !== 'done' && (
            <GlassCard style={s.section} variant="subtle" radius={RADIUS.xl}>
              <View style={s.row}><QrCode size={20} color={COLORS.primary} /><Text style={s.cardTitle}>Digital Check-in</Text></View>
              <Text style={s.cardSub}>Scan this code at the clinic kiosk or room terminal to confirm your arrival.</Text>
              <View style={s.qrBox}><QrCode size={80} color={COLORS.primary} /></View>
            </GlassCard>
          )}

          {/* Appointment & Pre-Check */}
          {myReservation && (
            <GlassCard style={s.section} variant="subtle" radius={RADIUS.xl}>
              <Text style={s.sectionLabel}>Appointment</Text>
              <Text style={s.cardTitle}>{(myReservation as any).doctorName || 'Medical Consultation'}</Text>
              <View style={s.detailsRow}>
                <View style={s.detailItem}><MapPin size={13} color={COLORS.primary} /><Text style={s.detailText}>Clinic Location</Text></View>
                <View style={s.detailItem}><Clock size={13} color={COLORS.secondary} /><Text style={s.detailText}>{timeStr}</Text></View>
              </View>
              <Text style={[s.sectionLabel, { marginTop: 16 }]}>Pre-Check</Text>
              <View style={s.preCheckItem}>
                <CheckCircle2 size={16} color={COLORS.primary} />
                <View>
                  <Text style={s.preCheckTitle}>Fast for 2 hours</Text>
                  <Text style={s.detailText}>Preparation required for scan</Text>
                </View>
              </View>
            </GlassCard>
          )}

          {/* Live Feed */}
          {myReservation && (
            <GlassCard style={s.section} variant="subtle" radius={RADIUS.xl}>
              <View style={s.row}>
                <Radio size={14} color={COLORS.primary} />
                <Text style={[s.cardTitle, { flex: 1 }]}>Live Feed</Text>
                <Text style={s.liveBadge}>Real-time</Text>
              </View>
              {[
                { title: 'Checked In Successfully', meta: `Virtual Receptionist • ${timeStr}`, color: COLORS.primary },
                { title: myReservation.status === 'inside' ? 'In Consultation' : `Waiting — Position #${myPosition}`, meta: `System Update • ${timeStr}`, color: COLORS.secondary },
                { title: 'Consultation with Dr.', meta: `Estimated • ${estTime}`, color: 'rgba(255,255,255,0.15)' },
              ].map((ev, i) => (
                <View key={i}>
                  <View style={s.feedEvent}>
                    <View style={[s.feedDot, { backgroundColor: ev.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.feedTitle, i === 2 && { opacity: 0.5 }]}>{ev.title}</Text>
                      <Text style={s.feedMeta}>{ev.meta}</Text>
                    </View>
                  </View>
                  {i < 2 && <View style={s.feedLine} />}
                </View>
              ))}
            </GlassCard>
          )}

          {!myReservation && (
            <GlassCard style={[s.section, { alignItems: 'center', gap: 12 }]} variant="subtle">
              <Timer size={32} color="rgba(255,255,255,0.1)" />
              <Text style={s.cardTitle}>No active reservation</Text>
              <Text style={[s.cardSub, { textAlign: 'center' }]}>Book an appointment to track your queue position.</Text>
            </GlassCard>
          )}

          {myReservation && ['confirmed', 'waiting', 'pending'].includes(myReservation.status) && (
            <GradientButton onPress={handleCancel} label="Revoke Reservation" variant="ghost" size="md" loading={cancelling} style={{ marginTop: SPACING.sm }} />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SPACING.xl, paddingBottom: 80, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 4 },
  backBtn: { width: 44, height: 44, borderRadius: RADIUS.xl, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(64,206,243,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { color: COLORS.primary, fontSize: 9, fontFamily: FONT_FAMILY.label, letterSpacing: 1 },
  title: { color: COLORS.onSurface, fontSize: 30, fontFamily: FONT_FAMILY.display, letterSpacing: -1 },
  deptLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: FONT_FAMILY.body },
  metricsRow: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', gap: 6 },
  metricLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: FONT_FAMILY.label, letterSpacing: 1 },
  metricValue: { color: COLORS.onSurface, fontSize: 38, fontFamily: FONT_FAMILY.display, letterSpacing: -1 },
  metricUnit: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontFamily: FONT_FAMILY.body },
  section: { padding: 20, backgroundColor: 'rgba(255,255,255,0.02)', gap: 12 },
  sectionLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: FONT_FAMILY.label, letterSpacing: 2 },
  cardTitle: { color: COLORS.onSurface, fontSize: 16, fontFamily: FONT_FAMILY.headline },
  cardSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: FONT_FAMILY.body, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qrBox: { alignItems: 'center', paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: RADIUS.lg },
  detailsRow: { flexDirection: 'row', gap: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontFamily: FONT_FAMILY.body },
  preCheckItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(64,206,243,0.05)', padding: 12, borderRadius: RADIUS.lg },
  preCheckTitle: { color: COLORS.onSurface, fontSize: 14, fontFamily: FONT_FAMILY.bodyMedium },
  liveBadge: { color: COLORS.primary, fontSize: 9, fontFamily: FONT_FAMILY.label, letterSpacing: 1, backgroundColor: 'rgba(64,206,243,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  feedEvent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingLeft: 2 },
  feedDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  feedLine: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 6, marginVertical: 2 },
  feedTitle: { color: COLORS.onSurface, fontSize: 14, fontFamily: FONT_FAMILY.bodyMedium },
  feedMeta: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: FONT_FAMILY.body },
});
