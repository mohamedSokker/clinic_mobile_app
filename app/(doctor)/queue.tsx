import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  QrCode,
  PlayCircle,
  CheckCircle2,
  Users,
  Activity,
  ChevronRight,
} from "lucide-react-native";
import { ReservationCard } from "@/components/doctor/ReservationCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuthStore } from "@/stores/authStore";
import { getDoctorByUid } from "@/services/doctorService";
import {
  subscribeToQueue,
  updateReservationStatus,
} from "@/services/reservationService";
import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import type { Reservation } from "@/types/reservation";
import Toast from "react-native-toast-message";
import { useQuery } from "@tanstack/react-query";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";

const { width } = Dimensions.get("window");

function QRDisplay({ value }: { value: string }) {
  return (
    <GlassCard style={styles.qrDisplay} variant="primary" radius={RADIUS.xl}>
      <View style={styles.qrHeader}>
        <Activity size={14} color={COLORS.primary} />
        <Text style={styles.qrHeaderLabel}>ACCESS PROTOCOL ACTIVE</Text>
      </View>
      <View style={styles.qrContent}>
        <View style={styles.qrIconWrapper}>
          <QrCode size={80} color={COLORS.primary} />
        </View>
        <View style={styles.qrInfo}>
          <Text style={styles.qrIdLabel}>NODE_ID</Text>
          <Text style={styles.qrIdValue}>{value.substring(0, 16)}...</Text>
          <Text style={styles.qrHint}>
            Secure scanning enabled for clinical authentication.
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

export default function DoctorQueue() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [queue, setQueue] = useState<Reservation[]>([]);
  const [callingNext, setCallingNext] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const { data: doctor, isLoading: loading } = useQuery({
    queryKey: ["doctor", user?.uid],
    queryFn: () => getDoctorByUid(user!.uid),
    enabled: !!user,
  });

  useEffect(() => {
    if (!doctor) return;
    const today = new Date();
    return subscribeToQueue(doctor.id, today, (res) => {
      setQueue(res.filter((r) => r.status !== "cancelled"));
    });
  }, [doctor]);

  const currentPatient = queue.find((r) => r.status === "inside");
  const nextPatient = queue.find(
    (r) => r.status === "waiting" || r.status === "confirmed",
  );

  const handleCallNext = async () => {
    if (!nextPatient) return;
    setCallingNext(true);
    try {
      if (currentPatient) {
        await updateReservationStatus(currentPatient.id, "done");
      }
      await updateReservationStatus(nextPatient.id, "inside");
      Toast.show({
        type: "success",
        text1: `✅ Called ${nextPatient.patientName}`,
      });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to update queue" });
    } finally {
      setCallingNext(false);
    }
  };

  const qrValue = doctor
    ? `clinic:${doctor.id}:${new Date().toISOString().split("T")[0]}`
    : "";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Operations Header */}
        <View style={styles.appBar}>
          <View>
            <Text style={styles.appBarLabel}>OPERATIONS CENTER</Text>
            <Text style={styles.appBarTitle}>Queue Tracker</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowQR(!showQR)}
            style={[styles.appBarIcon, showQR && styles.appBarIconActive]}
          >
            <QrCode
              size={24}
              color={showQR ? COLORS.onPrimary : "rgba(255,255,255,0.4)"}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={queue}
          keyExtractor={(r) => r.id}
          ListHeaderComponent={() => (
            <>
              {/* Access Protocol */}
              {showQR && (
                <View style={styles.qrContainer}>
                  <QRDisplay value={qrValue} />
                </View>
              )}

              {/* Status Banner */}
              <View style={styles.statusBanner}>
                <View style={styles.statusItem}>
                  <Users size={16} color={COLORS.primary} />
                  <Text style={styles.statusValue}>{queue.length}</Text>
                  <Text style={styles.statusLabel}>QUEUED</Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusItem}>
                  <Activity size={16} color={COLORS.secondary} />
                  <Text style={styles.statusValue}>
                    {queue.filter((r) => r.status === "waiting").length}
                  </Text>
                  <Text style={styles.statusLabel}>WAITING</Text>
                </View>
              </View>

              {/* Now Serving */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>NOW SERVING</Text>
              </View>

              {currentPatient ? (
                <View style={styles.servingContainer}>
                  <GlassCard
                    style={styles.servingCard}
                    variant="primary"
                    radius={RADIUS.xl}
                  >
                    <View style={styles.servingHeader}>
                      <View style={styles.servingPulse} />
                      <Text style={styles.servingHeaderLabel}>
                        SESSION IN PROGRESS
                      </Text>
                    </View>
                    <View style={styles.servingContent}>
                      <View style={styles.servingInfo}>
                        <Text style={styles.servingName}>
                          {currentPatient.patientName.toUpperCase()}
                        </Text>
                        <Text style={styles.servingId}>
                          PID_
                          {currentPatient.patientId
                            .substring(0, 8)
                            .toUpperCase()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          router.push(
                            `/(doctor)/patient/${currentPatient.patientId}` as any,
                          )
                        }
                        style={styles.servingAction}
                      >
                        <Text style={styles.servingActionText}>
                          DIAGNOSTICS
                        </Text>
                        <ChevronRight size={14} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                </View>
              ) : (
                <View style={styles.servingEmpty}>
                  <Text style={styles.servingEmptyText}>No active session</Text>
                </View>
              )}

              {/* Call Next Action */}
              {nextPatient && (
                <View style={styles.callNextContainer}>
                  <GradientButton
                    onPress={handleCallNext}
                    label={`COMMENCE SESSION: ${nextPatient.patientName.toUpperCase()}`}
                    loading={callingNext}
                    size="lg"
                    variant="secondary"
                    icon={<PlayCircle size={20} color="#fff" />}
                  />
                </View>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>QUEUE PIPELINE</Text>
              </View>
            </>
          )}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: SPACING.xl, marginBottom: 8 }}>
              <ReservationCard
                reservation={item}
                position={item.queuePosition}
                onPress={() =>
                  router.push(`/(doctor)/patient/${item.patientId}` as any)
                }
              />
            </View>
          )}
          ListEmptyComponent={() =>
            !loading ? (
              <View style={styles.empty}>
                <CheckCircle2 size={40} color="rgba(255,255,255,0.05)" />
                <Text style={styles.emptyText}>Pipeline Synchronized</Text>
                <Text style={styles.emptySubtext}>
                  All clinical appointments have been concluded.
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
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
    paddingBottom: 24,
  },
  appBarLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
  appBarTitle: {
    color: COLORS.onSurface,
    fontSize: 32,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -1,
  },
  appBarIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  appBarIconActive: { backgroundColor: COLORS.primary },

  qrContainer: { paddingHorizontal: SPACING.xl, marginBottom: 32 },
  qrDisplay: {
    padding: 24,
    gap: 20,
    backgroundColor: "rgba(64, 206, 243, 0.05)",
  },
  qrHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  qrHeaderLabel: {
    color: COLORS.primary,
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  qrContent: { flexDirection: "row", gap: 24, alignItems: "center" },
  qrIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  qrInfo: { flex: 1, gap: 4 },
  qrIdLabel: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
  },
  qrIdValue: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: FONT_FAMILY.display,
  },
  qrHint: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 18,
  },

  statusBanner: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    marginBottom: 32,
    gap: 24,
    alignItems: "center",
  },
  statusItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusValue: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.display,
  },
  statusLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  statusDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  sectionHeader: { paddingHorizontal: SPACING.xl, marginBottom: 16 },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.2)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },

  servingContainer: { paddingHorizontal: SPACING.xl, marginBottom: 32 },
  servingCard: {
    padding: 20,
    gap: 16,
    backgroundColor: "rgba(64, 206, 243, 0.08)",
  },
  servingHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  servingPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  servingHeaderLabel: {
    color: COLORS.primary,
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  servingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servingInfo: { gap: 2 },
  servingName: {
    color: COLORS.onSurface,
    fontSize: 24,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -0.5,
  },
  servingId: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
  },
  servingAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  servingActionText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
  },

  servingEmpty: {
    marginHorizontal: SPACING.xl,
    padding: 32,
    borderRadius: RADIUS.xl,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    marginBottom: 32,
  },
  servingEmptyText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
  },

  callNextContainer: { paddingHorizontal: SPACING.xl, marginBottom: 40 },

  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 16,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
    letterSpacing: -0.5,
  },
  emptySubtext: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
  },
});
