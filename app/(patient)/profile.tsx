import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  LogOut,
  User,
  Mail,
  Phone,
  Camera,
  Shield,
  Droplets,
  Calendar,
  FileText,
  Syringe,
  StickyNote,
  Activity,
} from "lucide-react-native";
import { Avatar } from "@/components/ui/Avatar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuthStore } from "@/stores/authStore";
import { getDiagnosesForPatient } from "@/services/diagnosisService";
import { COLORS, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from "@/lib/theme";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";
import { useQuery } from "@tanstack/react-query";
import type { PatientUser } from "@/types/user";

export default function PatientProfile() {
  const { profile, logout, user } = useAuthStore();

  const { data: diagnoses = [] } = useQuery({
    queryKey: ["diagnoses", user?.uid],
    queryFn: () => getDiagnosesForPatient(user!.uid),
    enabled: !!user?.uid,
  });

  const latestDiagnosis = diagnoses[0] as any;
  const allVaccines = diagnoses.flatMap((d: any) => d.vaccines ?? []);
  const allFiles = diagnoses.flatMap((d: any) => d.analysisFiles ?? []);
  const recentActivities = diagnoses.slice(0, 3).map((d: any) => ({
    date: d.visitDate
      ? new Date(d.visitDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
    title: d.notes?.split(".")[0] ?? "Consultation",
    sub: d.prescriptions ?? "No prescriptions noted.",
  }));

  const handleLogout = () =>
    Alert.alert("Secure Termination", "Terminate the current session?", [
      { text: "Cancel", style: "cancel" },
      { text: "Terminate", style: "destructive", onPress: logout },
    ]);

  if (!profile) return null;
  const patientProfile = profile as PatientUser;

  const VITALS = [
    {
      label: "Blood Pressure",
      value: patientProfile.patient?.bloodPressure ?? "—/—",
      unit: "",
    },
    {
      label: "Heart Rate",
      value: patientProfile.patient?.heartRate ?? "—",
      unit: "bpm",
    },
    {
      label: "Glucose",
      value: patientProfile.patient?.glucose ?? "—",
      unit: "mg/dL",
    },
    { label: "SpO₂", value: patientProfile.patient?.spo2 ?? "—", unit: "%" },
  ];

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* Header */}
          <View style={s.appBar}>
            <Text style={s.appBarLabel}>VITREOUS CLINIC</Text>
            <Text style={s.appBarTitle}>{profile.name}</Text>
            <Text style={s.appBarSub}>
              {patientProfile.patient?.age ?? "34"} years •{" "}
              {patientProfile.patient?.gender ?? "Patient"}
            </Text>
          </View>

          {/* Vitals Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.vitalsRow}
          >
            {VITALS.map((v, i) => (
              <GlassCard
                key={i}
                style={s.vitalCard}
                variant="subtle"
                radius={RADIUS.xl}
              >
                <Text style={s.vitalValue}>{v.value}</Text>
                <Text style={s.vitalUnit}>{v.unit}</Text>
                <Text style={s.vitalLabel}>{v.label}</Text>
              </GlassCard>
            ))}
          </ScrollView>

          {/* Avatar Section */}
          <View style={s.avatarSection}>
            <View style={s.avatarWrap}>
              <Avatar
                uri={profile.photoURL}
                name={profile.name}
                size={100}
                borderColor="rgba(64,206,243,0.1)"
              />
              <TouchableOpacity style={s.cameraBtn}>
                <Camera size={14} color={COLORS.onPrimary} />
              </TouchableOpacity>
            </View>
            <View style={s.statusBadge}>
              <Shield size={10} color={COLORS.primary} />
              <Text style={s.statusText}>VERIFIED MEMBER</Text>
            </View>
          </View>

          {/* Personal Metadata */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>PERSONAL METADATA</Text>
            <GlassCard style={s.infoCard} variant="subtle" radius={RADIUS.xl}>
              {[
                {
                  icon: <User size={16} />,
                  label: "FULL NAME",
                  value: profile.name,
                },
                {
                  icon: <Mail size={16} />,
                  label: "SYSTEM EMAIL",
                  value: profile.email,
                },
                {
                  icon: <Phone size={16} />,
                  label: "PRIMARY MOBILE",
                  value: profile.mobile,
                },
                {
                  icon: <Droplets size={16} />,
                  label: "BLOOD TYPE",
                  value: patientProfile.patient?.bloodType ?? "—",
                },
                {
                  icon: <Calendar size={16} />,
                  label: "DATE OF BIRTH",
                  value: patientProfile.patient?.dateOfBirth ?? "—",
                },
              ].map((p, i) => (
                <View key={i} style={[s.infoRow, i > 0 && s.infoRowDivider]}>
                  <View style={s.infoIconWrap}>
                    {React.cloneElement(p.icon as React.ReactElement<any>, {
                      color: COLORS.primary,
                    })}
                  </View>
                  <View style={s.infoText}>
                    <Text style={s.infoLabel}>{p.label}</Text>
                    <Text style={s.infoValue}>{p.value}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </View>

          {/* Active Diagnoses */}
          {latestDiagnosis && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>ACTIVE DIAGNOSES</Text>
              <Text style={s.sectionSub}>
                Condition management and treatment history
              </Text>
              <GlassCard style={s.diagCard} variant="subtle" radius={RADIUS.xl}>
                <Text style={s.diagTitle}>
                  {latestDiagnosis.notes?.split(".")[0] ?? "Ongoing Condition"}
                </Text>
                <Text style={s.diagDetail}>
                  {latestDiagnosis.notes ?? "No additional notes."}
                </Text>
                {latestDiagnosis.prescriptions && (
                  <Text style={s.diagPrescription}>
                    Rx: {latestDiagnosis.prescriptions}
                  </Text>
                )}
                <Text style={s.diagDate}>
                  Last review:{" "}
                  {latestDiagnosis.visitDate
                    ? new Date(latestDiagnosis.visitDate).toLocaleDateString(
                        "en-US",
                        { month: "long", day: "numeric", year: "numeric" },
                      )
                    : "—"}
                </Text>
              </GlassCard>
            </View>
          )}

          {/* Lab Analysis Files */}
          {allFiles.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>LAB ANALYSIS</Text>
              <GlassCard style={s.listCard} variant="subtle" radius={RADIUS.xl}>
                {allFiles.slice(0, 4).map((f: any, i: number) => (
                  <View key={i} style={[s.fileRow, i > 0 && s.divider]}>
                    <View style={s.fileIconWrap}>
                      <FileText size={16} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.fileName}>{f.fileName}</Text>
                      <Text style={s.fileMeta}>
                        {f.uploadedAt
                          ? new Date(f.uploadedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}{" "}
                        • {f.type?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}
              </GlassCard>
            </View>
          )}

          {/* Vaccines */}
          {allVaccines.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>VACCINES</Text>
              <GlassCard style={s.listCard} variant="subtle" radius={RADIUS.xl}>
                {allVaccines.slice(0, 4).map((v: any, i: number) => (
                  <View key={i} style={[s.fileRow, i > 0 && s.divider]}>
                    <View style={s.fileIconWrap}>
                      <Syringe size={16} color={COLORS.tertiary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.fileName}>{v.name}</Text>
                      <Text style={s.fileMeta}>
                        Administered {v.date}
                        {v.nextDueDate ? ` • Due: ${v.nextDueDate}` : ""}
                      </Text>
                    </View>
                    {!v.nextDueDate && (
                      <View style={s.doneBadge}>
                        <Text style={s.doneBadgeText}>Done</Text>
                      </View>
                    )}
                    {v.nextDueDate && (
                      <View style={s.dueBadge}>
                        <Text style={s.dueBadgeText}>Due</Text>
                      </View>
                    )}
                  </View>
                ))}
              </GlassCard>
            </View>
          )}

          {/* Patient Notes */}
          {latestDiagnosis?.consultationNote && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>PATIENT NOTES</Text>
              <GlassCard
                style={s.notesCard}
                variant="subtle"
                radius={RADIUS.xl}
              >
                <StickyNote size={16} color={COLORS.primary} />
                <Text style={s.notesText}>
                  "{latestDiagnosis.consultationNote}"
                </Text>
              </GlassCard>
            </View>
          )}

          {/* Recent Activity */}
          {recentActivities.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeaderRow}>
                <Activity size={14} color={COLORS.primary} />
                <Text style={s.sectionTitle}>RECENT ACTIVITY</Text>
              </View>
              <GlassCard style={s.listCard} variant="subtle" radius={RADIUS.xl}>
                {recentActivities.map((a, i) => (
                  <View key={i} style={[s.activityRow, i > 0 && s.divider]}>
                    <View style={s.activityDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.activityDate}>{a.date}</Text>
                      <Text style={s.activityTitle}>{a.title}</Text>
                      <Text style={s.activitySub}>{a.sub}</Text>
                    </View>
                  </View>
                ))}
              </GlassCard>
            </View>
          )}

          {/* Access Control */}
          <View style={s.section}>
            <TouchableOpacity
              onPress={handleLogout}
              style={s.logoutBtn}
              activeOpacity={0.8}
            >
              <LogOut size={18} color={COLORS.error} />
              <Text style={s.logoutText}>Terminate Current Session</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footerVersion}>
            <Text style={s.versionText}>
              ENGINE VERSION 4.2.0 • VITREOUS PRECISION
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 80 },
  appBar: { paddingHorizontal: SPACING.xl, paddingTop: 24, gap: 4 },
  appBarLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
  appBarTitle: {
    color: COLORS.onSurface,
    fontSize: 30,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -1,
  },
  appBarSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
  },
  vitalsRow: { paddingHorizontal: SPACING.xl, paddingVertical: 20, gap: 12 },
  vitalCard: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    minWidth: 90,
    gap: 2,
  },
  vitalValue: {
    color: COLORS.onSurface,
    fontSize: 20,
    fontFamily: FONT_FAMILY.display,
    letterSpacing: -0.5,
  },
  vitalUnit: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
  },
  vitalLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  avatarSection: { alignItems: "center", gap: 12, paddingBottom: 28 },
  avatarWrap: { position: "relative" },
  cameraBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#070e1a",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  section: { paddingHorizontal: SPACING.xl, marginBottom: 28, gap: 10 },
  sectionTitle: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 2,
  },
  sectionSub: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoCard: { padding: 4, backgroundColor: "rgba(255,255,255,0.02)" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 14 },
  infoRowDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.03)",
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1, gap: 2 },
  infoLabel: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 8,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
  infoValue: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  diagCard: { padding: 18, backgroundColor: "rgba(64,206,243,0.03)", gap: 8 },
  diagTitle: {
    color: COLORS.onSurface,
    fontSize: 16,
    fontFamily: FONT_FAMILY.headline,
  },
  diagDetail: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 20,
  },
  diagPrescription: {
    color: COLORS.secondary,
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },
  diagDate: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
  },
  listCard: { padding: 4, backgroundColor: "rgba(255,255,255,0.02)" },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.03)" },
  fileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  fileMeta: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontFamily: FONT_FAMILY.body,
  },
  doneBadge: {
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  doneBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
  },
  dueBadge: {
    backgroundColor: "rgba(197,126,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dueBadgeText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
  },
  notesCard: { padding: 18, backgroundColor: "rgba(64,206,243,0.03)", gap: 10 },
  notesText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 22,
    fontStyle: "italic",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 14,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  activityDate: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 0.5,
  },
  activityTitle: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  activitySub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    borderRadius: RADIUS.xl,
    backgroundColor: "rgba(235,87,87,0.05)",
    justifyContent: "center",
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 13,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 0.5,
  },
  footerVersion: { alignItems: "center", paddingTop: 24, paddingBottom: 8 },
  versionText: {
    color: "rgba(255,255,255,0.1)",
    fontSize: 9,
    fontFamily: FONT_FAMILY.label,
    letterSpacing: 1,
  },
});
