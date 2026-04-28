import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Activity,
  FileText,
  Syringe,
  Check,
  Zap,
  Wind,
  FolderOpen,
  Calendar,
  ChevronLeft,
} from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { getPatientFullProfile } from "@/services/doctorService";
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_FAMILY,
  GRADIENTS,
  FONT_SIZE,
} from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { useQuery } from "@tanstack/react-query";
import type { PatientUser } from "@/types/user";
import { useRouter, useLocalSearchParams } from "expo-router";
import { format, formatDistanceToNow } from "date-fns";

const { width: SW } = Dimensions.get("window");

export default function PatientDetailsScreen() {
  const router = useRouter();
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const PREVIEW_LIMIT = 3;
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    data: fullProfile,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["patientFullProfile", patientId],
    queryFn: () => getPatientFullProfile(patientId),
    enabled: !!patientId,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading || !fullProfile) {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const { profile, reservations, diagnoses } = fullProfile;
  const patientProfile = profile;

  const vitals = [
    {
      label: "Blood Pressure",
      val: patientProfile.patient?.bloodPressure || "—",
      unit: "",
      color: COLORS.primary,
    },
    {
      label: "Heart Rate",
      val: patientProfile.patient?.heartRate || "—",
      unit: "bpm",
      color: COLORS.primary,
    },
    {
      label: "Blood Sugar",
      val: patientProfile.patient?.glucose || "—",
      unit: "mg/dL",
      color: COLORS.error,
    },
    {
      label: "Oxygen Sat",
      val: patientProfile.patient?.spo2 || "—",
      unit: "%",
      color: COLORS.primary,
    },
  ];

  const timelineEvents = [
    ...diagnoses.flatMap((d: any) => [
      {
        date: new Date(d.visitDate),
        title: d.notes?.split("\n")[0] || "Consultation Completed",
        sub: `Dr. ${d.doctor?.doctorName || "Specialist"}`,
        type: "consultation",
      },
      ...(d.analysisFiles || []).map((f: any) => ({
        date: new Date(f.uploadedAt),
        title: "Lab Results Uploaded",
        sub: f.fileName,
        type: "file",
      })),
      ...(d.vaccines || []).map((v: any) => ({
        date: new Date(d.visitDate), // Approximated to visit date
        title: "Prescription Renewed",
        sub: v.name,
        type: "medication",
      })),
    ]),
    ...reservations
      .filter((r: any) => r.status !== "cancelled")
      .map((r: any) => ({
        date: new Date(r.dateTime),
        title: r.labId ? "Lab Reservation" : "Doctor Appointment",
        sub: `${r.lab?.labName || r.doctor?.doctorName || "Main Clinic"} • ${r.status.toUpperCase()}`,
        type: "reservation",
        status: r.status,
      })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const visibleEvents = timelineEvents.slice(0, PREVIEW_LIMIT);
  const hasMore = timelineEvents.length > visibleEvents.length;

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />

      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Patient Hero */}
          <View style={s.hero}>
            {/* <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity> */}

            <View style={s.patientIdBadge}>
              <Text style={s.patientIdText}>
                PATIENT ID: {patientId.toUpperCase()}
              </Text>
            </View>
            <Text style={s.patientName}>{profile.name}</Text>
            <Text style={s.patientSub}>
              {patientProfile.patient?.age || "—"} years •{" "}
              {patientProfile.patient?.gender || "—"} •{" "}
              {diagnoses[0]?.notes?.split("\n")[0] || "No Active Diagnosis"}
            </Text>
          </View>

          {/* Quick Vitals Grid */}
          <View style={s.section}>
            <View style={s.vitalsGrid}>
              {vitals.map((v, i) => (
                <View key={i} style={s.vitalCard}>
                  <Text style={s.vitalLabel}>{v.label}</Text>
                  <Text style={[s.vitalValue, { color: v.color }]}>
                    {v.val}
                    <Text style={s.vitalUnit}> {v.unit}</Text>
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Active Diagnoses Bento */}
          <View style={s.section}>
            <GlassCard style={s.bentoCard}>
              <View style={s.bentoHeader}>
                <View style={{ flex: 1, flexShrink: 1, paddingRight: 12 }}>
                  <Text style={s.bentoTitle} numberOfLines={2}>
                    Active Diagnoses
                  </Text>
                  <Text style={s.bentoSub} numberOfLines={2}>
                    Condition management and treatment history
                  </Text>
                </View>
                <View style={{ flexShrink: 0 }}>
                  {/* <TouchableOpacity style={s.addBadge}>
                    <Plus size={14} color={COLORS.primary} />
                    <Text style={s.addBadgeText}>Add New</Text>
                  </TouchableOpacity> */}
                </View>
              </View>

              <View style={s.diagList}>
                {diagnoses.length > 0 ? (
                  diagnoses.map((d: any, i: number) => (
                    <View key={i} style={s.diagRow}>
                      <View
                        style={[
                          s.diagIconWrap,
                          {
                            backgroundColor:
                              i === 0
                                ? "rgba(64,206,243,0.1)"
                                : "rgba(197,126,255,0.1)",
                          },
                        ]}
                      >
                        {i === 0 ? (
                          <Activity size={20} color={COLORS.primary} />
                        ) : (
                          <Wind size={20} color={COLORS.secondary} />
                        )}
                      </View>
                      <View style={s.diagContent}>
                        <View style={s.diagRowHeader}>
                          <Text style={s.diagName}>
                            {d.notes?.split("\n")[0] || "Ongoing Management"}
                          </Text>
                          <View
                            style={[
                              s.statusTag,
                              {
                                backgroundColor:
                                  i === 0
                                    ? "rgba(64,206,243,0.15)"
                                    : "rgba(255,255,255,0.05)",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                s.statusTagText,
                                { color: i === 0 ? COLORS.primary : "#94a3b8" },
                              ]}
                              numberOfLines={1}
                            >
                              {i === 0 ? "CHRONIC" : "STABLE"}
                            </Text>
                          </View>
                        </View>
                        <Text style={s.diagDesc} numberOfLines={2}>
                          {d.notes || "No detailed notes provided."}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={s.emptyText}>No records yet</Text>
                )}
              </View>

              <TouchableOpacity
                style={s.viewAllBtn}
                onPress={() => router.push(`/(doctor)/patient-details/${patientId}/diagnoses` as any)}
              >
                <Text style={s.viewAllText}>Full Log</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* Lab & Vaccines Bento */}
          <View style={[s.section, s.rowSection]}>
            <GlassCard style={[s.bentoCard, { flex: 1 }]}>
              <View style={s.iconTitleRow}>
                <FolderOpen size={18} color={COLORS.primary} />
                <Text style={s.bentoTitleSmall}>Lab Analysis</Text>
              </View>
              <View style={s.fileList}>
                {(patientProfile.patient?.analysisFiles || []).length > 0 ? (
                  patientProfile.patient?.analysisFiles
                    ?.slice(0, 3)
                    .map((f: any, i: number) => (
                      <TouchableOpacity key={i} style={s.fileItem}>
                        <MaterialIcons
                          name={f.type === "image" ? "image" : "picture-as-pdf"}
                          size={20}
                          color="#94a3b8"
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={s.fileName} numberOfLines={1}>
                            {f.fileName}
                          </Text>
                          <Text style={s.fileMeta}>
                            {format(new Date(f.uploadedAt), "MMM dd, yyyy")}
                          </Text>
                        </View>
                        <MaterialIcons
                          name="chevron-right"
                          size={20}
                          color="#94a3b8"
                        />
                      </TouchableOpacity>
                    ))
                ) : (
                  <Text style={s.emptyTextSmall}>No record yet</Text>
                )}
              </View>
              <TouchableOpacity
                style={s.viewAllBtn}
                onPress={() => router.push(`/(doctor)/patient-details/${patientId}/lab-analysis` as any)}
              >
                <Text style={s.viewAllText}>VIEW ALL FILES</Text>
              </TouchableOpacity>
            </GlassCard>

            <GlassCard style={[s.bentoCard, { flex: 1 }]}>
              <View style={s.iconTitleRow}>
                <Syringe size={18} color={COLORS.primary} />
                <Text style={s.bentoTitleSmall}>Vaccines</Text>
              </View>
              <View style={s.vaccineList}>
                {diagnoses.flatMap((d: any) => d.vaccines || []).length > 0 ? (
                  diagnoses
                    .flatMap((d: any) => d.vaccines || [])
                    .slice(0, 2)
                    .map((v: any, i: number) => (
                      <View key={i} style={s.vaccineItem}>
                        <View
                          style={[
                            s.vaccineBar,
                            {
                              backgroundColor:
                                i === 0
                                  ? COLORS.primary
                                  : "rgba(148,163,184,0.3)",
                            },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={s.vaccineName} numberOfLines={1}>
                            {v.name}
                          </Text>
                          <Text style={s.vaccineDate}>
                            Administered{" "}
                            {format(
                              new Date(diagnoses[0].visitDate),
                              "MMM dd, yyyy",
                            )}
                          </Text>
                        </View>
                      </View>
                    ))
                ) : (
                  <Text style={s.emptyTextSmall}>No record yet</Text>
                )}
              </View>
              <TouchableOpacity
                style={s.viewAllBtn}
                onPress={() => router.push(`/(doctor)/patient-details/${patientId}/vaccines` as any)}
              >
                <Text style={s.viewAllText}>Full Log</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity style={s.historyLink}>
                <History size={14} color={COLORS.primary} />
                <Text style={s.historyLinkText}>Full Log</Text>
              </TouchableOpacity> */}
            </GlassCard>
          </View>

          {/* Profile Sidebar & Activity Timeline */}
          <View style={s.section}>
            <View style={s.profileNotesCard}>
              <Image
                source={{
                  uri:
                    // profile.photoURL ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBjEtffrKm-AzdH-FOK9F8QIFEF1qdTcHNj_fdUXAhuS8inixoWgOj_WVziwYdAQAAUM1fqn7wq3L0FVpqV8jx3_0l8hpRxPc8nOWHvyN1ILiDXPPMINl3CpPfxepOrOicebeNCo1HoXRv46a9nw1SpKzTmHn8Z77s43akcIUI9D6GDhh1ctIiDlGJHAwQVS8vML56CapjuuEUT1qHIxac-YURYLgR6vCVULrG1quR3ud0XkG3J4eGU6rM50atIUc7ehqnBvH_NfA",
                }}
                style={s.heroImg}
              />
              <LinearGradient
                colors={["transparent", "rgba(7,14,26,0.9)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.notesOverlay}>
                <GlassCard style={s.notesBubble}>
                  <Text style={s.notesLabel}>
                    PATIENT NOTES{" "}
                    {diagnoses[0]?.doctor?.doctorName
                      ? `• DR. ${diagnoses[0].doctor.doctorName.toUpperCase()}`
                      : ""}
                  </Text>
                  <Text style={s.notesItalic}>
                    "
                    {diagnoses[0]?.notes ||
                      "No clinical notes recorded for this patient yet."}
                    "
                  </Text>
                </GlassCard>
              </View>
            </View>
          </View>

          <View style={s.section}>
            <GlassCard style={s.bentoCard}>
              <View style={s.iconTitleRow}>
                <Activity size={18} color={COLORS.primary} />
                <Text style={s.bentoTitleSmall}>Recent Activity</Text>
              </View>

              <View style={s.timeline}>
                {visibleEvents.length > 0 ? (
                  <>
                    {visibleEvents.map((e, i) => (
                      <View key={i} style={s.timelineItem}>
                        <View style={s.timelineThread}>
                          <View
                            style={[
                              s.threadLine,
                              i === 0 && s.threadLineFirst,
                              i === visibleEvents.length - 1 &&
                                !hasMore &&
                                s.threadLineLast,
                            ]}
                          />
                          <View
                            style={[
                              s.threadNode,
                              e.type === "consultation" && s.threadNodeActive,
                            ]}
                          >
                            {e.type === "consultation" ? (
                              <Check size={12} color={COLORS.onPrimary} />
                            ) : e.type === "reservation" ? (
                              <Calendar
                                size={12}
                                color={
                                  e.status === "cancelled"
                                    ? COLORS.error
                                    : COLORS.primary
                                }
                              />
                            ) : (
                              <FileText size={10} color="#94a3b8" />
                            )}
                          </View>
                        </View>
                        <View style={s.timelineContent}>
                          <Text
                            style={[
                              s.timelineDate,
                              e.type === "consultation" && {
                                color: COLORS.primary,
                              },
                            ]}
                          >
                            {formatDistanceToNow(e.date, {
                              addSuffix: true,
                            }).toUpperCase()}
                          </Text>
                          <Text style={s.timelineTitle}>{e.title}</Text>
                          <Text style={s.timelineSub}>{e.sub}</Text>
                        </View>
                      </View>
                    ))}
                    {hasMore && (
                      <TouchableOpacity
                        style={s.loadMoreBtn}
                        onPress={() => router.push(`/(doctor)/patient-details/${patientId}/activity` as any)}
                      >
                        <Text style={s.loadMoreText}>VIEW MORE ACTIVITY</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={s.emptyTextSmall}>No recent activity yet</Text>
                )}
              </View>
            </GlassCard>
          </View>

          <View style={s.footerSpace} />
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 120 },
  hero: { paddingHorizontal: 24, paddingTop: 32, marginBottom: 32 },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 24,
  },
  patientIdBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  patientIdText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "800",
    letterSpacing: 1,
  },
  patientName: {
    color: COLORS.onSurface,
    fontSize: 44,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
    letterSpacing: -1,
  },
  patientSub: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    marginTop: 4,
  },

  heroActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(28,38,55,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  editBtnText: { color: COLORS.onSurface, fontSize: 14, fontWeight: "600" },
  newConsultBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  newConsultBtnText: {
    color: COLORS.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  section: { paddingHorizontal: 24, marginBottom: 24 },
  rowSection: { flexDirection: "column", gap: 16 },

  vitalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  vitalCard: {
    width: (SW - 60) / 2,
    backgroundColor: "rgba(12,19,33,0.8)",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  vitalLabel: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 28,
    fontFamily: FONT_FAMILY.headline,
    fontWeight: "800",
  },
  vitalUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(164, 171, 188, 0.5)",
  },

  bentoCard: { padding: 24, borderRadius: 24 },
  bentoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  bentoTitle: { color: COLORS.onSurface, fontSize: 22, fontWeight: "700" },
  bentoSub: { color: "rgba(164, 171, 188, 0.6)", fontSize: 13 },
  addBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBadgeText: { color: COLORS.primary, fontSize: 11, fontWeight: "700" },

  diagList: { gap: 16 },
  diagRow: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  diagIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  diagContent: { flex: 1, overflow: "hidden" },
  diagRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
    width: "100%",
  },
  diagName: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    flexShrink: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  statusTagText: { fontSize: 9, fontWeight: "900" },
  diagDesc: { color: "rgba(164, 171, 188, 0.6)", fontSize: 13, lineHeight: 18 },
  diagMeta: {
    color: "rgba(164, 171, 188, 0.4)",
    fontSize: 10,
    fontWeight: "700",
  },

  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  bentoTitleSmall: { color: COLORS.onSurface, fontSize: 18, fontWeight: "700" },
  fileList: { gap: 12 },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 12,
  },
  fileName: { color: COLORS.onSurface, fontSize: 13, fontWeight: "600" },
  fileMeta: {
    color: "rgba(164, 171, 188, 0.5)",
    fontSize: 10,
    textTransform: "uppercase",
  },
  viewAllBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
  },
  viewAllText: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  vaccineList: { gap: 16 },
  vaccineItem: { flexDirection: "row", gap: 12 },
  vaccineBar: { width: 4, borderRadius: 2 },
  vaccineName: { color: COLORS.onSurface, fontSize: 14, fontWeight: "700" },
  vaccineDate: { color: "rgba(164, 171, 188, 0.6)", fontSize: 12 },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  historyLinkText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },

  profileNotesCard: {
    height: 260,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroImg: { ...StyleSheet.absoluteFillObject },
  notesOverlay: { padding: 16 },
  notesBubble: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(23,32,48,0.8)",
  },
  notesLabel: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  notesItalic: {
    color: COLORS.onSurface,
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 20,
  },

  timeline: { marginTop: 8 },
  timelineItem: { flexDirection: "row", gap: 16 },
  timelineThread: { width: 24, alignItems: "center" },
  threadLine: {
    position: "absolute",
    width: 2,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  threadLineFirst: { top: 12 },
  threadLineLast: { bottom: 0, height: 12 },
  threadNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(28,38,55,1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  threadNodeActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timelineContent: { flex: 1, paddingBottom: 24 },
  timelineDate: {
    color: "rgba(164, 171, 188, 0.6)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timelineTitle: { color: COLORS.onSurface, fontSize: 14, fontWeight: "700" },
  timelineSub: {
    color: "rgba(164, 171, 188, 0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  footerSpace: { height: 100 },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "rgba(7,14,26,0.8)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 24,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  navItem: { alignItems: "center", gap: 4 },
  navItemActive: {
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 4,
  },
  navText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  fab: {
    position: "absolute",
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "rgba(164, 171, 188, 0.4)",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  emptyTextSmall: {
    color: "rgba(164, 171, 188, 0.4)",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 10,
  },
  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
