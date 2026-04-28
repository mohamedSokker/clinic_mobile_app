import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Syringe,
  History,
  ShieldCheck,
  ChevronLeft,
  Calendar,
  Info,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getPatientDiagnosesLog } from "@/services/doctorService";
import { COLORS, SPACING, RADIUS, FONT_FAMILY, GRADIENTS } from "@/lib/theme";
import { GlassCard } from "@/components/ui/GlassCard";
import { BackgroundDecor } from "@/components/ui/BackgroundDecor";

export default function VaccinesScreen() {
  const router = useRouter();
  const { id: patientId } = useLocalSearchParams<{ id: string }>();

  const [page, setPage] = React.useState(1);
  const [allVaccines, setAllVaccines] = React.useState<any[]>([]);

  const { data: diagnosesData, isLoading } = useQuery({
    queryKey: ["vaccines-history", patientId, page],
    queryFn: () => getPatientDiagnosesLog(patientId, page, 10),
    enabled: !!patientId,
  });

  React.useEffect(() => {
    if (diagnosesData?.diagnoses) {
      const newVaccines = diagnosesData.diagnoses.flatMap((d: any) =>
        (d.vaccines || []).map((v: any) => ({
          ...v,
          visitDate: d.visitDate,
          doctorName: d.doctor?.doctorName,
        })),
      );

      if (page === 1) {
        setAllVaccines(newVaccines);
      } else {
        setAllVaccines((prev) => [...prev, ...newVaccines]);
      }
    }
  }, [diagnosesData]);

  const hasMore = diagnosesData ? page < diagnosesData.totalPages : false;

  return (
    <View style={s.container}>
      <LinearGradient
        colors={GRADIENTS.background as any}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundDecor />
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.intro}>
            <Text style={s.introTitle}>Vaccination History</Text>
            <Text style={s.introSub}>
              Track the patient's immunizations, boosters, and upcoming health
              maintenance schedule.
            </Text>
          </View>

          {isLoading && page === 1 ? (
            <Text style={s.statusText}>Loading records...</Text>
          ) : allVaccines.length === 0 ? (
            <GlassCard style={s.emptyCard}>
              <Syringe size={48} color="rgba(164, 171, 188, 0.2)" />
              <Text style={s.emptyText}>No immunizations recorded yet.</Text>
            </GlassCard>
          ) : (
            <View style={s.list}>
              {allVaccines.map((v: any, i: number) => (
                <GlassCard key={i} style={s.vaxCard}>
                  <View style={s.vaxHeader}>
                    <View style={s.vaxIconWrap}>
                      <Syringe size={24} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.vaxName}>{v.name}</Text>
                      <View style={s.tagRow}>
                        <View style={s.vaxTag}>
                          <ShieldCheck size={10} color={COLORS.primary} />
                          <Text style={s.vaxTagText}>COMPLETED</Text>
                        </View>
                        {v.dose && (
                          <View style={s.doseTag}>
                            <Text style={s.doseTagText}>{v.dose}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={s.vaxInfo}>
                    <View style={s.infoItem}>
                      <Calendar size={14} color="rgba(164, 171, 188, 0.5)" />
                      <View>
                        <Text style={s.infoLabel}>ADMINISTERED</Text>
                        <Text style={s.infoValue}>
                          {format(new Date(v.visitDate), "MMMM dd, yyyy")}
                        </Text>
                      </View>
                    </View>

                    <View style={s.infoItem}>
                      <Info size={14} color="rgba(164, 171, 188, 0.5)" />
                      <View>
                        <Text style={s.infoLabel}>PROVIDER</Text>
                        <Text style={s.infoValue}>
                          Dr. {v.doctorName || "Specialist"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {v.nextDueDate && (
                    <View style={s.nextDueRow}>
                      <Text style={s.nextDueLabel}>Next Dose Recommended:</Text>
                      <Text style={s.nextDueValue}>
                        {format(new Date(v.nextDueDate), "MMM yyyy")}
                      </Text>
                    </View>
                  )}
                </GlassCard>
              ))}

              {hasMore && (
                <TouchableOpacity
                  style={s.loadMoreBtn}
                  onPress={() => setPage((p) => p + 1)}
                  disabled={isLoading}
                >
                  <Text style={s.loadMoreText}>
                    {isLoading ? "Loading..." : "Load More Vaccines"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070e1a" },

  scrollContent: { padding: 24, paddingBottom: 100 },
  intro: { marginBottom: 32 },
  introTitle: {
    color: COLORS.onSurface,
    fontSize: 32,
    fontWeight: "800",
    fontFamily: FONT_FAMILY.headline,
    letterSpacing: -0.5,
  },
  introSub: {
    color: "rgba(164, 171, 188, 0.7)",
    fontSize: 16,
    marginTop: 8,
    lineHeight: 24,
  },
  list: { gap: 16 },
  vaxCard: { borderRadius: 24, padding: 20 },
  vaxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  vaxIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(64,206,243,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  vaxName: { color: COLORS.onSurface, fontSize: 18, fontWeight: "700" },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  vaxTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vaxTagText: { color: COLORS.primary, fontSize: 9, fontWeight: "900" },
  doseTag: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  doseTagText: { color: "#94a3b8", fontSize: 9, fontWeight: "700" },
  vaxInfo: { gap: 15, marginBottom: 20 },
  infoItem: { flexDirection: "row", gap: 12 },
  infoLabel: {
    color: "rgba(164, 171, 188, 0.4)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoValue: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  nextDueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  nextDueLabel: { color: "rgba(164, 171, 188, 0.6)", fontSize: 12 },
  nextDueValue: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  statusText: {
    color: "rgba(164, 171, 188, 0.5)",
    textAlign: "center",
    marginTop: 40,
  },
  emptyCard: { alignItems: "center", padding: 60, borderRadius: 30, gap: 20 },
  emptyText: {
    color: "rgba(164, 171, 188, 0.4)",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadMoreBtn: {
    backgroundColor: "rgba(64,206,243,0.1)",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(64,206,243,0.2)",
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
