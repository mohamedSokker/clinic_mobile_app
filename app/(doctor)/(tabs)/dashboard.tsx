import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  Search,
  Bell,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  PlayCircle,
  FileText,
} from "lucide-react-native";
import { ReservationCard } from "@/components/doctor/ReservationCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { getDoctorByUid, updateDoctorSchedule } from "@/services/doctorService";
import {
  getPaginatedReservationsForDoctor,
  getReservationsForDoctor,
  insertEmergencyPatient,
} from "@/services/reservationService";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import Toast from "react-native-toast-message";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { useQuery } from "@tanstack/react-query";

export default function DoctorDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [emergencyModal, setEmergencyModal] = useState(false);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyMobile, setEmergencyMobile] = useState("");
  const [addingEmergency, setAddingEmergency] = useState(false);

  const { data: doctor, refetch: refetchDoctor } = useQuery({
    queryKey: ["doctor", user?.uid],
    queryFn: () => getDoctorByUid(user!.uid),
    enabled: !!user,
  });

  const {
    data: paginatedData,
    isLoading: loading,
    refetch: refetchReservations,
    isRefetching: refreshing,
  } = useQuery({
    queryKey: ["reservations", "today", "next-3"],
    queryFn: () => getPaginatedReservationsForDoctor(new Date(), 1, 3, true),
    enabled: !!user,
  });

  const activeReservations = paginatedData?.reservations || [];
  const totalReservations = paginatedData?.total || 0;

  const handleAddEmergency = async () => {
    if (!emergencyName || !doctor) return;
    setAddingEmergency(true);
    try {
      await insertEmergencyPatient(
        doctor.id,
        emergencyName,
        emergencyMobile,
        new Date(),
        doctor.doctorName,
        doctor.clinicName,
      );
      Toast.show({
        type: "success",
        text1: "🚨 Emergency patient added",
        text2: "Queue priority adjusted",
      });
      setEmergencyModal(false);
      setEmergencyName("");
      setEmergencyMobile("");
      refetchReservations();
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to add emergency patient" });
    } finally {
      setAddingEmergency(false);
    }
  };

  const handleDayToggle = async (day: string) => {
    if (!doctor) return;
    const currentDays = doctor.workingDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];

    try {
      await updateDoctorSchedule(
        doctor.id,
        doctor.schedule,
        newDays,
        doctor.slotDurationMinutes,
      );
      refetchDoctor();
      Toast.show({ type: "success", text1: "Schedule Updated" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Update Failed" });
    }
  };

  const { data: allDayData } = useQuery({
    queryKey: ["reservations", "today", "stats"],
    queryFn: () => getReservationsForDoctor(doctor!.id, new Date()),
    enabled: !!doctor,
  });

  const stats = useMemo(() => {
    if (!allDayData) return { confirmed: 0, ongoing: 0, priority: 0 };
    const confirmed = allDayData.filter(
      (r) => r.status === "confirmed" || r.status === "waiting",
    ).length;
    const ongoing = allDayData.filter((r) => r.status === "inside").length;
    const priority = allDayData.filter(
      (r) => r.isEmergency && r.status !== "done",
    ).length;
    return { confirmed, ongoing, priority };
  }, [allDayData]);

  const activeBlocks = useMemo(() => {
    if (!doctor?.schedule)
      return [
        { label: "Morning (08:00 - 12:00)", active: false },
        { label: "Afternoon (13:00 - 17:00)", active: false },
        { label: "Evening (18:00 - 21:00)", active: false },
      ];

    const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      new Date().getDay()
    ];
    const hours = (doctor.schedule as any)[dayLabel];

    if (!hours || !doctor.workingDays?.includes(dayLabel)) {
      return [
        { label: "Morning (08:00 - 12:00)", active: false },
        { label: "Afternoon (13:00 - 17:00)", active: false },
        { label: "Evening (18:00 - 21:00)", active: false },
      ];
    }

    const startHour = parseInt(hours.start.split(":")[0]);
    const endHour = parseInt(hours.end.split(":")[0]);

    return [
      {
        label: "Morning (08:00 - 12:00)",
        active: startHour < 12 && endHour > 8,
      },
      {
        label: "Afternoon (13:00 - 17:00)",
        active: startHour < 17 && endHour > 12,
      },
      {
        label: "Evening (18:00 - 21:00)",
        active: startHour < 21 && endHour > 18,
      },
    ];
  }, [doctor]);

  const todaySlots = useMemo(() => {
    if (!doctor?.schedule) return [];
    const dayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      new Date().getDay()
    ];
    const hours = (doctor.schedule as any)[dayLabel];
    if (!hours || !doctor.workingDays?.includes(dayLabel)) return [];

    const slots: string[] = [];
    const slotDuration = doctor.slotDurationMinutes || 30;
    const [startH, startM] = hours.start.split(":").map(Number);
    const [endH, endM] = hours.end.split(":").map(Number);

    let current = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    while (current + slotDuration <= endTotal) {
      const h = Math.floor(current / 60)
        .toString()
        .padStart(2, "0");
      const m = (current % 60).toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
      current += slotDuration;
    }
    return slots;
  }, [doctor]);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refetchReservations();
              refetchDoctor();
            }}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View>
            <Text style={styles.heroLabel}>OPERATIONAL DASHBOARD</Text>
            <Text style={styles.heroTitle}>Today's Schedule</Text>
          </View>
          <TouchableOpacity
            onPress={() => setEmergencyModal(true)}
            style={styles.emergencyCta}
            activeOpacity={0.9}
          >
            <AlertTriangle size={18} color="#fff" fill="#fff" />
            <Text style={styles.emergencyCtaText}>EMERGENCY ADD</Text>
          </TouchableOpacity>
        </View>

        {/* Grid Layout */}
        <View style={styles.grid}>
          {/* Main Content */}
          <View style={styles.mainColumn}>
            {/* Stats */}
            <View style={styles.statsGrid}>
              {[
                {
                  label: "CONFIRMED",
                  value: stats.confirmed,
                  color: COLORS.primary,
                },
                {
                  label: "ONGOING",
                  value: stats.ongoing,
                  color: COLORS.tertiary,
                },
                {
                  label: "PRIORITY",
                  value: stats.priority,
                  color: COLORS.error,
                },
              ].map((s, i) => (
                <GlassCard
                  key={i}
                  style={styles.statCard}
                  variant="subtle"
                  radius={RADIUS.xl}
                >
                  <Text style={[styles.statValue, { color: s.color }]}>
                    {s.value.toString().padStart(2, "0")}
                  </Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </GlassCard>
              ))}
            </View>

            {/* Pipeline Header */}
            <View style={styles.pipelineHeader}>
              <Text style={styles.pipelineTitle}>QUEUE PIPELINE</Text>
              {totalReservations > 3 && (
                <TouchableOpacity
                  onPress={() => router.push("/(doctor)/(tabs)/queue")}
                  style={styles.viewMoreInline}
                >
                  <Text style={styles.viewMoreInlineText}>VIEW FULL QUEUE</Text>
                  <ChevronRight size={14} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Reservations List */}
            <View style={styles.pipelineList}>
              {activeReservations.length > 0
                ? activeReservations
                    .slice(0, 3)
                    .map((r) => (
                      <ReservationCard
                        key={r.id}
                        reservation={r}
                        position={r.queuePosition}
                        onPress={() =>
                          router.push(
                            `/(doctor)/patient/${r.patientId}?reservationId=${r.id}` as any,
                          )
                        }
                        onViewDetails={() =>
                          router.push(
                            `/(doctor)/patient-details/${r.patientId}` as any,
                          )
                        }
                      />
                    ))
                : !loading && (
                    <GlassCard style={styles.emptyCard} variant="subtle">
                      <Text style={styles.emptyText}>Pipeline Clear</Text>
                      <Text style={styles.emptySubtext}>
                        All scheduled sessions have been concluded.
                      </Text>
                    </GlassCard>
                  )}

              {totalReservations > 3 && (
                <TouchableOpacity
                  style={styles.viewMoreCard}
                  onPress={() => router.push("/(doctor)/(tabs)/queue")}
                >
                  <LinearGradient
                    colors={["rgba(64,206,243,0.1)", "rgba(64,206,243,0.02)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.viewMoreText}>
                    +{totalReservations - 3} MORE PATIENTS IN QUEUE
                  </Text>
                  <View style={styles.viewMoreCircle}>
                    <ChevronRight size={20} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sidebar-like section (Clinic Controls) */}
          <View style={styles.sideColumn}>
            <GlassCard
              style={styles.controlsCard}
              variant="subtle"
              radius={RADIUS.xl}
            >
              <View style={styles.controlsHeader}>
                <CalendarIcon size={20} color={COLORS.primary} />
                <Text style={styles.controlsTitle}>Clinic Controls</Text>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>OPERATIONAL DAYS</Text>
                <View style={styles.daysRow}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (d) => {
                      const active = (doctor?.workingDays || []).includes(d);
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => handleDayToggle(d)}
                          style={[
                            styles.dayCircle,
                            active && styles.dayCircleActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              active && styles.dayTextActive,
                            ]}
                          >
                            {d[0]}
                          </Text>
                        </TouchableOpacity>
                      );
                    },
                  )}
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>ACTIVE BLOCKS</Text>
                {activeBlocks.map((b, i) => (
                  <View
                    key={i}
                    style={[styles.blockToggle, !b.active && { opacity: 0.5 }]}
                  >
                    <Text style={styles.blockLabel}>{b.label}</Text>
                    <View
                      style={[
                        styles.toggleTrack,
                        b.active && styles.toggleTrackActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleThumb,
                          b.active && styles.toggleThumbActive,
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>TIME INTERVALS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.slotsRow}>
                    {todaySlots.map((s, i) => (
                      <View key={i} style={styles.slotBadge}>
                        <Text style={styles.slotBadgeText}>{s}</Text>
                      </View>
                    ))}
                    {todaySlots.length === 0 && (
                      <Text style={styles.emptySlotsText}>
                        No sessions scheduled for today
                      </Text>
                    )}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.utilizationSection}>
                <View style={styles.utilizationHeader}>
                  <Text style={styles.controlLabel}>WEEKLY UTILIZATION</Text>
                  <Text style={styles.utilizationValue}>84%</Text>
                </View>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.tertiary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: "84%" }]}
                  />
                </View>
              </View>
            </GlassCard>

            {/* Monthly Report Widget */}
            <TouchableOpacity activeOpacity={0.9} style={styles.reportWidget}>
              <LinearGradient
                colors={["rgba(7, 14, 26, 0.6)", "rgba(7, 14, 26, 0.9)"] as any}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.reportContent}>
                <FileText size={20} color={COLORS.primary} />
                <Text style={styles.reportTitle}>Monthly Report</Text>
                <Text style={styles.reportSub}>View diagnostic trends</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Emergency modal */}
      <Modal visible={emergencyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard
            style={styles.modalCard}
            variant="subtle"
            radius={RADIUS.xl}
            shadow={true}
          >
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconWrapper,
                  { backgroundColor: "rgba(255, 82, 82, 0.1)" },
                ]}
              >
                <AlertTriangle size={24} color={COLORS.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: COLORS.error }]}>
                  CRITICAL INSERTION
                </Text>
                <Text style={styles.modalSubtitle}>
                  This patient will take the next immediate slot.
                </Text>
              </View>
            </View>

            <View style={styles.impactBox}>
              <View style={styles.impactIcon}>
                <Bell size={12} color={COLORS.primary} />
              </View>
              <Text style={styles.impactText}>
                The remaining schedule will shift automatically, and affected
                patients will receive real-time apology alerts.
              </Text>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PATIENT IDENTITY</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. John Smith"
                  placeholderTextColor="rgba(229, 235, 253, 0.2)"
                  value={emergencyName}
                  onChangeText={setEmergencyName}
                  selectionColor={COLORS.primary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  CONTACT REFERENCE (OPTIONAL)
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="+20 1XX XXX XXXX"
                  placeholderTextColor="rgba(229, 235, 253, 0.2)"
                  value={emergencyMobile}
                  onChangeText={setEmergencyMobile}
                  keyboardType="phone-pad"
                  selectionColor={COLORS.primary}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <GradientButton
                onPress={handleAddEmergency}
                label="EXECUTE INSERTION"
                variant="emergency"
                loading={addingEmergency}
                size="lg"
              />
              <TouchableOpacity
                onPress={() => setEmergencyModal(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>ABORT ACTION</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  appBarLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -0.5,
  },
  appBarRight: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: { paddingBottom: 120 },
  hero: {
    padding: SPACING.xl,
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-start",
  },
  heroLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroTitle: {
    color: COLORS.onSurface,
    fontSize: 32,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -1,
  },
  emergencyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.error,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  emergencyCtaText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },

  grid: { paddingHorizontal: SPACING.xl, gap: 32 },
  mainColumn: { gap: 32 },
  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, padding: 20, alignItems: "center", gap: 4 },
  statValue: { fontSize: 24, fontFamily: FONT_FAMILY.display },
  statLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1.5,
  },

  pipelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: -20,
  },
  pipelineTitle: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
  viewMoreInline: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewMoreInlineText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  pipelineList: { gap: 12 },
  viewMoreCard: {
    height: 70,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.2)",
    marginTop: 8,
  },
  viewMoreText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
    fontWeight: "700",
  },
  viewMoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  sideColumn: { gap: 24 },
  controlsCard: {
    padding: 24,
    gap: 32,
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
  },
  controlsHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  controlsTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
  },
  controlGroup: { gap: 16 },
  controlLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleActive: { backgroundColor: COLORS.primary },
  dayText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
  },
  dayTextActive: { color: COLORS.onPrimary },

  blockToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: RADIUS.lg,
  },
  blockLabel: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  toggleTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 2,
    alignItems: "flex-start",
  },
  toggleTrackActive: {
    backgroundColor: COLORS.primary,
    alignItems: "flex-end",
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  toggleThumbActive: {},

  utilizationSection: { gap: 12 },
  utilizationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  utilizationValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONT_FAMILY.display,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },

  reportWidget: {
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  reportContent: { padding: 20, gap: 4 },
  reportTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.headline,
  },
  reportSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.body,
  },

  emptyCard: { padding: 40, alignItems: "center", gap: 12 },
  emptyText: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
  },
  emptySubtext: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  modalCard: {
    padding: SPACING.xl,
    gap: 24,
    backgroundColor: "rgba(10, 15, 28, 0.95)",
  },
  modalHeader: { flexDirection: "row", gap: 16, alignItems: "center" },
  modalIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: COLORS.onSurface,
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
  modalSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    opacity: 0.5,
    lineHeight: 20,
  },
  modalForm: { gap: 16 },
  inputGroup: { gap: 8 },
  inputLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    height: 56,
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
  },
  modalActions: { gap: 12 },
  cancelBtn: { paddingVertical: 12, alignItems: "center" },
  cancelText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  impactBox: {
    flexDirection: "row",
    backgroundColor: "rgba(64, 206, 243, 0.05)",
    padding: 16,
    borderRadius: RADIUS.lg,
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.1)",
  },
  impactIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  impactText: {
    flex: 1,
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 16,
  },
  slotsRow: { flexDirection: "row", gap: 8 },
  slotBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  slotBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: FONT_FAMILY.label,
  },
  emptySlotsText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    fontStyle: "italic",
  },
});
