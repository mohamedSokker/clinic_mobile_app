import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import {
  getReservationsForPatient,
  cancelReservation,
} from "@/services/reservationService";
import { COLORS, FONT_FAMILY, RADIUS, GRADIENTS } from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import Toast from "react-native-toast-message";
import type { Reservation } from "@/types/reservation";

const { width: SW } = Dimensions.get("window");

export default function PatientScheduleScreen() {
  const { profile } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());

  // Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchReservations = async () => {
    if (!profile?.id) return;
    try {
      const data = await getReservationsForPatient(profile.id);
      const sorted = data.sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      );
      setReservations(sorted);
    } catch (err) {
      console.error("Fetch reservations error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load your schedule.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [profile?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations();
  };

  const handleCancel = (res: Reservation) => {
    setSelectedRes(res);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!selectedRes) return;
    setCancelling(true);
    try {
      await cancelReservation(selectedRes.id, profile?.id!, profile?.name!);
      Toast.show({
        type: "success",
        text1: "Cancelled",
        text2: "Your reservation has been cancelled.",
      });
      setShowCancelModal(false);
      fetchReservations();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to cancel reservation.",
      });
    } finally {
      setCancelling(false);
    }
  };
  const openMap = (res: Reservation) => {
    const lat = res.doctor?.latitude || res.lab?.latitude;
    const lng = res.doctor?.longitude || res.lab?.longitude;
    if (lat && lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(url);
    } else {
      Toast.show({
        type: "info",
        text1: "No Location Data",
        text2: "This clinic hasn't provided coordinates yet.",
      });
    }
  };

  const getReservationStatus = (res: Reservation) => {
    const resDate = new Date(res.expectedTime || res.dateTime);
    const diffMs = resDate.getTime() - now.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const formattedTime = `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;

    if (res.exitTime) {
      return {
        status: "Completed",
        time: "00:00",
        color: COLORS.primary,
        icon: "check-circle",
      };
    }

    if (diffMs < 0) {
      if (!res.entryTime) {
        return {
          status: "Missed",
          time: "00:00",
          color: COLORS.error,
          icon: "event-busy",
        };
      }
      return {
        status: "Current",
        time: formattedTime,
        color: COLORS.tertiary,
        icon: "rotate-right",
      };
    }

    return {
      status: "Pending",
      time: formattedTime,
      color: COLORS.primary,
      icon: "schedule",
    };
  };

  const activeReservations = useMemo(() => {
    return reservations.filter((r) => r.status !== "cancelled");
  }, [reservations]);

  const currentRes = activeReservations[activeReservations.length - 1];

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Hero Status Section */}
          {currentRes ? (
            <View style={s.heroSection}>
              <LinearGradient
                colors={["rgba(28, 38, 55, 0.7)", "rgba(7, 14, 26, 0.8)"]}
                style={s.progressCard}
              >
                <View style={s.progressCardHeader}>
                  <View style={s.activeIndicator}>
                    <View style={s.pulseDot} />
                    <Text style={s.activeLabel}>ACTIVE SESSION</Text>
                  </View>
                  <Text style={s.queueTitle}>Queue Status</Text>
                  <Text style={s.queueSubtitle}>
                    {currentRes.doctor?.clinicName || currentRes.lab?.labName} •{" "}
                    {currentRes.lab ? "Lab" : "Room 402"}
                  </Text>
                </View>

                <View style={s.queueStats}>
                  <View>
                    <Text style={s.statLabel}>Your Position</Text>
                    <View style={s.statValueRow}>
                      <Text style={s.statValueMain}>
                        {currentRes.queuePosition
                          ?.toString()
                          .padStart(2, "0") || "03"}
                      </Text>
                      <Text style={s.statValueSub}>/ 12</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.statLabel}>Est. Wait Time</Text>
                    <View style={s.statValueRow}>
                      <Text style={s.statValueMainTime}>
                        {getReservationStatus(currentRes).time}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={s.progressBarContainer}>
                  <View style={s.progressBarBg}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryContainer]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        s.progressBarFill,
                        { width: currentRes.entryTime ? "75%" : "25%" },
                      ]}
                    />
                  </View>
                  <View style={s.progressSteps}>
                    <Text style={s.stepText}>CHECKED IN</Text>
                    <Text style={s.stepText}>NEXT UP</Text>
                    <Text style={s.stepText}>PROCEDURE</Text>
                  </View>
                </View>
              </LinearGradient>

              <View style={s.qrCard}>
                <View style={s.qrWrapper}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        JSON.stringify({
                          patientId: profile?.id,
                          reservationId: currentRes.id,
                          timestamp: now.toISOString(),
                        }),
                      )}`,
                    }}
                    style={s.qrImage}
                  />
                </View>
                <Text style={s.qrTitle}>Digital Check-in</Text>
                <Text style={s.qrSubtitle}>
                  Scan this code at the clinic kiosk or the room terminal to
                  confirm your arrival.
                </Text>
                <TouchableOpacity style={s.shareBtn}>
                  <MaterialIcons
                    name="share"
                    size={20}
                    color={COLORS.onPrimary}
                  />
                  <Text style={s.shareBtnText}>Share Pass</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.emptyState}>
              <MaterialIcons
                name="event-note"
                size={64}
                color="rgba(255,255,255,0.05)"
              />
              <Text style={s.emptyTitle}>No Active Reservations</Text>
              <Text style={s.emptySub}>
                Book a consultation or laboratory test to track your queue
                status here.
              </Text>
            </View>
          )}

          {currentRes && (
            <View style={s.bentoGrid}>
              <View style={s.bentoItem}>
                <View
                  style={[
                    s.bentoIcon,
                    { backgroundColor: "rgba(94, 216, 255, 0.1)" },
                  ]}
                >
                  <MaterialIcons
                    name="medical-services"
                    size={24}
                    color={COLORS.tertiary}
                  />
                </View>
                <View>
                  <Text style={s.bentoLabel}>APPOINTMENT</Text>
                  <Text style={s.bentoValue}>
                    {currentRes.selectedTest || "Consultation"}
                  </Text>
                  <Text style={s.bentoSub}>
                    {currentRes.doctor?.doctorName || "Lab Specialist"}
                  </Text>
                </View>
              </View>

              <View style={s.bentoItem}>
                <View
                  style={[
                    s.bentoIcon,
                    { backgroundColor: "rgba(197, 126, 255, 0.1)" },
                  ]}
                >
                  <MaterialIcons
                    name="map"
                    size={24}
                    color={COLORS.secondary}
                  />
                </View>
                <View>
                  <Text style={s.bentoLabel}>CLINIC LOCATION</Text>
                  <Text style={s.bentoValue}>
                    {currentRes.doctor?.clinicName || currentRes.lab?.labName}
                  </Text>
                  <Text style={s.bentoSub}>
                    {currentRes.doctor?.location || currentRes.lab?.location}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={s.bentoMapBtn}
                  onPress={() => openMap(currentRes)}
                >
                  <MaterialIcons name="directions" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={s.timelineSection}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Live Feed</Text>
              <View style={s.realtimeBadge}>
                <Text style={s.realtimeText}>REAL-TIME</Text>
              </View>
            </View>

            <View style={s.timeline}>
              {activeReservations.map((res, idx) => {
                const { status, color, icon } = getReservationStatus(res);
                const entityName =
                  res.doctor?.doctorName ||
                  res.lab?.labName ||
                  res.doctorName ||
                  res.labName;
                const entityClinic =
                  res.doctor?.clinicName ||
                  res.lab?.labName ||
                  res.clinicName ||
                  res.labName;
                const entityLocation =
                  res.doctor?.location || res.lab?.location || "Main Branch";
                const entityPhoto = res.doctor?.user?.photoURL || res.lab?.user?.photoURL || res.doctor?.photoURL || res.lab?.photoURL;

                return (
                  <View
                    key={res.id}
                    style={[s.timelineRow, { borderLeftColor: color }]}
                  >
                    <View style={s.timelineLeft}>
                      <View style={s.entityAvatarRing}>
                        <Image
                          source={
                            entityPhoto
                              ? { uri: entityPhoto }
                              : require("@/assets/doctor_default.png")
                          }
                          style={s.entityAvatar}
                        />
                      </View>
                    </View>

                    <View style={s.timelineContent}>
                      <View style={s.timelineHeader}>
                        <Text style={s.timelineTitle} numberOfLines={1}>
                          {entityName}
                        </Text>
                        <View style={[s.miniStatusBadge, { backgroundColor: `${color}15` }]}>
                          <Text style={[s.miniStatusText, { color }]}>{status.toUpperCase()}</Text>
                        </View>
                      </View>
                      
                      <Text style={s.timelineClinic} numberOfLines={1}>
                        {entityClinic} • {entityLocation}
                      </Text>

                      <View style={s.timelineDetailsRow}>
                        <View style={s.detailItem}>
                          <MaterialIcons name="event" size={12} color="rgba(255,255,255,0.4)" />
                          <Text style={s.detailText}>
                            {new Date(res.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(res.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        {res.selectedTest && (
                          <View style={s.detailItem}>
                            <MaterialIcons name="biotech" size={12} color="rgba(255,255,255,0.4)" />
                            <Text style={s.detailText}>{res.selectedTest}</Text>
                          </View>
                        )}
                      </View>

                      {res.symptoms && (
                        <View style={s.symptomsBox}>
                          <Text style={s.symptomsLabel}>Symptoms:</Text>
                          <Text style={s.symptomsText} numberOfLines={2}>{res.symptoms}</Text>
                        </View>
                      )}
                    </View>

                    <View style={s.timelineRight}>
                      {(res.doctor?.latitude || res.lab?.latitude) && (
                        <TouchableOpacity 
                          style={s.miniMapBtn}
                          onPress={() => openMap(res)}
                        >
                          <MaterialIcons name="map" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                      {status === "Pending" && (
                        <TouchableOpacity 
                          style={s.cancelIconBtn}
                          onPress={() => handleCancel(res)}
                        >
                          <MaterialIcons name="close" size={18} color={COLORS.error} />
                        </TouchableOpacity>
                      )}
                      <MaterialIcons name={icon as any} size={20} color={color} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBackdrop} />
          <View style={s.modalContainer}>
            <LinearGradient
              colors={["rgba(28, 38, 55, 0.98)", "rgba(7, 14, 26, 1)"]}
              style={s.modalContent}
            >
              <View style={s.modalHeader}>
                <View style={s.warningIconBox}>
                  <MaterialIcons name="warning" size={32} color={COLORS.error} />
                </View>
                <Text style={s.modalTitle}>Cancel Reservation?</Text>
                <Text style={s.modalSubtitle}>
                  This action will remove your spot in the queue and notify
                  other patients. This cannot be undone.
                </Text>
              </View>

              <View style={s.modalActions}>
                <TouchableOpacity
                  style={[s.modalBtn, s.modalBtnSecondary]}
                  onPress={() => setShowCancelModal(false)}
                  disabled={cancelling}
                >
                  <Text style={s.modalBtnTextSecondary}>Keep Reservation</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalBtn, s.modalBtnPrimary]}
                  onPress={confirmCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <ActivityIndicator color={COLORS.onPrimary} />
                  ) : (
                    <Text style={s.modalBtnTextPrimary}>Yes, Cancel Spot</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  scrollContent: { paddingHorizontal: 20 },
  heroSection: { gap: 20, marginBottom: 24 },
  progressCard: {
    borderRadius: 32,
    padding: 24,
    minHeight: 320,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  progressCardHeader: { gap: 4 },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  activeLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  queueTitle: {
    color: COLORS.onSurface,
    fontSize: 40,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
  },
  queueSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
  },
  queueStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  statLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    marginBottom: 4,
  },
  statValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  statValueMain: {
    color: COLORS.primary,
    fontSize: 64,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
    lineHeight: 64,
  },
  statValueMainTime: {
    color: COLORS.primary,
    fontSize: 32,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
    lineHeight: 64,
  },
  statValueSub: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
    opacity: 0.5,
  },
  progressBarContainer: { marginTop: 24 },
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 2 },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  stepText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
  },
  qrCard: {
    backgroundColor: "rgba(28, 38, 55, 0.4)",
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.1)",
    borderStyle: "dashed",
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: "#FFF",
    borderRadius: 24,
    marginBottom: 20,
  },
  qrImage: { width: 160, height: 160 },
  qrTitle: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
    marginBottom: 8,
  },
  qrSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  shareBtnText: { color: COLORS.onPrimary, fontSize: 14, fontWeight: "700" },
  bentoGrid: { flexDirection: "column", gap: 16, marginBottom: 32 },
  bentoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(28, 38, 55, 0.4)",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  bentoIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  bentoLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  bentoValue: { color: COLORS.onSurface, fontSize: 16, fontWeight: "700" },
  bentoSub: { color: "rgba(255,255,255,0.3)", fontSize: 12 },
  bentoMapBtn: {
    marginLeft: "auto",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  timelineSection: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.onSurface,
    fontSize: 22,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
  },
  realtimeBadge: {
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  realtimeText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  timeline: { gap: 12 },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(28, 38, 55, 0.4)",
    padding: 16,
    borderRadius: 24,
    borderLeftWidth: 4,
    gap: 12,
  },
  timelineLeft: {
    paddingTop: 4,
  },
  entityAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 2,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  entityAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  timelineContent: {
    flex: 1,
    gap: 4,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  timelineTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  miniStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniStatusText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  timelineClinic: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
  timelineDetailsRow: {
    flexDirection: "column",
    gap: 4,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "500",
  },
  symptomsBox: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  symptomsLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  symptomsText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 16,
  },
  timelineRight: {
    alignItems: "center",
    gap: 12,
    width: 32,
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  cancelIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 82, 82, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  miniMapBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: { fontSize: 10, fontWeight: "800" },
  cancelText: {
    color: COLORS.error,
    fontSize: 9,
    fontWeight: "700",
    opacity: 0.7,
  },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 16 },
  emptyTitle: { color: COLORS.onSurface, fontSize: 20, fontWeight: "800" },
  emptySub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalContent: {
    padding: 32,
    alignItems: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  warningIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 82, 82, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    lineHeight: 22,
  },
  modalActions: {
    width: "100%",
    gap: 12,
  },
  modalBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnPrimary: {
    backgroundColor: COLORS.error,
  },
  modalBtnSecondary: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalBtnTextPrimary: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  modalBtnTextSecondary: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },
});
