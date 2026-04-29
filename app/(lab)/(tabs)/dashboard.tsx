import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { ReservationCard } from "@/components/doctor/ReservationCard";
import { Play, Square, ChevronRight } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";

import {
  COLORS,
  FONT_SIZE,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
} from "@/lib/theme";
import { useAuthStore } from "@/stores/authStore";
import { getLabByUid, getLabDashboard } from "@/services/labService";
import { getPaginatedReservationsForLab } from "@/services/reservationService";

const { width } = Dimensions.get("window");

const DIAGNOSTIC_SERVICES = [
  {
    id: "FBC",
    label: "Full Blood Count",
    icon: "bloodtype",
    provider: MaterialIcons,
  },
  {
    id: "Glucose",
    label: "Glucose Tolerance",
    icon: "water-drop",
    provider: MaterialIcons,
  },
  {
    id: "MRI",
    label: "MRI Scan",
    icon: "settings-overscan",
    provider: MaterialIcons,
  },
  {
    id: "Metabolic",
    label: "Metabolic Panel",
    icon: "biotech",
    provider: MaterialIcons,
  },
  {
    id: "Lipids",
    label: "Lipid Profile",
    icon: "opacity",
    provider: MaterialIcons,
  },
  {
    id: "Microbiology",
    label: "Microbiology",
    icon: "bug-report",
    provider: MaterialIcons,
  },
  {
    id: "Immunology",
    label: "Immunology",
    icon: "shield",
    provider: MaterialIcons,
  },
  {
    id: "Hormones",
    label: "Hormone Panel",
    icon: "medical-services",
    provider: MaterialIcons,
  },
  {
    id: "Genetics",
    label: "Genetic Screening",
    icon: "dna",
    provider: FontAwesome5,
  },
  {
    id: "Pathology",
    label: "Histopathology",
    icon: "biotech",
    provider: MaterialIcons,
  },
  {
    id: "Toxicology",
    label: "Toxicology",
    icon: "science",
    provider: MaterialIcons,
  },
  {
    id: "Urinalysis",
    label: "Urinalysis",
    icon: "water",
    provider: MaterialIcons,
  },
];

export default function LabDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: lab, refetch: refetchLab } = useQuery({
    queryKey: ["lab", user?.uid],
    queryFn: () => getLabByUid(user!.uid),
    enabled: !!user,
  });

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["labDashboard"],
    queryFn: getLabDashboard,
    enabled: !!user,
  });

  const {
    data: paginatedData,
    isLoading: loading,
    refetch: refetchReservations,
    isRefetching: refreshing,
  } = useQuery({
    queryKey: ["reservations", "lab", "today", "next-3"],
    queryFn: () => getPaginatedReservationsForLab(new Date(), 1, 3, true),
    enabled: !!user,
  });

  const activeReservations = paginatedData?.reservations || [];
  const totalReservations = paginatedData?.total || 0;

  const onRefresh = () => {
    refetchDashboard();
    refetchReservations();
    refetchLab();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Queue Pipeline Section */}
        <View style={styles.pipelineHeader}>
          <Text style={styles.pipelineTitle}>QUEUE PIPELINE</Text>
          {totalReservations > 3 && (
            <TouchableOpacity
              onPress={() => router.push("/(lab)/(tabs)/queue")}
              style={styles.viewMoreInline}
            >
              <Text style={styles.viewMoreInlineText}>VIEW FULL QUEUE</Text>
              <MaterialIcons
                name="chevron-right"
                size={14}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.pipelineList}>
          {activeReservations.length > 0 ? (
            activeReservations.map((item, idx) => (
              <ReservationCard
                key={item.id}
                reservation={item}
                position={idx + 1}
                role="lab"
                onPress={() =>
                  router.push({
                    pathname: "/(lab)/patient-analysis",
                    params: { patientId: item.patientId },
                  } as any)
                }
                onViewDetails={() =>
                  router.push(`/(lab)/patient-details/${item.patientId}` as any)
                }
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Pipeline Clear</Text>
              <Text style={styles.emptySubtext}>
                No pending laboratory analysis sessions.
              </Text>
            </View>
          )}

          {totalReservations > 3 && (
            <TouchableOpacity
              style={styles.viewMoreCard}
              onPress={() => router.push("/(lab)/(tabs)/queue")}
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

        {/* Available Analysis */}
        <LinearGradient
          colors={["rgba(17, 26, 40, 0.8)", "rgba(28, 38, 55, 0.8)"]}
          style={styles.availableCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Available Analysis</Text>
            <MaterialIcons name="fact-check" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.badgeContainer}>
            {dashboardData?.availableAnalysis.map((item: any, idx: number) => {
              const service = DIAGNOSTIC_SERVICES.find(
                (s) => s.id === item.id || s.label === item.name,
              );
              const IconProvider = service?.provider || MaterialIcons;
              const iconName = service?.icon || "science";

              return (
                <View key={idx} style={styles.analysisBadge}>
                  <IconProvider
                    name={iconName as any}
                    size={14}
                    color={COLORS.primary}
                  />
                  <View>
                    <Text style={styles.analysisBadgeText}>{item.name}</Text>
                    <Text style={styles.analysisCostText}>${item.cost}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        {/* Pending Data Sets */}
        <LinearGradient
          colors={["rgba(17, 26, 40, 0.8)", "rgba(28, 38, 55, 0.8)"]}
          style={styles.uploadsCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Data Sets</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.uploadGrid}>
            {dashboardData?.recentUploads.map((upload: any, idx: number) => (
              <View key={idx} style={styles.uploadItem}>
                <View style={styles.uploadIconRow}>
                  <MaterialIcons
                    name={upload.type === "image" ? "visibility" : "biotech"}
                    size={24}
                    color={idx % 2 === 0 ? COLORS.primary : COLORS.secondary}
                  />
                  <View
                    style={[
                        styles.typeBadge,
                        {
                          backgroundColor:
                            idx % 2 === 0
                              ? "rgba(64, 206, 243, 0.1)"
                              : "rgba(197, 126, 255, 0.1)",
                        },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        {
                          color:
                            idx % 2 === 0 ? COLORS.primary : COLORS.secondary,
                        },
                      ]}
                    >
                      {upload.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.uploadFileName} numberOfLines={1}>
                  {upload.fileName}
                </Text>
                <Text style={styles.uploaderText}>
                  Clinical Segment Propagated
                </Text>
                <TouchableOpacity style={styles.reviewButton}>
                  <Text style={styles.reviewButtonText}>Review Segment</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Node Sync */}
        <LinearGradient
          colors={["rgba(17, 26, 40, 0.8)", "rgba(28, 38, 55, 0.8)"]}
          style={styles.syncCard}
        >
          <View style={styles.syncHeader}>
            <View>
              <Text style={styles.syncTitle}>Node Sync</Text>
              <Text style={styles.syncSubtitle}>
                Real-time telemetry across laboratory clusters.
              </Text>
            </View>
            <View style={styles.syncCircle}>
              <Text style={styles.syncPercent}>
                {dashboardData?.stats.syncIntegrity}%
              </Text>
              <Text style={styles.syncLabel}>INTEGRITY</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.optimizeButton}>
            <Text style={styles.optimizeButtonText}>OPTIMIZE CLUSTERS</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  scrollView: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 40,
    marginBottom: 32,
  },
  envText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: {
    color: COLORS.onSurface,
    fontSize: 32,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
    letterSpacing: -1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  appointmentsCard: {
    padding: 24,
    marginBottom: 24,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  cardTitle: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  patientAvatarWrapper: {
    position: "relative",
    marginRight: 12,
  },
  patientAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  serviceIconOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1c2637",
    zIndex: 10,
  },
  patientInfo: {
    flex: 1,
    justifyContent: "center",
  },
  patientName: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
    marginBottom: 2,
  },
  testTypeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  testType: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
  },
  rightSection: {
    alignItems: "flex-end",
    gap: 6,
    paddingLeft: 12,
  },
  timeContainer: {
    alignItems: "flex-end",
    gap: 2,
  },
  dateText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  timeText: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(64, 206, 243, 0.1)",
    minWidth: 70,
    alignItems: "center",
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  availableCard: {
    padding: 24,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 24,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  analysisBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(64, 206, 243, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.15)",
    gap: 6,
  },
  analysisBadgeText: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  analysisCostText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.body,
    fontWeight: "600",
  },
  equipmentItem: { marginBottom: 16 },
  eqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eqInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  eqName: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  eqPercent: {
    color: COLORS.onSurface,
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 2 },

  metricsCard: {
    flex: 1,
    padding: 20,
    borderRadius: RADIUS.xl,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  metricsLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
    marginBottom: 8,
  },
  metricsValue: {
    color: COLORS.onSurface,
    fontSize: 32,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  trendText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.body,
    fontWeight: "700",
  },

  uploadsCard: {
    padding: 24,
    marginBottom: 24,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.headline,
  },
  uploadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  uploadItem: {
    width: "48%",
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  uploadIconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: {
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "900",
  },
  uploadFileName: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
    marginBottom: 4,
  },
  uploaderText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontFamily: FONT_FAMILY.body,
    opacity: 0.5,
    marginBottom: 12,
  },
  reviewButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  reviewButtonText: {
    color: COLORS.onSurface,
    fontSize: 10,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },

  syncCard: {
    padding: 24,
    marginBottom: 40,
    flexDirection: "column",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  syncHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  syncTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  syncSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    opacity: 0.6,
    maxWidth: "70%",
  },
  syncCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  syncPercent: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "900",
  },
  syncLabel: {
    color: COLORS.onSurfaceVariant,
    fontSize: 6,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "900",
  },
  optimizeButton: {
    borderWidth: 1,
    borderColor: "rgba(64, 206, 243, 0.3)",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  optimizeButtonText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "900",
    letterSpacing: 2,
  },
  scanAction: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  scanActionActive: {
    backgroundColor: COLORS.tertiary,
  },
  pipelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 20,
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
  emptyCard: { padding: 40, alignItems: "center", gap: 12 },
  emptyText: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.headline,
  },
  emptySubtext: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
  },
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
});
