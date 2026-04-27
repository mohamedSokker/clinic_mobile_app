import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  FileText,
  Download,
  ShieldCheck,
  Stethoscope,
  FlaskConical,
  Syringe,
  FileDigit,
  Ghost,
  Bell,
  Share,
} from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuthStore } from "@/stores/authStore";
import { getDiagnosesForPatient } from "@/services/diagnosisService";
import {
  COLORS,
  SPACING,
  FONT_FAMILY,
  GRADIENTS,
  RADIUS,
  FONT_SIZE,
} from "@/lib/theme";
import { useQuery } from "@tanstack/react-query";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { format, formatDistanceToNow } from "date-fns";
import { PatientUser } from "@/types/user";

type RecordType = "all" | "diagnosis" | "lab" | "vaccine";

export default function HistoryScreen() {
  const { user, profile } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<RecordType>("all");

  const {
    data: diagnosesData,
    isLoading: loading,
    refetch,
    isRefetching: refreshing,
  } = useQuery({
    queryKey: ["diagnoses", user?.uid],
    queryFn: () => getDiagnosesForPatient(1, 50), // Fetch many for history for now or implement pagination
    enabled: !!user?.uid,
  });

  const rawDiagnoses = diagnosesData?.diagnoses || [];

  const timelineEvents = useMemo(() => {
    const events: any[] = [];

    rawDiagnoses.forEach((d: any) => {
      // Add the diagnosis itself
      events.push({
        id: `diag-${d.id}`,
        type: "diagnosis",
        date: new Date(d.visitDate),
        title: d.notes?.split("\n")[0] || "Clinical Consultation",
        subtitle: `Dr. ${d.doctor?.doctorName || d.doctor?.user?.name || "Specialist"}`,
        content: d.notes,
        prescriptions: d.prescriptions,
      });

      // Add vaccines from this visit
      d.vaccines?.forEach((v: any) => {
        events.push({
          id: `vac-${v.id}`,
          type: "vaccine",
          date: new Date(v.date || d.visitDate),
          title: v.name,
          subtitle: "Immunization Unit",
          batch: v.dose ? `Dose: ${v.dose}` : "Standard Dose",
        });
      });

      // Add lab reports from this visit
      d.analysisFiles?.forEach((f: any) => {
        events.push({
          id: `file-${f.id}`,
          type: "lab",
          date: new Date(f.uploadedAt || d.visitDate),
          title: f.fileName,
          subtitle: f.lab?.labName || "Diagnostic Lab",
          file: f,
          metrics: [
            { label: "Type", value: f.type?.toUpperCase() || "FILE" },
            { label: "Status", value: "Verified" },
          ],
        });
      });
    });

    return events
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .filter((e) => activeFilter === "all" || e.type === activeFilter);
  }, [rawDiagnoses, activeFilter]);

  const lastCheckupText = useMemo(() => {
    if (rawDiagnoses.length === 0) return "No record yet";
    try {
      return formatDistanceToNow(new Date(rawDiagnoses[0].visitDate), {
        addSuffix: true,
      });
    } catch {
      return "No record yet";
    }
  }, [rawDiagnoses]);

  const renderTimelineItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const isFirst = index === 0;
    const isLast = index === timelineEvents.length - 1;

    return (
      <View style={styles.timelineItem}>
        <View style={styles.threadContainer}>
          <View
            style={[
              styles.threadLine,
              isFirst && styles.threadLineFirst,
              isLast && styles.threadLineLast,
            ]}
          />
          <View
            style={[
              styles.threadNode,
              { borderColor: getIconColor(item.type) },
            ]}
          >
            {getIcon(item.type, 18)}
          </View>
        </View>

        <View style={styles.eventContent}>
          <GlassCard style={styles.eventCard} variant="subtle">
            <View style={styles.eventHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.eventLabel,
                    { color: getIconColor(item.type) },
                  ]}
                >
                  {format(item.date, "MMM dd, yyyy")} • {item.subtitle}
                </Text>
                <Text style={styles.eventTitle}>{item.title}</Text>
              </View>
              <View
                style={[
                  styles.typeTag,
                  {
                    backgroundColor: `${getIconColor(item.type)}15`,
                    borderColor: `${getIconColor(item.type)}30`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeTagText,
                    { color: getIconColor(item.type) },
                  ]}
                >
                  {item.type.toUpperCase()}
                </Text>
              </View>
            </View>

            {item.type === "diagnosis" && (
              <>
                <Text style={styles.eventBody} numberOfLines={3}>
                  {item.content || "No notes provided."}
                </Text>
                {item.prescriptions && (
                  <View style={styles.prescRow}>
                    <View style={styles.prescBadge}>
                      <MaterialIcons
                        name="medication"
                        size={14}
                        color="rgba(255,255,255,0.4)"
                      />
                      <Text style={styles.prescText}>{item.prescriptions}</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {item.type === "lab" && (
              <>
                <View style={styles.metricsGrid}>
                  {item.metrics.map((m: any, idx: number) => (
                    <View key={idx} style={styles.metricBox}>
                      <Text style={styles.metricLabel}>{m.label}</Text>
                      <Text style={styles.metricValue}>{m.value}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.fileAction}>
                  <View style={styles.fileIconWrap}>
                    <FileDigit size={16} color={COLORS.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileName}>{item.file.fileName}</Text>
                    <Text style={styles.fileMeta}>
                      {item.file.type.toUpperCase()} •{" "}
                      {format(new Date(item.file.uploadedAt), "HH:mm")}
                    </Text>
                  </View>
                  <Download size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </>
            )}

            {item.type === "vaccine" && (
              <View style={styles.vaccineDetails}>
                <MaterialIcons
                  name="vaccines"
                  size={14}
                  color="rgba(255,255,255,0.3)"
                />
                <Text style={styles.vaccineLocation}>{item.batch}</Text>
              </View>
            )}
          </GlassCard>
        </View>
      </View>
    );
  };

  const patientProfile = profile as PatientUser;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <View style={{ flex: 1 }}>
        <FlatList
          data={timelineEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderTimelineItem}
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <View style={styles.hero}>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color={COLORS.primary} />
                  <Text style={styles.verifiedText}>
                    PATIENT IDENTITY VERIFIED
                  </Text>
                </View>
                <Text style={styles.heroTitle}>
                  Clinical{" "}
                  <Text style={styles.heroTitleHighlight}>History</Text>
                </Text>
                <Text style={styles.heroSub}>
                  A comprehensive, immutable ledger of your diagnostic journey
                  and biometric data.
                </Text>
              </View>

              <View style={styles.filtersContainer}>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={[
                    { id: "all", label: "All Records" },
                    { id: "diagnosis", label: "Diagnoses" },
                    { id: "lab", label: "Lab Reports" },
                    { id: "vaccine", label: "Vaccinations" },
                  ]}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => setActiveFilter(item.id as RecordType)}
                      style={[
                        styles.filterChip,
                        activeFilter === item.id && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          activeFilter === item.id &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.filtersInner}
                />
              </View>

              <GlassCard style={styles.summaryCard}>
                <LinearGradient
                  colors={["rgba(64,206,243,0.12)", "transparent"]}
                  style={styles.summaryGlow}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                <Text style={styles.summaryLabel}>PATIENT SUMMARY</Text>
                <View style={styles.summaryRows}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.statKey}>Blood Type</Text>
                    <Text style={styles.statVal}>
                      {patientProfile?.bloodType || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.statKey}>Diagnoses</Text>
                    <Text style={styles.statVal}>
                      {rawDiagnoses.length.toString().padStart(2, "0")}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.statKey}>Last Checkup</Text>
                    <Text style={styles.statVal}>{lastCheckupText}</Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          )}
          ListEmptyComponent={() =>
            !loading && (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ghost size={32} color="rgba(255,255,255,0.05)" />
                </View>
                <Text style={styles.emptyText}>No record yet</Text>
                <Text style={styles.emptySub}>
                  Your medical pipeline is currently empty. Visit a doctor to
                  begin your diagnostic ledger.
                </Text>
              </View>
            )
          }
          ListFooterComponent={() => (
            <View style={styles.footer}>
              <GlassCard style={styles.exportCard}>
                <View style={styles.exportInfo}>
                  <Text style={styles.exportTitle}>Data Export</Text>
                  <Text style={styles.exportSub}>
                    Export your full medical ledger in encrypted HIPAA-compliant
                    format.
                  </Text>
                </View>
                <GradientButton
                  label="Export Records"
                  variant="primary"
                  size="md"
                  onPress={() => {}}
                  textStyle={{ color: COLORS.onPrimary, fontWeight: "700" }}
                  icon={<Share size={16} color={COLORS.onPrimary} />}
                />
              </GlassCard>

              <GlassCard style={styles.promoCard}>
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCljPISIBf2R04mkQNomdgNpI0d6mrWNZYpvKdOmyGKdjJW-hh7LslExhR1XtPnvdU1DxIbbc0Y-uzAxY-LKKeyLqaTDWmygAGWOlTCVHIdcuhaKZh71DHMAsGuSllY5A6lGXUKFlG6wHV7h6ZHYySn70221q0SuodD2MhP4AD5kEdtBssxeGI5vDK0FahdTZCebaUnKnPWSh3CUH8rsM7uLaAAsEkag9JwZcUZ7UGsDKh4DJfRoSurAyl3u_pEP-vpTMziLw27cg",
                  }}
                  style={styles.promoImg}
                />
                <LinearGradient
                  colors={["transparent", "rgba(7, 14, 26, 0.9)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.promoContent}>
                  <Text style={styles.promoTitle}>
                    Premium Wellness Insights
                  </Text>
                  <Text style={styles.promoSub}>
                    Unlock AI-driven analysis of your biometric trends.
                  </Text>
                </View>
              </GlassCard>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refetch()}
              tintColor={COLORS.primary}
            />
          }
        />
      </View>
    </View>
  );
}

const getIcon = (type: string, size: number) => {
  switch (type) {
    case "diagnosis":
      return <Stethoscope size={size} color={COLORS.primary} />;
    case "lab":
      return <FlaskConical size={size} color={COLORS.secondary} />;
    case "vaccine":
      return <Syringe size={size} color={COLORS.tertiary} />;
    default:
      return <FileText size={size} color={COLORS.primary} />;
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case "diagnosis":
      return COLORS.primary;
    case "lab":
      return COLORS.secondary;
    case "vaccine":
      return COLORS.tertiary;
    default:
      return COLORS.primary;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070e1a" },
  header: { paddingBottom: 24 },
  hero: { paddingHorizontal: 24, marginTop: 32, marginBottom: 32 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(64,206,243,0.2)",
  },
  verifiedText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    color: COLORS.onSurface,
    fontSize: 42,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
    letterSpacing: -1,
  },
  heroTitleHighlight: { color: COLORS.primary },
  heroSub: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 24,
    marginTop: 8,
  },

  filtersContainer: { marginBottom: 24 },
  filtersInner: { paddingHorizontal: 24, gap: 10 },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    fontWeight: "600",
  },
  filterChipTextActive: { color: COLORS.onPrimary, fontWeight: "700" },

  summaryCard: {
    marginHorizontal: 24,
    padding: 32,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(64,206,243,0.2)",
  },
  summaryGlow: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  summaryLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "900",
    letterSpacing: 3.5,
    marginBottom: 24,
  },
  summaryRows: { gap: 16 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    paddingBottom: 12,
  },
  statVal: {
    color: "#fff",
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  statKey: {
    color: "#94a3b8",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  timelineItem: { flexDirection: "row", paddingHorizontal: 24 },
  threadContainer: { width: 60, alignItems: "center" },
  threadLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  threadLineFirst: { top: 32 },
  threadLineLast: { bottom: 0, height: 32 },
  threadNode: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#070e1a",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    zIndex: 10,
  },

  eventContent: { flex: 1, paddingBottom: 24 },
  eventCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  eventLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  eventTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeTagText: {
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "900",
  },

  eventBody: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 20,
    marginBottom: 16,
  },
  prescRow: { flexDirection: "row" },
  prescBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  prescText: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    fontWeight: "500",
  },

  metricsGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  metricBox: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  metricLabel: {
    color: "rgba(164, 171, 188, 0.5)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metricValue: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },

  fileAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 16,
  },
  fileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(215, 56, 59, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "600",
  },
  fileMeta: {
    color: "rgba(164, 171, 188, 0.4)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
  },

  vaccineDetails: { flexDirection: "row", alignItems: "center", gap: 8 },
  vaccineLocation: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },

  footer: { paddingHorizontal: 24, marginTop: 24, gap: 16 },
  exportCard: { padding: 24, borderRadius: 24, gap: 20 },
  exportInfo: { gap: 8 },
  exportTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  exportSub: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 18,
  },

  promoCard: {
    height: 180,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 20,
  },
  promoImg: { ...StyleSheet.absoluteFillObject },
  promoContent: { zIndex: 10 },
  promoTitle: {
    color: COLORS.onSurface,
    fontSize: 18,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  promoSub: {
    color: "rgba(164, 171, 188, 0.8)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },

  empty: { alignItems: "center", paddingVertical: 100, gap: 16 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "700",
  },
  emptySub: {
    color: "rgba(164, 171, 188, 0.5)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
